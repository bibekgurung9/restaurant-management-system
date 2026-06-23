"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { Order } from "@/typings";
import PaymentMethodSelector from "./selections/PaymentSelector";
import OrderDetailsCard from "@/app/(dashboard)/orders/_components/OrderDetailsCard";
import { toast } from "sonner";
import { ExternalLink, PrinterIcon, Gift } from "lucide-react";
import { validatePhoneNumber } from "./helper";
import Link from "next/link";
import InputField from "./selections/InputFields";
import LoyaltyProgramSelector from "./selections/LoyaltyProgramSelector";
import { creditPaymentMethods } from "@/config/constant";
import { completeOrderUrl, searchCustomerUrl, checkLoyaltyEligibilityUrl, getRecieptUrl } from "@/config/urls";

interface OrderCheckoutProps {
  data?: Order | null;
}

const OrderCheckout: React.FC<OrderCheckoutProps> = ({ data }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [vatPercentage, setVatPercentage] = useState<number>(0);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<any[]>([]);
  const [selectedLoyaltyProgram, setSelectedLoyaltyProgram] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<string | null>(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { back, push } = useRouter();

  useEffect(() => {
    if (data) {
      setOrder(data);
      setLoading(false);
    }
  }, [data]);

  const isOrderCompletedOrCancelled = order?.status === "completed" || order?.status === "cancelled";

  // Recalculate when dependencies change
  useEffect(() => {
    if (order) {
      setPaymentAmount(calculateTotalAmount());
    }
  }, [order, discountAmount, vatPercentage, serviceChargePercentage]);

  const fetchCustomerByPhone = async (phone: string) => {
    try {
      const requests = await RequestHandler();
      const res = await requests.get(`${searchCustomerUrl}?phone=${phone}`);
      if (res.status && res.data) {
        const customer = res.data;
        setOrder((prevOrder) => ({ ...prevOrder!, customerId: customer.id || customer.customerId }));
        setCustomerFound(true);
        await checkLoyaltyEligibility(customer.id || customer.customerId);
      } else {
        setCustomerFound(false);
        resetLoyalty();
        toast("Customer not found. You can create a new customer.");
      }
    } catch (error) {
      toast("Failed to fetch customer data.");
    }
  };

  const checkLoyaltyEligibility = async (customerId: number) => {
    try {
      const requests = await RequestHandler();
      const res = await requests.post(checkLoyaltyEligibilityUrl, {
        body: JSON.stringify({ customerId }),
      });
      if (res.status && res.data) {
        const { eligiblePrograms } = res.data;
        setLoyaltyPrograms(eligiblePrograms);
        if (eligiblePrograms && eligiblePrograms.length > 0) {
          const bestProgram = eligiblePrograms[0]; // or pick the highest discount
          setSelectedLoyaltyProgram(bestProgram);
          setDiscountAmount(bestProgram.discount);
          toast.success(`Loyalty discount of ${bestProgram.discount}% applied from "${bestProgram.name}"`);
        } else {
          resetLoyalty();
          toast.info("No active loyalty program available for this customer.");
        }
      } else {
        resetLoyalty();
      }
    } catch (error) {
      console.error("Loyalty check error:", error);
      resetLoyalty();
      toast("Failed to check loyalty eligibility.");
    }
  };

  const resetLoyalty = () => {
    setLoyaltyPrograms([]);
    setSelectedLoyaltyProgram(null);
    setDiscountAmount(0);
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustomerPhone(phone);
    resetLoyalty();
    if (phone.length <= 10 && validatePhoneNumber(phone)) {
      await fetchCustomerByPhone(phone);
    } else {
      setCustomerFound(null);
    }
  };

  const calculateTotalAmount = () => {
    if (!order) return 0;
    const discount = discountAmount || 0;
    const vat = vatPercentage || 0;
    const serviceCharge = serviceChargePercentage || 0;

    const adjustedTotal = order.totalAmount! - (order.totalAmount! * discount / 100);
    const totalWithVat = adjustedTotal + (adjustedTotal * vat / 100);
    const finalTotal = totalWithVat + (totalWithVat * serviceCharge / 100);
    return finalTotal;
  };

  const handlePaymentUpdate = async () => {
    if (!order) return;
    if (paymentMode === "credit" && (!partialPaymentMethod || partialPaymentAmount === null)) {
      toast.error("Please select a partial payment method and enter the amount.");
      return;
    }
    // if (!order.customerId && !customerPhone) {
    //   toast.error("Customer phone is required.");
    //   return;
    // }

    setIsSubmitting(true);
    try {
      // If customer not yet attached, attach by phone (but we already have customerId after fetch)
      if (!order.customerId && customerPhone && customerFound === true) {
        // wait for fetch? Actually fetchCustomerByPhone already sets customerId.
        // ensure we have customerId
      }

      const updatedOrder = {
        payment_mode: paymentMode,
        paidAmount: paymentMode === "credit" ? 0 : paymentAmount,
        customerId: order.customerId,
        discountPercent: discountAmount,
        vatPercentage: vatPercentage,
        serviceChargePercentage: serviceChargePercentage,
        actualTotalAmount: order.totalAmount,
        partialPaymentMethod: paymentMode === "credit" ? partialPaymentMethod : null,
        partialPaymentAmount: paymentMode === "credit" ? partialPaymentAmount : null,
        tipAmount: tipAmount || 0,
      };

      const requests = await RequestHandler();
      const res = await requests.post(completeOrderUrl(order.id), {
        body: JSON.stringify(updatedOrder),
      });

      if (res.status) {
        toast.success("Order completed successfully!");
        // Redirect to receipt page using the receipt endpoint
        push(`/transactions/reciept/${order.id}`);
      } else {
        showToast(res);
      }
    } catch (error: any) {
      console.error("Payment completion error:", error);
      toast.error(error.message || "Failed to complete order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    // Fetch receipt data from backend and print
    try {
      const requests = await RequestHandler();
      const res = await requests.get(getRecieptUrl(order!.id));
      if (res.status && res.data) {
        // Use the existing printReceipt utility with the fetched data
        const printReceipt = (await import("@/utils/printReciept")).printReceipt;
        printReceipt(res.data);
      } else {
        toast.error("Failed to load receipt");
      }
    } catch (error) {
      toast.error("Error fetching receipt");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (isOrderCompletedOrCancelled) {
    return (
      <div className="flex flex-col items-center justify-center gap-y-6 w-full max-w-md mx-auto mt-20">
        <OrderDetailsCard order={data!} />
        <h2 className="text-xl font-semibold">
          {order.status === "completed"
            ? "✅ Payment already completed!"
            : "❌ This order has been cancelled!"}
        </h2>
        <div className="flex gap-4">
          <Link href="/transactions/pending">
            <Button variant="secondary">Return</Button>
          </Link>
          {order.status === "completed" && (
            <Button onClick={handlePrintReceipt}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Determine if financial fields should be disabled due to loyalty
  const isFinancialDisabled = isOrderCompletedOrCancelled || (selectedLoyaltyProgram !== null);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 max-w-7xl mx-auto">
      {/* Left: Order Details */}
      <div className="lg:w-2/3">
        <OrderDetailsCard order={data!} />
      </div>

      {/* Right: Payment Form */}
      <div className="lg:w-2/3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Payment Details</h2>

          <div className="space-y-4">
            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Customer Phone *</label>
              <Input
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder="Enter Customer Phone"
                type="tel"
                disabled={isOrderCompletedOrCancelled}
              />
            </div>

            {/* Loyalty Program Selector */}
            {loyaltyPrograms.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1 items-center gap-2">
                  <Gift className="h-4 w-4" /> Loyalty Program
                </label>
                <LoyaltyProgramSelector
                  loyaltyPrograms={loyaltyPrograms}
                  selectedLoyaltyProgram={selectedLoyaltyProgram}
                  onSelect={(program) => {
                    setSelectedLoyaltyProgram(program);
                    setDiscountAmount(program?.discount || 0);
                  }}
                />
                {selectedLoyaltyProgram && (
                  <p className="text-xs text-green-600 mt-1">
                    {selectedLoyaltyProgram.discount}% discount applied. Manual changes disabled.
                  </p>
                )}
              </div>
            )}

            {customerFound === false && (
              <p className="text-red-500 text-sm flex gap-x-2">
                Customer not found!{" "}
                <Link href="/customers" target="_blank" className="text-blue-500 flex items-center gap-1 hover:underline">
                  Create new customer <ExternalLink className="text-sm" />
                </Link>
              </p>
            )}
            {customerFound === true && (
              <p className="text-green-500 text-sm">Customer found and attached to order.</p>
            )}

            {/* Financial Inputs - disabled when loyalty applied */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                type="number"
                label="Discount (%)"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                disabled={isFinancialDisabled}
                placeholder={""}
              />
              <InputField
                type="number"
                label="VAT (%)"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                disabled={isFinancialDisabled}
                placeholder={""}
              />
              <InputField
                type="number"
                label="Service Charge (%)"
                value={serviceChargePercentage}
                onChange={(e) => setServiceChargePercentage(parseFloat(e.target.value) || 0)}
                disabled={isFinancialDisabled}
                placeholder={""}
              />
              <InputField
                type="number"
                label="Tips (Optional)"
                value={tipAmount}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                disabled={isOrderCompletedOrCancelled}
                placeholder={""}
              />
              <div className="md:col-span-2">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>{calculateTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <PaymentMethodSelector
              status={order?.status}
              selectedMethod={paymentMode}
              onSelect={setPaymentMode}
            />

            {paymentMode === "credit" && (
              <div className="border rounded-md p-4 space-y-3">
                <h4 className="font-medium">Partial Payment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm">Partial Method</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={partialPaymentMethod || ""}
                      onChange={(e) => setPartialPaymentMethod(e.target.value)}
                    >
                      <option value="" disabled>Select method</option>
                      {creditPaymentMethods.map((method) => (
                        <option key={method.label} value={method.label}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Partial Amount</label>
                    <input
                      type="number"
                      className="w-full border rounded-md p-2"
                      placeholder="Amount"
                      value={partialPaymentAmount || ""}
                      onChange={(e) => setPartialPaymentAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => back()} type="button">
                Cancel
              </Button>
              <SubmitButton
                pendingText="Processing Payment..."
                onClick={handlePaymentUpdate}
                disabled={isOrderCompletedOrCancelled || isSubmitting}
              >
                Complete Payment
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCheckout;