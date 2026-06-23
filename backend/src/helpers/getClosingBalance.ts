import { startOfDay, endOfDay } from "date-fns";
import prisma from "../config/database";

// Helper function to retrieve the previous day's closing balance
export const getClosingBalance = async (date: Date): Promise<number> => {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  const startOfPreviousDay = startOfDay(previousDay);
  const endOfPreviousDay = endOfDay(previousDay);

  const aggregate = await prisma.payment.aggregate({
    _sum: {
      paidAmount: true,
    },
    where: {
      updatedAt: {
        gte: startOfPreviousDay,
        lte: endOfPreviousDay,
      },
    },
  });

  return aggregate._sum.paidAmount || 0;
};