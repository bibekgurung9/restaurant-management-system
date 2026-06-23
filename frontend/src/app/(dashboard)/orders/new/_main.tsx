"use client";
import { DialogContent } from "@/components/ui/dialog";
import { Combo, FoodItem, OrderItem, Table } from "@/typings";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import ItemsSelection from "./selection";

function Screens({
  foodItems,
  combos,
  table,
  onClose,
}: {
  foodItems: FoodItem[];
  combos: Combo[];
  table: Table;
  onClose: () => void;
}) {
  let [selectedItems, setSelectedItems] = useState<OrderItem[]>(
    table.pendingOrder?.items || []
  );

  return (
    <DialogContent className=" min-w-[80%] h-[90%]">
      <div className="absolute top-4 right-4">
        <XMarkIcon
          className="h-8 w-8 cursor-pointer"
          onClick={onClose}
        />
      </div>

      <div className="flex gap-4 h-full w-full">
        <ItemsSelection
          foodItems={foodItems}
          combos={combos}
          table={table}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onClose={onClose}
        />
      </div>
    </DialogContent>
  );
}

export default Screens;
