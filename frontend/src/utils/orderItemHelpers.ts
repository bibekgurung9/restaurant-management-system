import { FoodItem, Combo, OrderItem } from "@/typings";

/**
 * Type guard to check if an item is a FoodItem
 */
export const isFoodItem = (item: FoodItem | Combo): item is FoodItem => {
  return (item as FoodItem).inventory !== undefined;
};

/**
 * Check if an item can be added to the order
 */
export const canAddItem = (item: FoodItem | Combo): boolean => {
  if (isFoodItem(item)) {
    return (
      !item.isLimited ||
      (item.inventory?.quantity ?? 0) > (item.inventory?.threshold ?? 0)
    );
  }
  return Array.isArray(item.items) && item.items.every((comboItem) => comboItem.quantity ?? 0 > comboItem.threshold);
};

/**
 * Get low stock warning badge for an item
 */
export const getLowStockInfo = (item: FoodItem | Combo): string | null => {
  if (isFoodItem(item)) {
    if (item.isLimited && item.inventory && item.inventory.quantity <= item.inventory.threshold) {
      return "Low Stock";
    }
  } else if (Array.isArray(item.items)) {
    const lowStockItems = item.items.filter((comboItem) => comboItem.quantity ?? 0 > comboItem.threshold);
    if (lowStockItems.length > 0) {
      return `Low Stock: ${lowStockItems.map((i) => i.name).join(", ")}`;
    }
  }
  return null;
};

/**
 * Create an OrderItem from a FoodItem or Combo
 */
export const createOrderItem = (item: FoodItem | Combo, type: "food" | "combo"): OrderItem => {
  return {
    id: item.id,
    [type === "food" ? "itemId" : "comboId"]: item.id,
    name: item.name,
    price: item.price,
    quantity: 1,
    unit: type,
  };
};

/**
 * Check if item already exists in selected items
 */
export const itemExists = (selectedItems: OrderItem[], item: FoodItem | Combo, type: "food" | "combo"): boolean => {
  const id = item.id;
  return selectedItems.some((existingItem) =>
    type === "food" ? existingItem.itemId === id : existingItem.comboId === id
  );
};

/**
 * Prepare items for API request (remove undefined values)
 */
export const prepareItemsForRequest = (selectedItems: OrderItem[]) => {
  return selectedItems.map(({ itemId, comboId, quantity }) => ({
    ...(itemId && { itemId }),
    ...(comboId && { comboId }),
    quantity,
  }));
};
