import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { getImageUrl } from "../../services/image.service";
import { AuditService } from "../../services/audit.service";
import prisma from "../../config/database";

// ========== HELPERS ==========

/**
 * Calculate stock status based on quantity and threshold
 */
const getStockStatus = (quantity: number, threshold: number): "in_stock" | "low" | "none" => {
  if (quantity === 0) return "none";
  if (quantity < threshold) return "low";
  return "in_stock";
};

/**
 * Format inventory item for response
 */
const formatInventoryItem = (inventory: any) => {
  const status = getStockStatus(inventory.quantity, inventory.threshold);
  return {
    itemId: inventory.itemId,
    itemName: inventory.item?.name || "Unknown",
    quantity: inventory.quantity,
    threshold: inventory.threshold,
    unit: inventory.item?.unit || null,
    image: inventory.item?.image ? getImageUrl(inventory.item.image) : "",
    price: inventory.item?.price || 0,
    status,
  };
};

// ========== GET ALL INVENTORY (PAGINATED) ==========
// ❌ NO LOGGING - Read-only
export const getInventoryList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const statusFilter = req.query.status as string;

  try {
    const where: any = {
      item: { isLimited: true },
    };

    if (search) {
      where.item.name = { contains: search, mode: "insensitive" };
    }

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
            image: true,
            price: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { item: { name: "asc" } },
    });

    const totalItems = await prisma.inventory.count({ where });
    let formattedItems = inventories.map(formatInventoryItem);

    if (statusFilter) {
      formattedItems = formattedItems.filter(item => item.status === statusFilter);
    }

    const totalPages = Math.ceil(totalItems / limit);
    const meta = { page, limit, totalItems, totalPages, filteredCount: formattedItems.length };

    return successResponse(res, "Inventory retrieved successfully", formattedItems, meta);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return failureResponse(res, "Failed to fetch inventory", 500);
  }
};

// ========== GET LOW STOCK ITEMS ==========
// ❌ NO LOGGING - Read-only
export const getLowStockItems = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const lowStockInventories = await prisma.inventory.findMany({
      where: {
        quantity: { lt: prisma.inventory.fields.threshold },
        item: { isLimited: true },
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            image: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { itemId: "asc" },
    });

    const totalLowStock = await prisma.inventory.count({
      where: {
        quantity: { lt: prisma.inventory.fields.threshold },
        item: { isLimited: true },
      },
    });

    if (lowStockInventories.length === 0) {
      return successResponse(res, "No low stock items found.", [], {
        page,
        limit,
        lowStocks: 0,
        totalPages: 0,
      });
    }

    const formattedItems = lowStockInventories.map((inv) => {
      let status: "low" | "none";
      if (inv.quantity === 0) status = "none";
      else status = "low";

      return {
        id: inv.item.id,
        name: inv.item.name,
        price: inv.item.price,
        unit: inv.item.unit,
        image: inv.item.image ? getImageUrl(inv.item.image) : "",
        inventory: {
          quantity: inv.quantity,
          threshold: inv.threshold,
        },
        status,
      };
    });

    const totalPages = Math.ceil(totalLowStock / limit);
    const meta = { page, limit, lowStocks: formattedItems.length, totalPages };

    return successResponse(res, "Low stock items retrieved successfully", formattedItems, meta);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return failureResponse(res, "Failed to fetch low stock items", 500);
  }
};

// ========== GET INVENTORY BY ITEM ==========
// ❌ NO LOGGING - Read-only
export const getInventoryByItem = async (req: Request, res: Response): Promise<void> => {
  const itemId = parseInt(req.params.itemId);

  if (isNaN(itemId)) {
    return failureResponse(res, "Invalid item ID", 400);
  }

  try {
    const inventory = await prisma.inventory.findUnique({
      where: { itemId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
            image: true,
            price: true,
            isLimited: true,
          },
        },
      },
    });

    if (!inventory) {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, name: true, isLimited: true },
      });

      if (!item) {
        return failureResponse(res, "Item not found", 404);
      }

      if (!item.isLimited) {
        return failureResponse(res, "Item is not limited, no inventory tracked", 400);
      }

      return failureResponse(res, "Inventory not found for this item", 404);
    }

    const formatted = formatInventoryItem(inventory);
    return successResponse(res, "Inventory retrieved successfully", formatted);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return failureResponse(res, "Failed to fetch inventory", 500);
  }
};

