import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import {
  startOfDay,
  endOfDay,
  parseISO,
  differenceInDays,
} from "date-fns";
import prisma from "../../config/database";

// ========== UTILITY FUNCTIONS ==========

const isValidDateFormat = (dateStr: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

/**
 * Get closing balance for a specific date (by summing completed orders up to that date)
 * Optimized: single query using aggregation
 */
async function getClosingBalance(date: Date): Promise<number> {
  const endOfDayDate = endOfDay(date);
  const result = await prisma.order.aggregate({
    where: { status: "completed", createdAt: { lte: endOfDayDate } },
    _sum: { total_amount: true },
  });
  return result._sum.total_amount || 0;
}

// ========== SALES CONTROLLERS ==========

/**
 * GET /reports/sales/daily
 * Returns: metrics (totals, payment breakdown, opening/closing balance) + paginated list of completed orders
 */
export const dailySalesReport = async (req: Request, res: Response): Promise<void> => {
  let { date } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const todayStr = new Date().toISOString().split("T")[0];

  if (!date || typeof date !== "string" || !isValidDateFormat(date)) {
    date = todayStr;
  }

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return failureResponse(res, "Invalid date format", 400);
  }
  if (selectedDate > new Date()) {
    return failureResponse(res, "Future dates cannot be queried", 400);
  }

  const start = startOfDay(selectedDate);
  const end = endOfDay(selectedDate);

  try {
    // 1. Get completed orders (paginated) and total count in parallel
    const [completedOrders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { status: "completed", createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          total_amount: true,
          guests: true,
          createdAt: true,
          table: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { status: "completed", createdAt: { gte: start, lte: end } } }),
    ]);

    if (completedOrders.length === 0) {
      return failureResponse(res, `No completed orders found for ${date}`, 404);
    }

    // 2. Fetch all payments for these orders in one go
    const orderIds = completedOrders.map(o => o.id);
    const payments = await prisma.payment.findMany({
      where: { orderId: { in: orderIds } },
    });
    const paymentMap = new Map(payments.map(p => [p.orderId, p]));

    // 3. Aggregation accumulators
    let totalSales = 0;
    let totalCreditPayments = 0;
    let remainingBalanceTotal = 0;
    const paymentMethods: Record<string, number> = {
      cash: 0, fonepay: 0, esewa: 0, khalti: 0, credit: 0,
    };

    const formattedOrders = completedOrders.map(order => {
      const payment = paymentMap.get(order.id);
      if (payment) {
        totalSales += payment.paidAmount || 0;
        remainingBalanceTotal += payment.remainingAmount || 0;

        // Split combined payment methods like "fonepay and credit"
        const methods = payment.paymentMethod?.split(" and ").map(m => m.trim()) || [];
        const splitAmount = (payment.paidAmount || 0) / (methods.length || 1);
        methods.forEach(method => {
          if (paymentMethods[method] !== undefined) {
            paymentMethods[method] += splitAmount;
          }
          if (method === "credit") totalCreditPayments += splitAmount;
        });
      }
      return {
        id: order.id,
        totalAmount: order.total_amount,
        guests: order.guests,
        createdAt: order.createdAt,
        table: order.table?.name || "NA",
        paymentDetails: payment ? {
          paymentMethod: payment.paymentMethod || "NA",
          paymentStatus: payment.paymentStatus || "NA",
          paidAmount: payment.paidAmount || 0,
          vatAmount: payment.vatAmount || 0,
          serviceChargeAmount: payment.serviceChargeAmount || 0,
          discountAmount: payment.discountAmount || 0,
          remainingAmount: payment.remainingAmount || 0,
          currency: payment.currency || "NA",
          tipAmount: payment.tipAmount || 0,
        } : null,
      };
    });

    // 4. Opening & closing balance
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const openingBalance = await getClosingBalance(previousDay);
    const closingBalance = openingBalance + totalSales;

    // Instead of Object.fromEntries, use:
    const paymentMethodStats = Object.entries(paymentMethods).reduce(
      (acc, [key, value]) => {
        acc[key] = parseFloat(value.toFixed(2));
        return acc;
      },
      {} as Record<string, number>
    );

    const metrics = {
      totalOrders: totalOrders,
      totalSales: totalSales.toFixed(2),
      totalCreditPayments: totalCreditPayments.toFixed(2),
      remainingBalanceTotal: remainingBalanceTotal.toFixed(2),
      paymentMethodStats,
      openingBalance: openingBalance.toFixed(2),
      closingBalance: closingBalance.toFixed(2),
    };

    const meta = { page, limit, totalOrders, totalPages: Math.ceil(totalOrders / limit) };
    return successResponse(res, `Sales report for ${date}`, { metrics, records: formattedOrders }, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch daily sales report", 500);
  }
};

