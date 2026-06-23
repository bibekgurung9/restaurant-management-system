import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service";
import prisma from "../../config/database";
import { checkLowStockAndNotify } from "../../helpers/checkLowStockAndNotify";

// ❌ NO LOGGING - Read-only
export const pendingOrderList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as string) || "pending";

  try {
    const orders = await prisma.order.findMany({
      where: { status },
      select: {
        id: true,
        total_amount: true,
        payment_mode: true,
        status: true,
        guests: true,
        createdAt: true,
        table: { select: { name: true, id: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalOrders = await prisma.order.count({ where: { status } });
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = orders.map((order) => ({
      id: order.id,
      table: order.table ? { name: order.table.name, id: order.table.id } : null,
      totalAmount: order.total_amount,
      paymentMode: order.payment_mode,
      status: order.status,
      guests: order.guests,
    }));

    const meta = { page, limit, totalOrders, totalPages };
    return successResponse(res, `${status} order list retrieved successfully`, paginatedOrders, meta);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return failureResponse(res, "Failed to fetch orders", 500);
  }
};

// ❌ NO LOGGING - Read-only
export const orderDetails = async (req: Request, res: Response): Promise<void> => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) return failureResponse(res, "Invalid order ID", 400);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { id: true, name: true, capacity: true } },
        order_items: {
          select: {
            id: true,
            itemId: true,
            comboId: true,
            quantity: true,
            price: true,
            unit: true,
            item: { select: { id: true, name: true, price: true } },
            combo: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });

    if (!order) return failureResponse(res, "Order not found", 404);

    const groupedItems = order.order_items.reduce((acc, item) => {
      let itemDetails: any = {};

      if (item.itemId && item.unit !== "combo") {
        itemDetails = {
          id: item.id,
          itemId: item.itemId,
          itemName: item.item?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.quantity * item.price,
          unit: item.unit,
          type: "item",
        };
      } else if (!item.itemId && item.unit === "combo") {
        itemDetails = {
          id: item.id,
          comboId: item.comboId,
          comboName: item.combo?.name || "Unknown Combo",
          quantity: item.quantity,
          price: item.combo?.price || 0,
          totalPrice: item.quantity * (item.combo?.price || 0),
          unit: item.unit,
          type: "combo",
        };
      }

      if (Object.keys(itemDetails).length > 0) acc.push(itemDetails);
      return acc;
    }, [] as any[]);

    const fullOrderDetails = {
      id: order.id,
      table: order.table ? { name: order.table.name, id: order.table.id, capacity: order.table.capacity } : null,
      totalAmount: order.total_amount,
      paymentMode: order.payment_mode,
      guests: order.guests,
      items: groupedItems,
      status: order.status,
      cancelReason: order.cancelReason,
    };

    return successResponse(res, "Order details retrieved successfully", fullOrderDetails);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return failureResponse(res, "Failed to fetch order details", 500);
  }
};

