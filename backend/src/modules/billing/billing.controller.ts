import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service"; // ✅ ADD THIS
import prisma from "../../config/database";
import { endOfDay, startOfDay } from "date-fns";

const isValidDate = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
};

// GET /billing/order/:id - ❌ NO LOGGING (Read-only)
export const billingOrderDetail = async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.id;
  if (!orderId) return failureResponse(res, "OrderId is required", 400);

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        table: { select: { name: true, id: true } },
        order_items: { select: { id: true, itemId: true, quantity: true, unit: true, price: true, comboId: true } },
      },
    });

    if (!order) return failureResponse(res, "Order not found", 404);

    const itemIds = order.order_items.filter(item => item.itemId).map(item => item.itemId as number) || [];
    const comboIds = order.order_items.filter(item => item.comboId).map(item => item.comboId as number) || [];

    const [items, combos] = await Promise.all([
      prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } }),
      prisma.combo.findMany({ where: { id: { in: comboIds } }, select: { id: true, name: true } }),
    ]);

    const itemNameMap = items.reduce((acc: any, item: any) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
    const comboNameMap = combos.reduce((acc: any, combo: any) => {
      acc[combo.id] = combo.name;
      return acc;
    }, {});

    const orderItems = order.order_items.map((item: any) => ({
      id: item.id,
      comboId: item.comboId,
      itemId: item.itemId,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      itemName: itemNameMap[item.itemId] || null,
      comboName: comboNameMap[item.comboId] || null,
    }));

    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const actualTotalAmount = itemsTotal;

    const payment = await prisma.payment.findFirst({ where: { orderId: order.id } });

    let customerName = null;
    if (order.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: order.customerId }, select: { name: true } });
      customerName = customer?.name || null;
    }

    const discountPercent = payment?.discountPercent || 0;
    const vatPercentage = payment?.vatPercentage || 0;
    const serviceChargePercentage = payment?.serviceChargePercentage || 0;

    const discountAmount = actualTotalAmount * discountPercent / 100;
    const discountedAmount = actualTotalAmount - discountAmount;
    const vatAmount = discountedAmount * vatPercentage / 100;
    const serviceChargeAmount = (discountedAmount + vatAmount) * serviceChargePercentage / 100;
    const totalWithCharges = discountedAmount + vatAmount + serviceChargeAmount;

    const detailedOrder: any = {
      id: order.id,
      table: order.table ? { name: order.table.name, id: order.table.id } : null,
      totalAmount: order.total_amount,
      paymentMode: order.payment_mode,
      status: order.status,
      guests: order.guests,
      customerId: order.customerId,
      orderItems: orderItems,
    };

    if (payment) {
      detailedOrder.paymentDetails = {
        id: payment.id,
        paidAmount: payment.paidAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
        vatPercentage: payment.vatPercentage,
        vatAmount: payment.vatAmount,
        serviceChargePercentage: payment.serviceChargePercentage,
        serviceChargeAmount: payment.serviceChargeAmount,
        tipAmount: payment.tipAmount,
        currency: payment.currency,
        remarks: payment.remarks,
        discountPercent: payment.discountPercent,
        discountAmount: payment.discountAmount,
        priceBeforeDiscount: payment.priceBeforeDiscount,
        totalAmountAfterTaxes: totalWithCharges,
        customerName: customerName,
        createdAt: payment.createdAt,
      };
    }

    return successResponse(res, "Order details fetched successfully", detailedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return failureResponse(res, "Failed to fetch order details", 500);
  }
};