/**
 * GET /reports/sales/cancelled
 */
export const getCancelledOrders = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const [cancelledOrders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: "cancelled" },
        select: {
          id: true,
          total_amount: true,
          payment_mode: true,
          status: true,
          guests: true,
          createdAt: true,
          table: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { status: "cancelled" } }),
    ]);

    if (cancelledOrders.length === 0) {
      return failureResponse(res, "No cancelled orders found", 404);
    }

    const formatted = cancelledOrders.map(order => ({
      id: order.id,
      table: order.table ? { name: order.table.name } : null,
      totalAmount: order.total_amount,
      paymentMode: order.payment_mode,
      status: order.status,
      guests: order.guests,
      createdAt: order.createdAt,
    }));

    const meta = { page, limit, totalCancelledOrders: total, totalPages: Math.ceil(total / limit) };
    return successResponse(res, "Cancelled orders retrieved", formatted, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch cancelled orders", 500);
  }
};

/**
 * POST /reports/sales/revenue-insights
 * Returns: grouped revenue (sales - misc costs) by day or month within date range
 */
export const getRevenueInsights = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, timePeriod = "daily" } = req.body;
  if (!startDate || !endDate) {
    return failureResponse(res, "startDate and endDate are required", 400);
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return failureResponse(res, "Invalid date range", 400);
  }
  if (differenceInDays(end, start) > 365) {
    return failureResponse(res, "Date range cannot exceed 1 year", 400);
  }

  const finalPeriod = timePeriod === "monthly" ? "monthly" : "daily";

  try {
    const startUTC = startOfDay(start);
    const endUTC = endOfDay(end);

    // Fetch completed orders and miscellaneous costs in parallel
    const [completedOrders, miscCosts] = await Promise.all([
      prisma.order.findMany({
        where: { status: "completed", createdAt: { gte: startUTC, lte: endUTC } },
        select: { createdAt: true, total_amount: true },
      }),
      prisma.miscellaneous.findMany({
        where: { createdAt: { gte: startUTC, lte: endUTC } },
        select: { createdAt: true, costOrPrice: true },
      }),
    ]);

    if (completedOrders.length === 0) {
      return failureResponse(res, `No data found for ${startDate} to ${endDate}`, 404);
    }

    // Grouping functions
    const groupKey = finalPeriod === "daily"
      ? (date: Date) => date.toISOString().split("T")[0]
      : (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const revenueMap = new Map<string, number>();
    completedOrders.forEach(order => {
      const key = groupKey(order.createdAt);
      revenueMap.set(key, (revenueMap.get(key) || 0) + (order.total_amount || 0));
    });

    const costMap = new Map<string, number>();
    miscCosts.forEach(cost => {
      const key = groupKey(cost.createdAt);
      costMap.set(key, (costMap.get(key) || 0) + (cost.costOrPrice || 0));
    });

    const allKeys = new Set([...revenueMap.keys(), ...costMap.keys()]);
    const revenueReport = Array.from(allKeys).sort().map(key => {
      const totalRevenue = revenueMap.get(key) || 0;
      const totalMiscCost = costMap.get(key) || 0;
      return {
        date: key,
        totalRevenue: totalRevenue.toFixed(2),
        totalMiscellaneousCost: totalMiscCost.toFixed(2),
        trueRevenue: (totalRevenue - totalMiscCost).toFixed(2),
      };
    });

    return successResponse(res, "Revenue insights", {
      startDate, endDate, timePeriod: finalPeriod, revenueReport,
    });
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to generate revenue insights", 500);
  }
};

