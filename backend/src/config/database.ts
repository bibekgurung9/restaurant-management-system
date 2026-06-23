import { PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [
        // "query", // PS: Enable this for debugging purposes
        "error",
        "warn"
      ]
      : ["error"],
});

export const prisma = basePrisma.$extends({
  query: {
    orderItem: {
      async create({ args, query }) {
        if (
          args.data.quantity !== undefined &&
          args.data.price !== undefined
        ) {
          args.data.totalPrice =
            Number(args.data.quantity) * Number(args.data.price);
        }

        return query(args);
      },

      async update({ args, query }) {
        const quantity = args.data.quantity;
        const price = args.data.price;

        if (quantity !== undefined || price !== undefined) {
          let finalQty =
            typeof quantity === "number"
              ? quantity
              : typeof quantity === "object" &&
                quantity &&
                "set" in quantity
                ? (quantity as any).set
                : undefined;

          let finalPrice =
            typeof price === "number"
              ? price
              : typeof price === "object" &&
                price &&
                "set" in price
                ? (price as any).set
                : undefined;

          if (finalQty === undefined || finalPrice === undefined) {
            const existing = await basePrisma.orderItem.findUnique({
              where: args.where,
              select: {
                quantity: true,
                price: true,
              },
            });

            if (existing) {
              finalQty =
                finalQty !== undefined ? finalQty : existing.quantity;

              finalPrice =
                finalPrice !== undefined ? finalPrice : existing.price;
            }
          }

          if (finalQty !== undefined && finalPrice !== undefined) {
            args.data.totalPrice =
              Number(finalQty) * Number(finalPrice);
          }
        }

        return query(args);
      },
    },
  },
});

export default prisma;