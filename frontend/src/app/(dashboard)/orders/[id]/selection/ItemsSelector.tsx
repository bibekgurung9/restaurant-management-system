import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/requests/showToast";
import { FoodItem, Combo, OrderItem } from "@/typings";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { isFoodItem, canAddItem, getLowStockInfo } from "@/utils/orderItemHelpers";
import { formatPrice } from "@/lib/format-price";

interface ItemSelectorProps {
  items: (FoodItem | Combo)[];
  selectedItems: OrderItem[];
  handleQuantityChange: (item: FoodItem | Combo, type: "food" | "combo", delta: number) => void;
  type: "food" | "combo";
  disabled: boolean;
}

function ItemSelector({ items, selectedItems, handleQuantityChange, type, disabled }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getSelectedQuantity = (item: FoodItem | Combo, type: "food" | "combo") => {
    return selectedItems.find(
      (selected) =>
        (type === "food" ? selected.itemId : selected.comboId) === item.id &&
        selected.unit === type
    )?.quantity || 0;
  };

  const isItemSelected = (item: FoodItem | Combo, type: "food" | "combo") => {
    return selectedItems.some(
      (selected) =>
        (type === "food" ? selected.itemId : selected.comboId) === item.id &&
        selected.unit === type
    );
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [
    ...filteredItems.filter((item) => isItemSelected(item, type)),
    ...filteredItems.filter((item) => !isItemSelected(item, type)),
  ];

  const handleAdd = (item: FoodItem | Combo, type: "food" | "combo") => {
    if (isFoodItem(item)) {
      if (
        item.isLimited &&
        item.inventory &&
        item.inventory.quantity <= item.inventory.threshold
      ) {
        showToast({
          message: "Cannot add item. Quantity is below the threshold.",
          status: false,
          data: undefined,
        });
        return;
      }
    } else if (Array.isArray(item.items)) {
      const insufficientStock = item.items.find(
        (comboItem) =>
          (comboItem.quantity ?? 0) <= comboItem.threshold
      );
      if (insufficientStock) {
        showToast({
          message: `Cannot add combo. Not enough stock for ${insufficientStock.name}.`,
          status: false,
          data: undefined,
        });
        return;
      }
    }
    handleQuantityChange(item, type, 1);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="flex items-center">
        <input
          type="text"
          placeholder={`Search ${type === "food" ? "food items" : "combos"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
        />
      </div>

      <div className="h-64 overflow-y-auto border rounded p-2">
        {sortedItems.map((item) => {
          const selectedQuantity = getSelectedQuantity(item, type);
          const lowStockInfo = getLowStockInfo(item);

          return (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="flex flex-grow justify-between items-center">
                <span className="flex flex-col gap-x-2 text-md flex-1">
                  <div>{item.name} - {formatPrice(item.price)}</div>
                  {lowStockInfo && (
                    <Badge variant="danger" className="capitalize w-fit text-xs">
                      {lowStockInfo}
                    </Badge>
                  )}
                </span>

                <div className="flex gap-2 items-center bg-lightGray rounded-full p-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleQuantityChange(item, type, -1)}
                    className="hover:text-primary bg-white rounded-full p-2"
                    disabled={selectedQuantity <= 0 || disabled}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>

                  <span className="w-12 text-center text-sm">{selectedQuantity}</span>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleAdd(item, type)}
                    className="hover:text-primary bg-white rounded-full p-2"
                    disabled={!canAddItem(item) || disabled}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItemSelector;
