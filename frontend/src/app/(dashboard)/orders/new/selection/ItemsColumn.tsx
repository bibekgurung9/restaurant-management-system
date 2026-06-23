import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrderItem, Table } from "@/typings";
import { CreditCardIcon } from "@heroicons/react/24/solid";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOrder, createOrderWithToast } from "@/server-actions/order.actions";


function ItemsColumn({
  selectedItems,
  setSelectedItems,
  table,
  onClose,
}: {
  selectedItems: OrderItem[];
  setSelectedItems: any;
  table: Table;
  onClose: () => void;
}) {
  const { replace, push } = useRouter();

  const [body, setBody] = useState({
    appliedDiscount: 0,
    discountAmount: 0,
    paymentMode: null,
    guestCount: 1,
  });

  const increaseQuantity = (itemId: number, isCombo: boolean) => {
    const updatedItems = selectedItems.map((item) => {
      const isMatch = isCombo ? item.comboId === itemId : item.itemId === itemId;
      return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
    });
    setSelectedItems(updatedItems);
  };

  const decreaseQuantity = (itemId: number, isCombo: boolean) => {
    const updatedItems = selectedItems
      .map((item) => {
        const isMatch = isCombo ? item.comboId === itemId : item.itemId === itemId;
        return isMatch ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter((item) => {
        const isMatch = isCombo ? item.comboId === itemId : item.itemId === itemId;
        return !(isMatch && item.quantity === 0);
      });
    setSelectedItems(updatedItems);
  };

  const getTotalQuantity = () => {
    const total = selectedItems.reduce(
      (acc, currentItem) => acc + currentItem.quantity,
      0
    );
    return total;
  };

  const getTotalPrice = () => {
    const totalPrice = selectedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    return totalPrice;
  };

const handleGuestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = Math.max(
    1,
    Math.min(parseInt(e.target.value) || 1, Number(table.capacity))
  );

  setBody((prev) => ({ ...prev, guestCount: value }));
};
  const proceedToPaymentButton = async () => {
    const res = await createOrder({
      tableId: Number(table.id),
      items: selectedItems,
      guestCount: body.guestCount,
      appliedDiscount: body.appliedDiscount,
      discountAmount: body.discountAmount,
      paymentMode: body.paymentMode,
    });

    if (res?.data?.orderId) {
      replace(`/transactions/payments/${res.data.orderId}`);
    }
  };

  return (
    <div className="relative flex flex-col h-full gap-4 p-4 bg-lightGray rounded-md shadow-md">
      <div className="flex items-center justify-between">
        <span className="normal-text">Selected Items</span>
        <span className="py-2 px-4 rounded-md bg-primary shadow-sm text-white">
          {getTotalQuantity()}
        </span>
      </div>

      {/* SELECTED FOOD ITEM LIST */}
      <div className="h-full bg-white rounded-sm overflow-y-scroll">
        {selectedItems?.map((item, i: number) => (
          <div key={i} className="flex flex-col gap-1 py-2 px-3 border-b">
            <span className="secondary-text">{item.name}</span>
            <div className="flex justify-between items-center">
              <span className="secondary-text text-primary">
                {item?.price * item?.quantity}
              </span>
              <div className="flex gap-4 items-center bg-lightGray rounded-full p-1">
                <button
                  type="button"
                  onClick={() => decreaseQuantity(item.itemId || item.comboId!, !!item.comboId)}
                  className="hover:text-primary bg-white rounded-full p-2"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="secondary-text">{item?.quantity}</span>
                <button
                  type="button"
                  onClick={() => increaseQuantity(item.itemId || item.comboId!, !!item.comboId)}
                  className="hover:text-primary bg-white rounded-full p-2"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guest Count Input */}
      <div className="bg-white flex flex-col gap-2 h-fit border-t border-primary py-2 px-4 w-full rounded-t-md">
        <div className="flex items-center justify-between">
          <label className="normal-text" htmlFor="guestCount">
            Number of Guests
          </label>
          <input
            type="number"
            id="guestCount"
            value={body.guestCount}
            onChange={handleGuestCountChange}
            min={1}
            max={table.capacity}
            className="w-20 p-2 border rounded-md"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="normal-text">Total</span>
          <span className="text-primary normal-text font-semibold">
            NPR. {getTotalPrice()}
          </span>
        </div>

        <form
          action={async () => {
            const res = await createOrderWithToast({
              tableId: Number(table.id),
              items: selectedItems,
              guestCount: body.guestCount,
              appliedDiscount: body.appliedDiscount,
              discountAmount: body.discountAmount,
              paymentMode: body.paymentMode,
            });
            if (res?.status) {
              onClose();
              replace(`/orders`);
            }
          }}
        >
          <SubmitButton className="w-full" pendingText="Placing an order...">
            Confirm order
          </SubmitButton>
          <Button
            type="button"
            onClick={proceedToPaymentButton}
            variant={"secondary"}
            className="mt-2 w-full"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Proceed to Payment
          </Button>
        </form>

      </div>
    </div>
  );
}

export default ItemsColumn;