// GET /billing/receipt/:id - ❌ NO LOGGING (Read-only)
export const getOrderReceiptDetails = async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.id;
  if (!orderId) return failureResponse(res, "Order ID is required", 400);

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        table: { select: { id: true, name: true, capacity: true } },
        order_items: { select: { id: true, itemId: true, quantity: true, unit: true, price: true, comboId: true } },
      },
    });
    if (!order) return failureResponse(res, "Order not found", 404);

    const itemIds = order.order_items.filter(item => item.itemId).map(item => item.itemId as number) || [];
    const comboIds = order.order_items.filter(item => item.comboId).map(item => item.comboId as number) || [];

    const [items, combos, payment] = await Promise.all([
      prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } }),
      prisma.combo.findMany({ where: { id: { in: comboIds } }, select: { id: true, name: true } }),
      prisma.payment.findFirst({ where: { orderId: order.id } }),
    ]);

    const itemNameMap = items.reduce((acc: Record<number, string>, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
    const comboNameMap = combos.reduce((acc: Record<number, string>, combo) => {
      acc[combo.id] = combo.name;
      return acc;
    }, {});

    const orderItems = order.order_items.map((item) => ({
      id: item.id,
      comboId: item.comboId,
      itemId: item.itemId,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      itemName: item.itemId ? itemNameMap[item.itemId] : null,
      comboName: item.comboId ? comboNameMap[item.comboId] : null,
    }));

    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = payment?.discountPercent || 0;
    const vatPercentage = payment?.vatPercentage || 0;
    const serviceChargePercentage = payment?.serviceChargePercentage || 0;
    const priceBeforeDiscount = payment?.priceBeforeDiscount || order.total_amount || 0;

    const discountAmount = priceBeforeDiscount * discountPercent / 100;
    const discountedAmount = priceBeforeDiscount - discountAmount;
    const vatAmount = discountedAmount * vatPercentage / 100;
    const serviceChargeAmount = (discountedAmount + vatAmount) * serviceChargePercentage / 100;
    const totalAmountAfterTaxes = discountedAmount + vatAmount + serviceChargeAmount;

    const receiptDetails = {
      id: order.id,
      table: {
        id: order.tableId,
        name: order.table?.name || "NA",
        capacity: order.table?.capacity || 0,
      },
      orderItems,
      totalAmount: order.total_amount || itemsTotal,
      guests: order.guests,
      status: order.status,
      customerId: order.customerId || null,
      cancelReason: order.cancelReason || null,
      paymentDetails: payment ? {
        id: payment.id,
        paidAmount: payment.paidAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
        vatPercentage: payment.vatPercentage,
        vatAmount: vatAmount,
        serviceChargePercentage: payment.serviceChargePercentage,
        serviceChargeAmount: serviceChargeAmount,
        tipAmount: payment.tipAmount,
        currency: payment.currency,
        remarks: payment.remarks,
        discountPercent: payment.discountPercent,
        discountAmount: discountAmount,
        priceBeforeDiscount: priceBeforeDiscount,
        totalAmountAfterTaxes: totalAmountAfterTaxes,
        createdAt: payment.createdAt,
      } : null,
    };

    return successResponse(res, "Receipt details fetched successfully", receiptDetails);
  } catch (error) {
    console.error("Error fetching receipt details:", error);
    return failureResponse(res, "Failed to fetch receipt details", 500);
  }
};

