"use client";
import React, { useState } from "react";
import { Combo, FoodItem, OrderItem } from "@/typings";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import subImage from "@/../../public/assets/Thakali.png";
import { isFoodItem, createOrderItem, itemExists } from "@/utils/orderItemHelpers";

function ItemsSelection({
  data,
  selectedItems,
  setSelectedItems,
  type,
}: {
  data: (FoodItem | Combo)[];
  selectedItems: OrderItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  type: "food" | "combo";
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const addItem = (item: FoodItem | Combo) => {
    if (itemExists(selectedItems, item, type)) {
      toast.info("This item already exists.");
      return;
    }

    const orderItem = createOrderItem(item, type);
    setSelectedItems([...selectedItems, orderItem]);
  };

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex items-center p-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-600 mb-4">
            No items found. Add some {type === "food" ? "food items" : "combos"}!
          </p>
          <Link href={type === "food" ? "/menu/items/new" : "/menu/combos/new"}>
            <button className="bg-primary text-white px-4 py-2 rounded-md">
              Add {type === "food" ? "Food Item" : "Combo"}
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex mt-6 h-full flex-wrap gap-4 overflow-auto">
          {filteredData.map((item: FoodItem | Combo, i: number) => (
            <div
              key={i}
              onClick={() => {
                if (item.available) {
                  if (type === "combo") {
                    const combo = item as Combo;
                    const comboItems = typeof combo.items === "string" ? JSON.parse(combo.items) : combo.items;
                    const belowThreshold = comboItems.some((comboItem: any) => comboItem.quantity < comboItem.threshold);

                    if (belowThreshold) {
                      toast.error(`One or more items in this combo are below threshold and cannot be ordered.`);
                      return;
                    }
                  }
                  addItem(item);
                } else {
                  toast.error(
                    type === "food"
                      ? "This item is currently unavailable."
                      : "This combo is currently unavailable."
                  );
                }
              }}
              className={`flex w-52 h-48 flex-col gap-2 border rounded-md bg-lightGray ${item.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                }`}
            >
              <div className="relative h-[80%] w-full">
                <Image
                  fill
                  src={item.image ? item.image : subImage}
                  className="rounded-t-md object-cover"
                  alt={item.name}
  placeholder="empty"
                />
              </div>
              <div className="flex flex-col gap-1 px-2 py-1">
                <span className="text-sm">{item.name}</span>
                <span className="flex  text-primary text-sm">
                  NPR {item.price}
                </span>
                {/* Display quantity only for FoodItem */}
                {isFoodItem(item) && item.inventory ? (
                  <span className="text-xs text-gray-500">
                    Available Quantity: {item.inventory.quantity}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemsSelection;
