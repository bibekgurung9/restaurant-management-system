"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderItem, FoodItem, Combo, Table, Order } from "@/typings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequestHandler } from "@/lib/requests/methods";
import PrintOrderButton from "@/app/(dashboard)/orders/_components/PrintOrderButton";
import { transferOrderUrl, updateOrderUrl } from "@/config/urls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import GuestCountInput from "./selection/GuestCount";
import CancelOrder from "./selection/HandleCancelOrder";
import ItemSelector from "./selection/ItemsSelector";
import OrderDetail from "./selection/OrderDetail";
import TransferOrderDialog from "./selection/TransferOrder";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, CreditCard, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/format-price";

interface UpdateOrderFormProps {
  order: Order;
  tables: Table[];
  foodItems: FoodItem[];
  combos: Combo[];
}

function UpdateOrderForm({ order, tables, foodItems, combos }: UpdateOrderFormProps) {
  const [selectedTable, setSelectedTable] = useState<number | null>(order.table?.id || null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>(
    Array.isArray(order.items)
      ? order.items.map((item) => ({
        ...item,
        unit: item.unit || "food",
      }))
      : []
  );
  const [guests, setGuests] = useState<number>(order.guests || 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOrderCancelled, setIsOrderCancelled] = useState<boolean>(order.status === "cancelled");
  const [cancelReason, setCancelReason] = useState<string>(order.cancelReason || "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const { replace, push } = useRouter();

  const validateOrderForm = (selectedTable: number | null, selectedItems: OrderItem[]): boolean => {
    if (!selectedTable || selectedItems.length === 0) {
      toast.info("Please select a table and at least one item.");
      return false;
    }
    return true;
  };

  const handleQuantityChange = (item: FoodItem | Combo, type: "food" | "combo", delta: number) => {
    if (order.status === "completed" || order.status === "cancelled") return;

    setHasUnsavedChanges(true);

    setSelectedItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (orderItem) => (orderItem.itemId === item.id || orderItem.comboId === item.id) && orderItem.unit === type
      );

      const updatedItems = [...prev];
      if (existingItemIndex >= 0) {
        const updatedQuantity = updatedItems[existingItemIndex].quantity + delta;

        if (updatedQuantity <= 0) {
          updatedItems.splice(existingItemIndex, 1);
        } else {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedQuantity,
          };
        }
      } else if (delta > 0) {
        updatedItems.push({
          id: 0,
          orderId: 0,
          itemId: type === "food" ? item.id : undefined,
          comboId: type === "combo" ? item.id : undefined,
          quantity: delta,
          price: item.price,
          unit: type,
        });
      }

      return updatedItems;
    });
  };

  const hasValidItems = () => {
    return selectedItems.some((item) => item.quantity > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOrderForm(selectedTable, selectedItems) || !hasValidItems()) {
      toast.error("Please ensure at least one item has a quantity greater than zero.");
      return;
    }

    setLoading(true);

    const updatedOrderData = {
      tableId: selectedTable,
      items: selectedItems,
      guests: guests,
      cancelOrder: isOrderCancelled ? true : false,
      cancelReason: isOrderCancelled ? cancelReason : null,
    };

    try {
      const requests = await RequestHandler();
      const res = await requests.patch(updateOrderUrl(order.id), {
        body: JSON.stringify(updatedOrderData),
        revalidateUrl: "/orders",
      });

      setLoading(false);

      if (res.status) {
        replace('/orders');
        toast.success("Order updated successfully.");
        setHasUnsavedChanges(false);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      setLoading(false);
      toast.error("Error updating order.");
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateOrderForm(selectedTable, selectedItems) || !hasValidItems()) {
      toast.error("Please ensure at least one item has a quantity greater than zero.");
      return;
    }

    setLoading(true);

    const updatedOrderData = {
      tableId: selectedTable,
      items: selectedItems,
      guests: guests,
      cancelOrder: isOrderCancelled ? true : false,
      cancelReason: isOrderCancelled ? cancelReason : null,
    };

    try {
      const requests = await RequestHandler();
      const res = await requests.patch(updateOrderUrl(order.id), {
        body: JSON.stringify(updatedOrderData),
        revalidateUrl: "/orders",
      });

      setLoading(false);

      if (res.status) {
        toast.success("Redirecting to payment!");
        push(`/transactions/payments/${order.id}`);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      setLoading(false);
      toast.error("Error updating order.");
    }
  };

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full p-4 bg-muted/20">
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => replace("/orders")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Order #{order.id}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {order && (
              <div className="flex items-center gap-3">
                <OrderDetail detail={order} />
                <PrintOrderButton order={order} hasUnsavedChanges={hasUnsavedChanges} />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold text-foreground">{totalItems}</p>
          </Card>
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Price</p>
            <p className="text-2xl font-bold text-foreground">${formatPrice(totalPrice)}</p>
          </Card>
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={order.status === "completed" ? "default" : order.status === "cancelled" ? "danger" : "warning"} className="mt-1">
              {order.status}
            </Badge>
          </Card>
          <Card className="p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Table</p>
            <p className="text-lg font-semibold text-foreground">{order.table?.name}</p>
          </Card>
        </div>

        {/* Food and Combo Tab */}
        <Card className="p-4 shadow-sm">
          <Tabs defaultValue="food-items" className="w-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-muted p-1 rounded-lg">
                <TabsTrigger 
                  value="food-items" 
                  className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Food Items
                </TabsTrigger>
                <TabsTrigger 
                  value="combos" 
                  className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Combos
                </TabsTrigger>
              </TabsList>
              {hasUnsavedChanges && (
                <Badge variant="warning" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
            </div>

            <div className="flex flex-grow overflow-hidden">
              <TabsContent value="food-items" className="flex-1 overflow-y-auto">
                <ItemSelector
                  items={foodItems}
                  selectedItems={selectedItems}
                  handleQuantityChange={handleQuantityChange}
                  type="food"
                  disabled={order.status === "completed" || order.status === "cancelled"}
                />
              </TabsContent>
              <TabsContent value="combos" className="flex-1 overflow-y-auto">
                <ItemSelector
                  items={combos}
                  selectedItems={selectedItems}
                  handleQuantityChange={handleQuantityChange}
                  type="combo"
                  disabled={order.status === "completed" || order.status === "cancelled"}
                />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Guest Count and Cancel Order */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 shadow-sm">
            <GuestCountInput
              guests={guests}
              capacity={order.table.capacity}
              setGuests={setGuests}
              disabled={order.status === "completed" || order.status === "cancelled"}
            />
          </Card>

          <Card className="p-4 shadow-sm">
            <CancelOrder
              isOrderCancelled={isOrderCancelled}
              setIsOrderCancelled={setIsOrderCancelled}
              cancelReason={cancelReason}
              setCancelReason={setCancelReason}
              disabled={order.status === "completed" || order.status === "cancelled"}
            />
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex gap-2">
            <TransferOrderDialog
              orderItems={selectedItems}
              currentTableName={order.table.name ? order.table.name : "Test Table"}
              availableTables={tables.filter(table => table.id !== order.table.id)}
              onTransfer={async (transferredItems, targetTableId) => {
                setLoading(true);
                try {
                  const transferPayload = {
                    sourceTableId: order.table.id,
                    targetTableId,
                    items: transferredItems,
                  };

                  const requests = await RequestHandler();
                  const res = await requests.post(transferOrderUrl(order.id), {
                    body: JSON.stringify(transferPayload),
                    revalidateUrl: "/orders",
                  });

                  if (res.status) {
                    replace('/orders');
                    toast.success("Items transferred successfully.");
                  } else {
                    toast.error("Failed to transfer items.");
                  }
                } catch (error) {
                  toast.error("Error transferring items.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={hasUnsavedChanges || order.status === "completed" || order.status === "cancelled"}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => replace("/orders")}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={!hasValidItems() || order.status === "completed" || order.status === "cancelled" || loading}
              className="h-11 px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!hasValidItems() || order.status === "completed" || order.status === "cancelled" || loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UpdateOrderForm;