import prisma from "../../config/database";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  endOfDay,
  startOfDay,
} from "date-fns";
import { getClosingBalance } from "../../helpers/getClosingBalance";
import { getImageUrl } from "../../services/image.service";

export const getDashboardMetrics = async () => {
  const startToday = startOfDay(new Date());
  const endToday = endOfDay(new Date());

  const [
    totalOrdersToday,
    salesAggregate,
    totalPendingOrdersToday,
    totalCancelledOrdersToday,
    miscAggregate,
    openingBalance,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
    }),

    prisma.order.aggregate({
      _sum: { total_amount: true },
      where: {
        status: "completed",
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
    }),

    prisma.order.count({
      where: {
        status: "pending",
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
    }),

    prisma.order.count({
      where: {
        status: "cancelled",
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
    }),

    prisma.miscellaneous.aggregate({
      _sum: {
        costOrPrice: true,
      },
      where: {
        createdAt: {
          gte: startToday,
          lte: endToday,
        },
      },
    }),

    getClosingBalance(new Date()),
  ]);

  const totalSalesToday = salesAggregate._sum.total_amount || 0;
  const totalMiscCostToday = miscAggregate._sum.costOrPrice || 0;

  return {
    totalOrdersToday,
    totalSalesToday: totalSalesToday.toFixed(2),
    totalPendingOrdersToday,
    totalCancelledOrdersToday,
    totalMiscCostToday: totalMiscCostToday.toFixed(2),
    openingBalance: openingBalance.toFixed(2),
    closingBalance: (openingBalance + totalSalesToday).toFixed(2),
  };
};

export const getRevenueComparison = async () => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);

    return {
      month: format(date, "MMMM"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }).reverse();

  const revenueData = await Promise.all(
    months.map(async ({ month, start, end }) => {
      const [salesAggregate, miscAggregate] = await Promise.all([
        prisma.order.aggregate({
          _sum: { total_amount: true },
          where: {
            status: "completed",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),

        prisma.miscellaneous.aggregate({
          _sum: {
            costOrPrice: true,
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
      ]);

      const revenue = salesAggregate._sum.total_amount || 0;
      const miscellaneousCost = miscAggregate._sum.costOrPrice || 0;

      return {
        month,
        trueRevenue: revenue - miscellaneousCost,
      };
    })
  );

  return revenueData.map((item, index) => ({
    month: item.month,
    thisMonth: item.trueRevenue,
    lastMonth: index > 0 ? revenueData[index - 1].trueRevenue : 0,
  }));
};

export const getLowStockItems = async () => {
  const inventories = await prisma.inventory.findMany({
    where: {
      OR: [
        {
          quantity: {
            lte: prisma.inventory.fields.threshold,
          },
        },
      ],
    },
    orderBy: {
      quantity: "asc",
    },
    take: 5,
    select: {
      quantity: true,
      threshold: true,
      item: {
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          image: true,
          isLimited: true,
        },
      },
    },
  });

  return inventories
    .filter((item) => item.item?.isLimited)
    .map((item) => ({
      id: item.item.id,
      name: item.item.name,
      price: item.item.price,
      unit: item.item.unit,
      image: item.item.image
        ? getImageUrl(item.item.image)
        : "",
      inventory: {
        quantity: item.quantity,
        threshold: item.threshold,
      },
      status: item.quantity === 0 ? "none" : "low",
    }));
};

export const getMostOrderedItems = async () => {
  const startToday = startOfDay(new Date());
  const endToday = endOfDay(new Date());

  const mostOrderedItems = await prisma.orderItem.groupBy({
    by: ["itemId", "comboId"],
    _sum: {
      quantity: true,
    },
    where: {
      createdAt: {
        gte: startToday,
        lte: endToday,
      },
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  const items = await prisma.item.findMany({
    where: {
      id: {
        in: mostOrderedItems
          .filter((i) => i.itemId)
          .map((i) => i.itemId!),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const combos = await prisma.combo.findMany({
    where: {
      id: {
        in: mostOrderedItems
          .filter((i) => i.comboId)
          .map((i) => i.comboId!),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return mostOrderedItems
    .map((item) => {
      if (item.itemId) {
        const item : any = items.find(
          (p) => p.id === item.itemId
        );

        if (!item) return null;

        return {
          type: "item",
          id: item.id,
          name: item.name,
          totalQuantity: item._sum.quantity,
        };
      }

      if (item.comboId) {
        const combo = combos.find(
          (c) => c.id === item.comboId
        );

        if (!combo) return null;

        return {
          type: "combo",
          id: combo.id,
          name: combo.name,
          totalQuantity: item._sum.quantity,
        };
      }

      return null;
    })
    .filter(Boolean);
};