// ========== ADJUST INVENTORY ==========
// ✅ YES - LOG THIS (Stock changes affect business)
export const adjustInventory = async (req: Request, res: Response): Promise<void> => {
  const itemId = parseInt(req.params.itemId);

  if (isNaN(itemId)) {
    return failureResponse(res, "Invalid item ID", 400);
  }

  const { type, quantity, note, threshold } = req.body;

  if (!type || !["add", "remove", "set"].includes(type)) {
    return failureResponse(res, 'Invalid adjustment type. Use "add", "remove", or "set"', 400);
  }

  const adjustmentQuantity = parseInt(quantity);
  if (isNaN(adjustmentQuantity) || adjustmentQuantity < 0) {
    return failureResponse(res, "Quantity must be a non-negative integer", 400);
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, name: true, isLimited: true, unit: true },
    });

    if (!item) {
      return failureResponse(res, "Item not found", 404);
    }

    if (!item.isLimited) {
      return failureResponse(res, "Item is not limited, inventory cannot be tracked", 400);
    }

    let inventory = await prisma.inventory.findUnique({
      where: { itemId },
    });

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          itemId,
          quantity: 0,
          threshold: threshold || 10,
        },
      });
    }

    const oldQuantity = inventory.quantity;
    let newQuantity: number;
    let adjustmentNote = note || "";

    switch (type) {
      case "add":
        newQuantity = inventory.quantity + adjustmentQuantity;
        adjustmentNote = adjustmentNote || `Added ${adjustmentQuantity} units`;
        break;
      case "remove":
        if (adjustmentQuantity > inventory.quantity) {
          return failureResponse(
            res,
            `Cannot remove ${adjustmentQuantity} units. Only ${inventory.quantity} in stock.`,
            400
          );
        }
        newQuantity = inventory.quantity - adjustmentQuantity;
        adjustmentNote = adjustmentNote || `Removed ${adjustmentQuantity} units`;
        break;
      case "set":
        newQuantity = adjustmentQuantity;
        adjustmentNote = adjustmentNote || `Set quantity to ${adjustmentQuantity} units`;
        break;
      default:
        return failureResponse(res, "Invalid adjustment type", 400);
    }

    const updatedInventory = await prisma.inventory.update({
      where: { itemId },
      data: {
        quantity: newQuantity,
        threshold: threshold || inventory.threshold,
        lastUpdated: new Date(),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    });

    await prisma.inventoryAdjustment.create({
      data: {
        itemId,
        quantity: adjustmentQuantity,
        type,
        note: adjustmentNote,
      },
    });

    // ✅ LOG - Inventory adjustment
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "ADJUST",
      entity: "INVENTORY",
      entityId: itemId,
      changes: {
        itemName: item.name,
        type,
        oldQuantity,
        newQuantity,
        difference: newQuantity - oldQuantity,
        threshold: updatedInventory.threshold,
        note: adjustmentNote,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    if (newQuantity < updatedInventory.threshold && newQuantity > 0) {
      console.warn(
        `⚠️ Low stock alert: ${item.name} is at ${newQuantity} units (threshold: ${updatedInventory.threshold})`
      );
    }

    const formatted = {
      itemId: updatedInventory.itemId,
      itemName: updatedInventory.item.name,
      quantity: updatedInventory.quantity,
      threshold: updatedInventory.threshold,
      unit: updatedInventory.item.unit,
      status: getStockStatus(updatedInventory.quantity, updatedInventory.threshold),
      adjustmentNote,
    };

    return successResponse(res, "Inventory adjusted successfully", formatted);
  } catch (error) {
    console.error("Error adjusting inventory:", error);
    return failureResponse(res, "Failed to adjust inventory", 500);
  }
};

