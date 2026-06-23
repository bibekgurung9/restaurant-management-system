import { Request, Response } from "express";
import { startOfDay, endOfDay, subDays } from "date-fns";
import prisma from "../../config/database";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";

/**
 * Get today's date range (start to end of day)
 */
const getTodayRange = () => {
  const today = new Date();
  return { start: startOfDay(today), end: endOfDay(today) };
};

/**
 * Get date range for last N days (excluding today)
 */
const getLastNDaysRange = (days: number) => {
  const end = startOfDay(new Date()); // beginning of today
  const start = startOfDay(subDays(end, days));
  return { start, end };
};

// ========== MAIN DASHBOARD DATA ==========

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Run all independent queries in parallel
    const [
      todayMetrics,
      weeklyRevenueComparison,
      topSellingItems,
      lowStockItems,
      tableOccupancy,
      cancellationRate,
    ] = await Promise.all([
      getTodayMetrics(),
      getWeeklyRevenueComparison(),
      getTopSellingItems(5),
      getLowStockItems(),
      getTableOccupancy(),
      getCancellationRate(),
    ]);

    const dashboardData = {
      metrics: todayMetrics,
      revenueComparison: weeklyRevenueComparison,
      topSellers: topSellingItems,
      lowStocks: lowStockItems,
      tableOccupancy,
      cancellationRate,
    };

    return successResponse(res, "Dashboard data fetched", dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return failureResponse(res, "Failed to fetch dashboard data", 500);
  }
};

// ========== METRIC 1 – TODAY'S METRICS ==========
async function getTodayMetrics() {
  const { start, end } = getTodayRange();

  // Single aggregation query for completed orders today
  const orderAgg = await prisma.order.aggregate({
    where: { status: "completed", createdAt: { gte: start, lte: end } },
    _count: true,
    _sum: { total_amount: true },
  });

  const totalSales = orderAgg._sum.total_amount || 0;
  const orderCount = orderAgg._count;
  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

  // Pending orders today (separate count)
  const pendingCount = await prisma.order.count({
    where: { status: "pending", createdAt: { gte: start, lte: end } },
  });

  return {
    todaySales: totalSales,
    todayOrders: orderCount,
    avgOrderValue,
    pendingOrders: pendingCount,
  };
}

// ========== METRIC 2 – REVENUE COMPARISON (last 7 days vs previous 7) ==========
async function getWeeklyRevenueComparison() {
  const { start: lastWeekStart, end: lastWeekEnd } = getLastNDaysRange(7);
  const { start: prevWeekStart, end: prevWeekEnd } = getLastNDaysRange(14); // previous 7 days

  const [lastWeekRevenue, prevWeekRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "completed", createdAt: { gte: lastWeekStart, lt: lastWeekEnd } },
      _sum: { total_amount: true },
    }),
    prisma.order.aggregate({
      where: { status: "completed", createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
      _sum: { total_amount: true },
    }),
  ]);

  const lastWeek = lastWeekRevenue._sum.total_amount || 0;
  const prevWeek = prevWeekRevenue._sum.total_amount || 0;
  const percentChange = prevWeek === 0 ? (lastWeek > 0 ? 100 : 0) : ((lastWeek - prevWeek) / prevWeek) * 100;

  return {
    currentWeekRevenue: lastWeek,
    previousWeekRevenue: prevWeek,
    percentChange: parseFloat(percentChange.toFixed(2)),
  };
}

// ========== METRIC 3 – TOP SELLING ITEMS (by quantity) ==========
async function getTopSellingItems(limit: number = 5) {
  const { start, end } = getLastNDaysRange(7); // last 7 days

  // Group order items by item, sum quantity
  const topProducts = await prisma.orderItem.groupBy({
    by: ["itemId"],
    where: {
      order: { status: "completed", createdAt: { gte: start, lte: end } },
      itemId: { not: null },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Fetch item names for those IDs
  const itemIds = topProducts.map(p => p.itemId!).filter(Boolean);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(items.map(p => [p.id, p.name]));

  return topProducts.map(p => ({
    itemId: p.itemId,
    name: nameMap.get(p.itemId!) || "Unknown",
    totalQuantity: p._sum.quantity || 0,
  }));
}

// ========== METRIC 4 – LOW STOCK ITEMS ==========
async function getLowStockItems() {
  // Join inventory with item (only limited items)
  const lowStock = await prisma.inventory.findMany({
    where: {
      quantity: { lt: prisma.inventory.fields.threshold },
      item: { isLimited: true },
    },
    include: {
      item: { select: { id: true, name: true, unit: true } },
    },
    take: 10, // limit to 10 for dashboard
  });

  return lowStock.map(inv => ({
    itemId: inv.item.id,
    name: inv.item.name,
    currentStock: inv.quantity,
    threshold: inv.threshold,
    unit: inv.item.unit,
  }));
}

// ========== METRIC 5 – TABLE OCCUPANCY ==========
async function getTableOccupancy() {
  const [totalTables, occupiedTables] = await Promise.all([
    prisma.table.count({ where: { hide: false } }),
    prisma.table.count({ where: { status: "occupied", hide: false } }),
  ]);

  const occupancyRate = totalTables === 0 ? 0 : (occupiedTables / totalTables) * 100;
  return {
    totalTables,
    occupiedTables,
    freeTables: totalTables - occupiedTables,
    occupancyRate: parseFloat(occupancyRate.toFixed(1)),
  };
}

// ========== METRIC 6 – CANCELLATION RATE (last 7 days) ==========
async function getCancellationRate() {
  const { start, end } = getLastNDaysRange(7);

  const [completedCount, cancelledCount] = await Promise.all([
    prisma.order.count({ where: { status: "completed", createdAt: { gte: start, lte: end } } }),
    prisma.order.count({ where: { status: "cancelled", createdAt: { gte: start, lte: end } } }),
  ]);

  const total = completedCount + cancelledCount;
  const rate = total === 0 ? 0 : (cancelledCount / total) * 100;
  return {
    completedOrders: completedCount,
    cancelledOrders: cancelledCount,
    cancellationRate: parseFloat(rate.toFixed(1)),
  };
}