// ✅ YES - LOG THIS (Order created - financial transaction)
export const orderCreate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, items, guestCount } = req.body;
    const parsedTableId = parseInt(tableId);

    if (!tableId || !items || !Array.isArray(items) || items.length === 0 || guestCount === undefined) {
      return failureResponse(res, "Invalid request body", 400);
    }
    if (guestCount <= 0) return failureResponse(res, "Guest count must be greater than zero", 400);

    let table = await prisma.table.findUnique({ where: { id: parsedTableId } });
    if (!table) return failureResponse(res, "Table not found", 404);

    if (table.status === "occupied") {
      table = await prisma.table.findFirst({ where: { status: "available" } });
      if (!table) return failureResponse(res, "No available tables", 404);
    }

    const order = await prisma.order.create({
      data: { tableId: table.id, total_amount: 0, guests: guestCount },
    });

    let orderItemErrors: string[] = [];
    const orderItemsPromises = items.map(async (item: any) => {
      const { itemId, comboId, quantity } = item;
      if ((!itemId && !comboId) || !quantity || quantity <= 0) {
        orderItemErrors.push("Invalid item in the request");
        return null;
      }

      let unit = "";
      let price = 0;

      if (itemId) {
        const item = await prisma.item.findUnique({ where: { id: parseInt(itemId) } });
        if (!item) {
          orderItemErrors.push(`Product with ID ${itemId} not found`);
          return null;
        }
        unit = "food";
        price = item.price;

        if (item.isLimited) {
          const inventory = await prisma.inventory.findUnique({ where: { itemId: parseInt(itemId) } });
          if (!inventory || inventory.quantity < quantity) {
            orderItemErrors.push(`Not enough stock for item: ${item.name}`);
            return null;
          }
          await prisma.inventory.update({
            where: { itemId: parseInt(itemId) },
            data: { quantity: inventory.quantity - quantity, lastUpdated: new Date() },
          });
          if (inventory.quantity <= inventory.threshold) {
            console.warn(`Product ${item.name} is below threshold. Current stock: ${inventory.quantity}`);
          }
        }
      } else if (comboId) {
        const combo = await prisma.combo.findUnique({ where: { id: parseInt(comboId) } });
        if (!combo) {
          orderItemErrors.push(`Combo with ID ${comboId} not found`);
          return null;
        }
        unit = "combo";
        price = combo.price;
      }

      return await prisma.orderItem.create({
        data: {
          orderId: order.id,
          itemId: itemId ? parseInt(itemId) : null,
          comboId: comboId ? parseInt(comboId) : null,
          quantity,
          unit,
          price,
        },
      });
    });

    const orderItems = await Promise.all(orderItemsPromises);
    if (orderItemErrors.length > 0) {
      await prisma.order.delete({ where: { id: order.id } });
      return failureResponse(res, orderItemErrors.join(", "), 400);
    }

    const validOrderItems = orderItems.filter((item) => item !== null);
    if (validOrderItems.length === 0) {
      await prisma.order.delete({ where: { id: order.id } });
      return failureResponse(res, "No valid items to create the order", 400);
    }

    const totalAmount = validOrderItems.reduce((total, item) => total + item!.price * item!.quantity, 0);
    await prisma.order.update({ where: { id: order.id }, data: { total_amount: totalAmount } });
    await prisma.table.update({ where: { id: table.id }, data: { status: "occupied" } });

    // ✅ LOG - Order created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "ORDER",
      entityId: order.id,
      changes: {
        tableId: table.id,
        tableName: table.name,
        guestCount,
        totalAmount,
        itemCount: validOrderItems.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await checkLowStockAndNotify();
    return successResponse(res, "Order processed successfully", { status: "success", orderId: order.id });
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Internal Server Error", 500);
  }
};