// ========== UPDATE THRESHOLD ==========
// ✅ YES - LOG THIS (Configuration change)
export const updateThreshold = async (req: Request, res: Response): Promise<void> => {
  const itemId = parseInt(req.params.itemId);

  if (isNaN(itemId)) {
    return failureResponse(res, "Invalid item ID", 400);
  }

  const { threshold } = req.body;

  if (threshold === undefined || isNaN(parseInt(threshold))) {
    return failureResponse(res, "threshold must be a valid integer", 400);
  }

  const newThreshold = parseInt(threshold);
  if (newThreshold < 0) {
    return failureResponse(res, "threshold must be a non-negative integer", 400);
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, isLimited: true, name: true, unit: true },
    });

    if (!item) {
      return failureResponse(res, "Item not found", 404);
    }

    if (!item.isLimited) {
      return failureResponse(res, "Item is not limited, inventory cannot be tracked", 400);
    }

    const existingInventory = await prisma.inventory.findUnique({
      where: { itemId },
    });

    let updatedInventory;
    let oldThreshold = 10;

    if (!existingInventory) {
      updatedInventory = await prisma.inventory.create({
        data: {
          itemId,
          quantity: 0,
          threshold: newThreshold,
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      });
    } else {
      oldThreshold = existingInventory.threshold;
      updatedInventory = await prisma.inventory.update({
        where: { itemId },
        data: { threshold: newThreshold, lastUpdated: new Date() },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      });
    }

    // ✅ LOG - Threshold update
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "INVENTORY_THRESHOLD",
      entityId: itemId,
      changes: {
        itemName: item.name,
        oldThreshold,
        newThreshold,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const formatted = {
      itemId: updatedInventory.itemId,
      itemName: updatedInventory.item?.name || "Unknown",
      quantity: updatedInventory.quantity,
      threshold: updatedInventory.threshold,
      unit: updatedInventory.item?.unit || null,
      status: getStockStatus(updatedInventory.quantity, updatedInventory.threshold),
    };

    return successResponse(res, "Threshold updated successfully", formatted);
  } catch (error) {
    console.error("Error updating threshold:", error);
    return failureResponse(res, "Failed to update threshold", 500);
  }
};

// ========== GET ADJUSTMENT HISTORY ==========
// ❌ NO LOGGING - Read-only
export const getAdjustmentHistory = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;

  try {
    const where: any = {};
    if (itemId) where.itemId = itemId;

    const [adjustments, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryAdjustment.count({ where }),
    ]);

    const formatted = adjustments.map((adj) => ({
      id: adj.id,
      itemId: adj.itemId,
      itemName: adj.item?.name || "Unknown",
      unit: adj.item?.unit || null,
      type: adj.type,
      quantity: adj.quantity,
      note: adj.note,
      createdAt: adj.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    return successResponse(res, "Adjustment history retrieved", formatted, meta);
  } catch (error) {
    console.error("Error fetching adjustment history:", error);
    return failureResponse(res, "Failed to fetch adjustment history", 500);
  }
};

// ========== BULK UPDATE INVENTORY ==========
// ✅ YES - LOG THIS (Mass changes)
export const bulkUpdateInventory = async (req: Request, res: Response): Promise<void> => {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return failureResponse(res, "updates array is required", 400);
  }

  try {
    const results = [];
    const errors = [];

    for (const update of updates) {
      const { itemId, quantity, threshold } = update;

      if (!itemId || quantity === undefined) {
        errors.push({ itemId, error: "itemId and quantity are required" });
        continue;
      }

      try {
        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: { id: true, isLimited: true, name: true },
        });

        if (!item) {
          errors.push({ itemId, error: "Item not found" });
          continue;
        }

        if (!item.isLimited) {
          errors.push({ itemId, error: "Item is not limited" });
          continue;
        }

        const newQuantity = parseInt(quantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
          errors.push({ itemId, error: "Invalid quantity" });
          continue;
        }

        let inventory = await prisma.inventory.findUnique({
          where: { itemId },
        });

        if (!inventory) {
          inventory = await prisma.inventory.create({
            data: {
              itemId,
              quantity: 0,
              threshold: threshold || 10,
            },
          });
        }

        const oldQuantity = inventory.quantity;

        const updated = await prisma.inventory.update({
          where: { itemId },
          data: {
            quantity: newQuantity,
            threshold: threshold || inventory.threshold,
            lastUpdated: new Date(),
          },
          include: {
            item: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        });

        const note = `Bulk update: quantity set to ${newQuantity}`;
        await prisma.inventoryAdjustment.create({
          data: {
            itemId,
            quantity: newQuantity,
            type: "set",
            note,
          },
        });

        results.push({
          itemId: updated.itemId,
          itemName: updated.item.name,
          quantity: updated.quantity,
          threshold: updated.threshold,
          status: getStockStatus(updated.quantity, updated.threshold),
        });
      } catch (error) {
        errors.push({ itemId, error: "Failed to update" });
      }
    }

    // ✅ LOG - Bulk inventory update
    if (results.length > 0) {
      await AuditService.log({
        userId: req.admin.id,
        userEmail: req.admin.email,
        userRole: req.admin.role,
        action: "BULK_UPDATE",
        entity: "INVENTORY",
        entityId: null,
        changes: {
          updatedItems: results.map(r => ({
            itemId: r.itemId,
            itemName: r.itemName,
            newQuantity: r.quantity,
          })),
          errorCount: errors.length,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    return successResponse(res, "Bulk inventory update completed", {
      success: results,
      errors,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return failureResponse(res, "Failed to bulk update inventory", 500);
  }
};