// POST /billing/order/:id/complete - ✅ YES, LOG THIS (Financial transaction)
export const completeOrder = async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.id;
  const {
    payment_mode,
    customerId,
    vatPercentage,
    serviceChargePercentage,
    paidAmount,
    tipAmount,
    discountPercent,
    actualTotalAmount,
    partialPaymentMethod,
    partialPaymentAmount,
  } = req.body;

  const parsedOrderId = parseInt(orderId);
  if (isNaN(parsedOrderId)) return failureResponse(res, "Invalid order ID", 400);

  const parsedCustomerId = customerId ? parseInt(customerId) : null;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId },
      include: {
        table: { select: { name: true, id: true, status: true } },
        order_items: { select: { id: true, itemId: true, quantity: true, unit: true, price: true, comboId: true } },
      },
    });
    if (!order) return failureResponse(res, "Order not found", 404);

    let customer = null;
    let customerName = null;
    if (parsedCustomerId) {
      customer = await prisma.customer.findUnique({ where: { id: parsedCustomerId } });
      customerName = customer?.name || null;
    }

    const discountPer = discountPercent || 0;
    const vatPer = vatPercentage || 0;
    const serviceChargePer = serviceChargePercentage || 0;

    const discountAmount = actualTotalAmount * discountPer / 100;
    const discountedAmount = actualTotalAmount - discountAmount;
    const vatAmount = discountedAmount * vatPer / 100;
    const serviceChargeAmount = (discountedAmount + vatAmount) * serviceChargePer / 100;
    const totalWithCharges = discountedAmount + vatAmount + serviceChargeAmount;

    let paymentMethod = payment_mode;
    let creditUsed = 0;

    if (payment_mode === "credit") {
      if (!customer) return failureResponse(res, "Customer not found for credit payment", 400);

      const availableCredit = customer.availableCredit || 0;
      let totalPaid = partialPaymentAmount || 0;
      if (totalPaid < totalWithCharges) {
        creditUsed = totalWithCharges - totalPaid;
        if (availableCredit < creditUsed) {
          return failureResponse(res, "Insufficient credit to complete the order", 400);
        }
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            availableCredit: availableCredit - creditUsed,
            currentCredit: (customer.currentCredit || 0) + creditUsed,
          }
        });
        paymentMethod = partialPaymentMethod ? `${partialPaymentMethod} and credit` : "credit";
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: parsedCustomerId, status: "completed", payment_mode: paymentMethod }
      });
    } else {
      if (!paidAmount || paidAmount <= 0) return failureResponse(res, "Invalid paid amount", 400);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "completed", payment_mode: payment_mode || "cash", customerId: parsedCustomerId }
      });
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: parsedCustomerId || null,
        paidAmount: paidAmount || partialPaymentAmount || 0,
        paymentMethod: paymentMethod || "cash",
        paymentStatus: "completed",
        tipAmount: tipAmount,
        paymentDate: new Date(),
        vatPercentage: vatPercentage || 0,
        vatAmount: vatAmount || 0,
        serviceChargePercentage: serviceChargePercentage || 0,
        serviceChargeAmount: serviceChargeAmount || 0,
        remainingAmount: creditUsed,
        currency: "NPR",
        remarks: `${partialPaymentMethod ? `Partial payment via ${partialPaymentMethod}` : `Order completed via ${paymentMethod}`}`,
        discountPercent: discountPercent || 0,
        discountAmount: discountAmount || 0,
        priceBeforeDiscount: order.total_amount || 0,
      }
    });

    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: (customer.totalOrders || 0) + 1,
          totalOrderAmount: (customer.totalOrderAmount || 0) + totalWithCharges,
        }
      });
    }

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: "available" }
      });
    }

    // ✅ LOG - Order completion (financial transaction)
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "COMPLETE",
      entity: "ORDER",
      entityId: parsedOrderId,
      changes: {
        orderId: parsedOrderId,
        paymentMethod,
        totalAmount: totalWithCharges,
        paidAmount: paidAmount || partialPaymentAmount || 0,
        creditUsed,
        customerId: parsedCustomerId,
        customerName,
        tableId: order.tableId,
        tableName: order.table?.name,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Order completed successfully");
  } catch (error) {
    console.error("Error completing order:", error);
    return failureResponse(res, "Failed to complete order", 500);
  }
};