// ✅ YES - LOG THIS (Order updated - modifications)
export const orderUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return failureResponse(res, "Invalid order ID", 400);

    const { tableId, items, guests, cancelOrder, cancelReason } = req.body;

    if (!cancelOrder && (!tableId || !items || !Array.isArray(items) || items.length === 0 || !guests)) {
      return failureResponse(res, "Invalid request body", 400);
    }
    if (!cancelOrder && guests <= 0) return failureResponse(res, "Guest count must be greater than zero", 400);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true, order_items: true },
    });
    if (!order) return failureResponse(res, "Order not found", 404);

    // Handle cancellation
    if (cancelOrder) {
      if (!cancelReason || cancelReason.trim() === "") return failureResponse(res, "Cancel reason is required", 400);
      for (const orderItem of order.order_items) {
        if (orderItem.itemId) {
          const inventory = await prisma.inventory.findUnique({ where: { itemId: orderItem.itemId } });
          if (inventory) {
            await prisma.inventory.update({
              where: { itemId: orderItem.itemId },
              data: { quantity: inventory.quantity + orderItem.quantity, lastUpdated: new Date() },
            });
          }
        }
      }
      await prisma.order.update({ where: { id: orderId }, data: { status: "cancelled", cancelReason } });
      if (order.tableId) {
        await prisma.table.update({ where: { id: order.tableId }, data: { status: "available" } });
      }

      // ✅ LOG - Order cancelled
      await AuditService.log({
        userId: req.admin.id,
        userEmail: req.admin.email,
        userRole: req.admin.role,
        action: "CANCEL",
        entity: "ORDER",
        entityId: orderId,
        changes: {
          reason: cancelReason,
          tableId: order.tableId,
          totalAmount: order.total_amount,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return successResponse(res, "Order cancelled and inventory updated successfully", {
        ...order,
        cancelReason,
      });
    }

    // Normal update (non‑cancellation)
    const parsedTableId = parseInt(tableId);
    const table = await prisma.table.findUnique({ where: { id: parsedTableId } });
    if (!table) return failureResponse(res, "Table not found", 404);

    await prisma.order.update({ where: { id: orderId }, data: { tableId: parsedTableId, guests } });

    let totalAmount = 0;
    const updatedItemIds = items.map((item: any) => item.id).filter(Boolean);

    // Delete items not in the updated list & restore inventory
    const itemsToDelete = order.order_items.filter((oi) => !updatedItemIds.includes(oi.id));
    for (const item of itemsToDelete) {
      if (item.itemId) {
        const inventory = await prisma.inventory.findUnique({ where: { itemId: item.itemId } });
        if (inventory) {
          await prisma.inventory.update({
            where: { itemId: item.itemId },
            data: { quantity: inventory.quantity + item.quantity, lastUpdated: new Date() },
          });
        }
      }
      await prisma.orderItem.delete({ where: { id: item.id } });
    }

    const insufficientStockProducts: string[] = [];

    for (const item of items) {
      const { id, itemId, comboId, quantity, unit } = item;
      if ((!itemId && !comboId) || !quantity || quantity <= 0) {
        insufficientStockProducts.push("Invalid item in the request");
        continue;
      }

      let orderItem: any;
      let price = 0;

      if (id) {
        orderItem = await prisma.orderItem.findFirst({ where: { id: parseInt(id), orderId } });
        if (!orderItem) {
          insufficientStockProducts.push("Order item not found");
          continue;
        }

        if (orderItem.itemId) {
          const item = await prisma.item.findUnique({ where: { id: orderItem.itemId } });
          if (item && item.isLimited) {
            const inventory = await prisma.inventory.findUnique({ where: { itemId: orderItem.itemId } });
            const quantityDifference = quantity - orderItem.quantity;
            if (quantityDifference > 0 && inventory && inventory.quantity < quantityDifference) {
              insufficientStockProducts.push(`Product ${orderItem.itemId} has insufficient stock.`);
              continue;
            }
            if (inventory) {
              await prisma.inventory.update({
                where: { itemId: orderItem.itemId },
                data: { quantity: inventory.quantity - quantityDifference, lastUpdated: new Date() },
              });
            }
          }
        }

        if (quantity === 0) {
          if (orderItem.itemId) {
            const inventory = await prisma.inventory.findUnique({ where: { itemId: orderItem.itemId } });
            if (inventory) {
              await prisma.inventory.update({
                where: { itemId: orderItem.itemId },
                data: { quantity: inventory.quantity + orderItem.quantity, lastUpdated: new Date() },
              });
            }
          }
          await prisma.orderItem.delete({ where: { id: orderItem.id } });
          continue;
        }

        orderItem = await prisma.orderItem.update({
          where: { id: orderItem.id },
          data: { quantity, totalPrice: orderItem.price * quantity },
        });
      } else {
        // Create new order item
        if (itemId) {
          const item = await prisma.item.findUnique({ where: { id: parseInt(itemId) } });
          if (!item) {
            insufficientStockProducts.push(`Product ${itemId} not found`);
            continue;
          }
          price = item.price;
          if (item.isLimited) {
            const inventory = await prisma.inventory.findUnique({ where: { itemId: parseInt(itemId) } });
            if (!inventory || inventory.quantity < quantity) {
              insufficientStockProducts.push(`Product ${item.name} has insufficient stock.`);
              continue;
            }
            await prisma.inventory.update({
              where: { itemId: parseInt(itemId) },
              data: { quantity: inventory.quantity - quantity, lastUpdated: new Date() },
            });
          }
          orderItem = await prisma.orderItem.create({
            data: {
              orderId,
              itemId: parseInt(itemId),
              comboId: null,
              quantity,
              unit,
              price,
              totalPrice: price * quantity,
            },
          });
        } else if (comboId) {
          const combo = await prisma.combo.findUnique({ where: { id: parseInt(comboId) } });
          if (!combo) {
            insufficientStockProducts.push(`Combo ${comboId} not found`);
            continue;
          }
          price = combo.price;
          orderItem = await prisma.orderItem.create({
            data: {
              orderId,
              itemId: null,
              comboId: parseInt(comboId),
              quantity,
              unit,
              price,
              totalPrice: price * quantity,
            },
          });
        }
      }

      if (orderItem) totalAmount += orderItem.totalPrice;
    }

    if (insufficientStockProducts.length > 0) {
      return failureResponse(res, `Not enough stock for: ${insufficientStockProducts.join(", ")}`, 400);
    }

    await prisma.order.update({ where: { id: orderId }, data: { total_amount: totalAmount } });
    if (table.status !== "occupied") {
      await prisma.table.update({ where: { id: table.id }, data: { status: "occupied" } });
    }

    const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });

    // ✅ LOG - Order updated (non-cancellation)
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "ORDER",
      entityId: orderId,
      changes: {
        tableId: parsedTableId,
        guests,
        totalAmount,
        itemCount: items.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const resOrder = {
      id: updatedOrder!.id,
      tableId: updatedOrder!.tableId,
      guests: updatedOrder!.guests,
      totalAmount: updatedOrder!.total_amount,
      status: updatedOrder!.status,
      cancelReason: updatedOrder!.cancelReason,
    };

    await checkLowStockAndNotify();
    return successResponse(res, "Order updated successfully", resOrder);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Internal Server Error", 500);
  }
};

