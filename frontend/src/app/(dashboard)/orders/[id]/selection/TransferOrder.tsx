"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OrderItem, Table } from "@/typings";
import { usePagination } from "./helper";
import { ArrowBigRight, ChevronLeft, ChevronRight } from "lucide-react";


interface TransferOrderDialogProps {
  orderItems: OrderItem[];
  onTransfer: (selectedItems: { id: number; quantity: number }[], targetTableId: number) => void;
  availableTables: Table[];
  currentTableName: string;
  disabled: boolean;
}

function TransferOrderDialog({
  orderItems,
  onTransfer,
  availableTables,
  currentTableName,
  disabled,
}: TransferOrderDialogProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ id: number; quantity: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const foodItems = orderItems.filter((item) => item.unit === "food");
  const comboItems = orderItems.filter((item) => item.unit === "combo");

  const foodPagination = usePagination(foodItems, 5);
  const comboPagination = usePagination(comboItems, 5);

  const handleCheckboxChange = (itemId: number, maxQuantity: number) => {
    setSelectedItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        return prev.filter((item) => item.id !== itemId);
      } else {
        return [...prev, { id: itemId, quantity: maxQuantity }];
      }
    });
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    setSelectedItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
      }
      return prev;
    });
  };

  const handleTransfer = async () => {
    if (!selectedTable) {
      toast.error("Please select a table to transfer to.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to transfer.");
      return;
    }

    if (disabled) {
      toast.error("You have unsaved changes. Please update the order first.");
      return;
    }

    setLoading(true);
    try {
      const itemsToTransfer = selectedItems.map((selected) => {
        const originalItem = orderItems.find((item) => item.id === selected.id);
        return {
          id: selected.id,
          quantity: Math.min(selected.quantity, originalItem?.quantity || 0),
        };
      });

      onTransfer(itemsToTransfer, selectedTable);
      setIsOpened(false);
    } catch (error) {
      toast.error("Error transferring items.");
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the dialog with a check
  const handleDialogOpenChange = (open: boolean) => {
    if (open && disabled) {
      toast.error("You have unsaved changes. Please update the order first.");
      setIsOpened(false);
    } else {
      setIsOpened(open);
    }
  };
  return (
    <Dialog open={isOpened} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger className=" bg-primary rounded-md hover:bg-primary/80 p-2  text-white">Transfer Items?</DialogTrigger>
      <DialogContent className="max-h-[800px] overflow-auto">
        <DialogTitle className="text-xl mb-4">
          Transfer Order Items
        </DialogTitle>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-lg">{currentTableName}</span>
              <ArrowBigRight />
              <select
                id="table"
                value={selectedTable || ""}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="p-2 border rounded w-1/2"
              >
                <option value="" disabled>
                  Select a table
                </option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id!}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {foodItems.length > 0 && (
            <div className="w-full">
              <div className="flex items-center">
                <h3 className="font-semibold">Food Items</h3>
                <div className="flex justify-between">
                  <Button
                    variant="link"
                    size="icon"
                    disabled={!foodPagination.hasPreviousPage}
                    onClick={foodPagination.previousPage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="link"
                    size="icon"
                    disabled={!foodPagination.hasNextPage}
                    onClick={foodPagination.nextPage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {foodPagination.paginatedItems.map((item: any) => {
                  const selectedItem = selectedItems.find((selected) => selected.id === item.id);
                  const isSelected = !!selectedItem;
                  const currentQuantity = selectedItem ? selectedItem.quantity : item.quantity;

                  return (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(item.id!, item.quantity)}
                      />
                      <span className="font-semibold">
                        {item.itemName || item.comboName}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">(x{item.quantity})</span>
                      {isSelected && (
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={currentQuantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id!,
                              Math.min(Number(e.target.value), item.quantity)
                            )
                          }
                          className="w-16 p-1 border rounded"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {comboItems.length > 0 && (
            <div className="w-full">
              <h3 className="font-semibold">Combo Items</h3>
              <ul className="space-y-2">
                {comboPagination.paginatedItems.map((item) => {
                  const selectedItem = selectedItems.find((selected) => selected.id === item.id);
                  const isSelected = !!selectedItem;
                  const currentQuantity = selectedItem ? selectedItem.quantity : item.quantity;

                  return (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(item.id!, item.quantity)}
                      />
                      <span className="font-semibold">
                        {item.itemName || item.comboName}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">(x{item.quantity})</span>
                      {isSelected && (
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={currentQuantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id!,
                              Math.min(Number(e.target.value), item.quantity)
                            )
                          }
                          className="w-16 p-1 border rounded"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Pagination Controls */}
              <div className="flex justify-between mt-2">
                <Button
                  variant="link"
                  size="icon"
                  disabled={!comboPagination.hasPreviousPage}
                  onClick={comboPagination.previousPage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="link"
                  size="icon"
                  disabled={!comboPagination.hasNextPage}
                  onClick={comboPagination.nextPage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setIsOpened(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={loading}
            onClick={handleTransfer}
            className="bg-primary text-white"
          >
            {loading ? "Transferring..." : "Transfer Selected Items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransferOrderDialog;
