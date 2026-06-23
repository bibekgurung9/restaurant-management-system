import prisma from "../config/database";
import { io } from "./../app";

export const checkLowStockAndNotify = async (): Promise<void> => {
  try {
    const allInventories = await prisma.inventory.findMany({
      select: {
        itemId: true,
        quantity: true,
        threshold: true,
      },
    });

    // Filter inventories with low stock (quantity less than threshold)
    const lowStockInventories = allInventories.filter(
      (inv) => inv.quantity < inv.threshold
    );

    if (lowStockInventories.length === 0) {
      io.emit("low-stock-alert", { message: "No items are low in stock.", status: false });
      return;
    }

    const lowStockItemIds = lowStockInventories.map((inventory) => inventory.itemId);

    const items = await prisma.item.findMany({
      where: {
        id: { in: lowStockItemIds },
        isLimited: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        image: true,
      },
    });

    const lowStockNotifications = lowStockInventories
      .map((inventory) => {
        const item = items.find((item) => item.id === inventory.itemId);
        if (item) {
          return {
            productId: item.id,
            productName: item.name,
            quantity: inventory.quantity,
            threshold: inventory.threshold,
            status: inventory.quantity === 0 ? "out-of-stock" : "low-stock",
          };
        }
        return null;
      })
      .filter((notification) => notification !== null);

    io.emit("low-stock-alert", lowStockNotifications);
  } catch (error) {
    console.error("Error checking low stock items:", error);
  }
};