// ========== MISCELLANEOUS CONTROLLERS ==========

/**
 * GET /reports/miscellaneous
 * Returns paginated list + metrics for a day
 */
export const getMiscellaneousForDay = async (req: Request, res: Response): Promise<void> => {
  let { date, keyword } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const todayStr = new Date().toISOString().split("T")[0];

  if (!date || typeof date !== "string" || !isValidDateFormat(date)) date = todayStr;
  if (new Date(date) > new Date()) return failureResponse(res, "Future dates cannot be queried", 400);

  const start = startOfDay(new Date(date));
  const end = endOfDay(new Date(date));

  const where: any = { createdAt: { gte: start, lt: end } };
  if (keyword && typeof keyword === "string" && keyword.trim()) {
    where.OR = [
      { miscellaneousReason: { contains: keyword, mode: "insensitive" } },
      { reason: { contains: keyword, mode: "insensitive" } },
    ];
  }

  try {
    const [records, totalRecords] = await Promise.all([
      prisma.miscellaneous.findMany({ where, orderBy: { createdAt: "asc" }, skip, take: limit }),
      prisma.miscellaneous.count({ where }),
    ]);

    if (records.length === 0) {
      return failureResponse(res, `No miscellaneous records for ${date}`, 404);
    }

    const totalCost = records.reduce((sum, r) => sum + (r.costOrPrice || 0), 0);
    const formatted = records.map(r => ({
      id: r.id,
      miscellaneousReason: r.miscellaneousReason,
      costOrPrice: r.costOrPrice,
      reason: r.reason,
      createdAt: r.createdAt,
    }));

    const meta = { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit) };
    const metrics = { totalRecords, totalCost: totalCost.toFixed(2), metricDate: date };
    return successResponse(res, `Miscellaneous records for ${date}`, { metrics, records: formatted }, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch miscellaneous records", 500);
  }
};

/**
 * POST /reports/miscellaneous
 */
export const createMiscellaneous = async (req: Request, res: Response): Promise<void> => {
  const { miscellaneousReason, costOrPrice, reason } = req.body;
  if (!miscellaneousReason || typeof miscellaneousReason !== "string") {
    return failureResponse(res, "miscellaneousReason is required", 400);
  }
  const price = parseFloat(costOrPrice);
  if (isNaN(price) || price < 0) {
    return failureResponse(res, "costOrPrice must be a non-negative number", 400);
  }

  try {
    const newRecord = await prisma.miscellaneous.create({
      data: { miscellaneousReason, costOrPrice: price, reason: reason || null },
    });
    return successResponse(res, "Miscellaneous record created", newRecord, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to create record", 500);
  }
};

/**
 * PATCH /reports/miscellaneous/:id
 */
export const updateMiscellaneous = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid ID", 400);

  const { miscellaneousReason, costOrPrice, reason } = req.body;
  const updateData: any = {};
  if (miscellaneousReason !== undefined) updateData.miscellaneousReason = miscellaneousReason;
  if (costOrPrice !== undefined) {
    const price = parseFloat(costOrPrice);
    if (isNaN(price) || price < 0) return failureResponse(res, "costOrPrice must be >= 0", 400);
    updateData.costOrPrice = price;
  }
  if (reason !== undefined) updateData.reason = reason;

  if (Object.keys(updateData).length === 0) {
    return failureResponse(res, "No fields to update", 400);
  }

  try {
    const existing = await prisma.miscellaneous.findUnique({ where: { id } });
    if (!existing) return failureResponse(res, "Record not found", 404);

    const updated = await prisma.miscellaneous.update({ where: { id }, data: updateData });
    return successResponse(res, "Record updated", updated);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to update record", 500);
  }
};

/**
 * DELETE /reports/miscellaneous/:id
 */
export const deleteMiscellaneous = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid ID", 400);

  try {
    const existing = await prisma.miscellaneous.findUnique({ where: { id } });
    if (!existing) return failureResponse(res, "Record not found", 404);

    await prisma.miscellaneous.delete({ where: { id } });
    return successResponse(res, "Record deleted");
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to delete record", 500);
  }
};