// GET /billing/day-book - ❌ NO LOGGING (Read-only)
export const dayBook = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  let { date, status } = req.query;
  const todayDate = new Date().toISOString().split("T")[0];

  if (!date || typeof date !== "string" || !isValidDate(date)) {
    date = todayDate;
  }

  if (new Date(date) > new Date()) {
    return failureResponse(res, "Future dates cannot be queried", 400);
  }

  try {
    const startOfSelectedDay = startOfDay(new Date(date));
    const endOfSelectedDay = endOfDay(new Date(date));

    const whereClause: any = {
      createdAt: { gte: startOfSelectedDay, lt: endOfSelectedDay },
    };
    if (status && typeof status === "string") {
      whereClause.status = status;
    }

    const allOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: { select: { name: true, id: true } },
        order_items: {
          select: {
            quantity: true,
            price: true,
            totalPrice: true,
            item: { select: { name: true, id: true } },
            combo: { select: { name: true, id: true } },
          }
        }
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalOrders = await prisma.order.count({ where: whereClause });
    const totalSales = allOrders
      .filter(order => order.status === "completed")
      .reduce((acc, order) => acc + (order.total_amount || 0), 0);

    const formattedOrders = allOrders.map(order => ({
      orderId: order.id || "NA",
      status: order.status,
      table: order.table ? { name: order.table.name, id: order.table.id } : { name: "NA", id: "NA" },
      orderItems: order.order_items.map(item => ({
        itemName: item.item ? item.item.name : "NA",
        comboName: item.combo ? item.combo.name : "NA",
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
      createdAt: order.createdAt,
      totalAmount: order.total_amount,
    }));

    const totalPages = Math.ceil(totalOrders / limit);
    const meta = { page, limit, totalOrders, totalPages };
    const metrics = { totalOrders, totalSales: totalSales.toFixed(2), metricDate: date };

    return successResponse(res, `Day order book for ${date} retrieved successfully`, { metrics, orders: formattedOrders }, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch day order book", 500);
  }
};

// GET /billing/day-book/metrics - ❌ NO LOGGING (Read-only)
export const getOrdersAndMetricsForDay = async (req: Request, res: Response): Promise<void> => {
  const date = req.query.date as string;
  if (!date || typeof date !== "string" || !isValidDate(date)) {
    return failureResponse(res, "Invalid date provided", 400);
  }

  const todayDate = new Date().toISOString().split("T")[0];
  if (new Date(date) > new Date(todayDate)) {
    return failureResponse(res, "Future dates cannot be queried", 400);
  }

  try {
    const startOfSelectedDay = startOfDay(new Date(date));
    const endOfSelectedDay = endOfDay(new Date(date));

    const allOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfSelectedDay, lt: endOfSelectedDay } },
      include: {
        table: { select: { name: true, id: true } },
        order_items: {
          select: {
            quantity: true,
            price: true,
            totalPrice: true,
            item: { select: { name: true, id: true } },
            combo: { select: { name: true, id: true } },
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    const totalSales = allOrders
      .filter(order => order.status === "completed")
      .reduce((acc, order) => acc + (order.total_amount || 0), 0);
    const totalOrders = allOrders.length;

    const formattedOrders = allOrders.map(order => ({
      orderId: order.id || "NA",
      status: order.status,
      table: order.table ? { name: order.table.name, id: order.table.id } : { name: "NA", id: "NA" },
      orderItems: order.order_items.map(item => ({
        itemName: item.item ? item.item.name : "NA",
        comboName: item.combo ? item.combo.name : "NA",
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
      createdAt: order.createdAt,
      totalAmount: order.total_amount,
    }));

    const metrics = { totalOrders, totalSales: totalSales.toFixed(2), metricDate: date };
    return successResponse(res, `Orders and metrics for ${date} retrieved successfully`, { metrics, orders: formattedOrders });
  } catch (error) {
    console.error("Error fetching orders for the day:", error);
    return failureResponse(res, "Failed to fetch orders and metrics", 500);
  }
};

// GET /payments - ❌ NO LOGGING (Read-only)
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const customerId = req.query.customerId as string | undefined;

  try {
    const whereClause = customerId ? { customerId: parseInt(customerId) } : {};

    const payments = await prisma.payment.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: "desc" },
    });

    const totalPayments = await prisma.payment.count({ where: whereClause });
    const totalPages = Math.ceil(totalPayments / limit);

    const paginatedPayments = payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
      paidAmount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      paymentDate: payment.paymentDate,
      paymentReference: payment.paymentReference,
    }));

    const meta = { page, limit, totalPayments, totalPages };
    const message = customerId
      ? "Payments for the customer fetched successfully"
      : "All payments fetched successfully";

    return successResponse(res, message, paginatedPayments, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch payments", 500);
  }
};