// ✅ YES - LOG THIS (Order deleted)
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) return failureResponse(res, "Invalid order ID", 400);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true, order_items: true },
    });
    if (!order) return failureResponse(res, "Order not found", 404);

    // Store order data for audit
    const orderData = {
      tableId: order.tableId,
      totalAmount: order.total_amount,
      status: order.status,
      guests: order.guests,
    };

    // Restore inventory
    for (const item of order.order_items) {
      if (item.itemId) {
        const inventory = await prisma.inventory.findUnique({ where: { itemId: item.itemId } });
        if (inventory) {
          await prisma.inventory.update({
            where: { itemId: item.itemId },
            data: { quantity: inventory.quantity + item.quantity, lastUpdated: new Date() },
          });
        }
      }
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    if (order.tableId) {
      const remainingOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { not: "deleted" } },
      });
      if (remainingOrders === 0) {
        await prisma.table.update({ where: { id: order.tableId }, data: { status: "available" } });
      }
    }

    // ✅ LOG - Order deleted
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "DELETE",
      entity: "ORDER",
      entityId: orderId,
      changes: {
        deleted: orderData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await checkLowStockAndNotify();
    return successResponse(res, "Order deleted successfully", null);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Internal Server Error", 500);
  }
};

// ✅ YES - LOG THIS (Order items transferred)
export const transferOrderItems = async (req: Request, res: Response): Promise<void> => {
  const sourceOrderId = parseInt(req.params.id);
  if (isNaN(sourceOrderId)) return failureResponse(res, "Invalid source order ID", 400);

  const { sourceTableId, targetTableId, items: transferredItems } = req.body;

  if (!sourceTableId || !targetTableId || !transferredItems || !Array.isArray(transferredItems)) {
    return failureResponse(res, "sourceTableId, targetTableId, and items array are required", 400);
  }
  if (sourceTableId === targetTableId) {
    return failureResponse(res, "Transferring to the same table is not allowed!", 400);
  }

  try {
    const sourceOrder = await prisma.order.findUnique({
      where: { id: sourceOrderId },
      include: { table: true, order_items: true },
    });
    if (!sourceOrder) return failureResponse(res, "Source order not found", 404);

    const targetTable = await prisma.table.findUnique({ where: { id: parseInt(targetTableId) } });
    if (!targetTable) return failureResponse(res, "Target table not found", 404);

    const orderItems = sourceOrder.order_items || [];
    let remainingItems: any[] = [];
    let remainingTotalAmount = 0;
    let totalAmountForTarget = 0;

    for (const item of orderItems) {
      const transferredItem = transferredItems.find((tItem: any) => tItem.id === item.id);
      if (transferredItem) {
        const remainingQuantity = item.quantity - transferredItem.quantity;
        if (remainingQuantity < 0) {
          return failureResponse(res, "Transferred quantity exceeds available quantity", 400);
        }
        totalAmountForTarget += transferredItem.quantity * item.price;

        if (remainingQuantity > 0) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { quantity: remainingQuantity },
          });
          remainingTotalAmount += remainingQuantity * item.price;
          remainingItems.push(item);
        } else {
          await prisma.orderItem.delete({ where: { id: item.id } });
        }
      } else {
        remainingTotalAmount += item.quantity * item.price;
        remainingItems.push(item);
      }
    }

    let targetOrder = await prisma.order.findFirst({
      where: { tableId: targetTable.id, status: "pending" },
    });

    if (!targetOrder) {
      if (targetTable.status === "available") {
        targetOrder = await prisma.order.create({
          data: {
            tableId: targetTable.id,
            total_amount: totalAmountForTarget,
            status: "pending",
            guests: sourceOrder.guests,
          },
        });
        await prisma.table.update({
          where: { id: targetTable.id },
          data: { status: "occupied" },
        });
      } else {
        return failureResponse(res, "Target table is occupied and has no associated order", 400);
      }
    } else {
      await prisma.order.update({
        where: { id: targetOrder.id },
        data: { total_amount: (targetOrder.total_amount || 0) + totalAmountForTarget },
      });
    }

    for (const tItem of transferredItems) {
      const item = orderItems.find((i: any) => i.id === tItem.id);
      if (item) {
        const existingItem = await prisma.orderItem.findFirst({
          where: {
            orderId: targetOrder.id,
            itemId: item.itemId || null,
            comboId: item.comboId || null,
          },
        });
        if (existingItem) {
          await prisma.orderItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + tItem.quantity,
              totalPrice: (existingItem.quantity + tItem.quantity) * existingItem.price,
            },
          });
        } else {
          await prisma.orderItem.create({
            data: {
              orderId: targetOrder.id,
              itemId: item.itemId || null,
              comboId: item.comboId || null,
              quantity: tItem.quantity,
              unit: item.unit,
              price: item.price,
              totalPrice: item.price * tItem.quantity,
            },
          });
        }
      }
    }

    if (remainingItems.length > 0) {
      await prisma.order.update({
        where: { id: sourceOrder.id },
        data: { total_amount: remainingTotalAmount },
      });
    } else {
      await prisma.orderItem.deleteMany({ where: { orderId: sourceOrder.id } });
      await prisma.order.delete({ where: { id: sourceOrder.id } });
      if (sourceOrder.tableId) {
        await prisma.table.update({
          where: { id: sourceOrder.tableId },
          data: { status: "available" },
        });
      }
    }

    // ✅ LOG - Order transfer
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "TRANSFER",
      entity: "ORDER",
      entityId: sourceOrderId,
      changes: {
        sourceTableId,
        targetTableId,
        transferredItemsCount: transferredItems.length,
        sourceRemainingItems: remainingItems.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Transfer completed.");
  } catch (error) {
    console.error("Error during transfer:", error);
    return failureResponse(res, "Failed to transfer order items", 500);
  }
};