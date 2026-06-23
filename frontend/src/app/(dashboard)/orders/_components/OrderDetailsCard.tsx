import { Order } from "@/typings";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { getOrderBadgeVariant } from "../../../../utils/badgeVariants";
import { formatDate } from "../../../../lib/format-date";
import { formatPrice } from "@/lib/format-price";

interface OrderDetailsCardProps {
  order: Order;
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({ order }) => {
  const {
    status,
    totalAmount,
    orderItems,
    paymentMode,
    paymentDetails,
  } = order;
  const {
    customerName,
    tipAmount,
    paidAmount,
    paymentStatus,
    paymentDate,
    vatAmount,
    serviceChargeAmount,
    discountAmount,
    discountPercent,
    vatPercentage,
    serviceChargePercentage,
    totalAmountAfterTaxes,
  } = paymentDetails || {};

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white w-full mx-auto mt-6">
      <h3 className="flex items-center justify-center gap-2 font-semibold text-2xl mb-6 t">
        Order Details
        <Badge variant={getOrderBadgeVariant(status)} className="capitalize">
          {status}
        </Badge>
      </h3>

      <h4 className="font-semibold text-xl mb-4">Order Items</h4>
      <div className="overflow-y-auto max-h-72 space-y-3">
        {orderItems && orderItems.length > 0 ? (
          orderItems.map((item) => (
            <div key={item.id} className="flex justify-between text-md">
              <div>{item.quantity} x {item.itemName || item.comboName || "Unknown"}</div>
              <div>
                {formatPrice((item.price || 0) * item.quantity)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No items in this order.</p>
        )}
      </div>

      {/* Total Amount */}
      <div className="mt-6 mb-4 text-lg font-medium">
        <strong>Total Amount:</strong> {formatPrice(totalAmount)}
        <span className="text-slate-400 text-sm"> ( Before Charges )</span>
      </div>

      {/* Payment Details (only if status is 'completed') */}
      {status === "completed" && paymentDetails && (
        <>
          <h4 className="font-bold text-2xl mb-6 text-center">Payment Details</h4>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2">
            <div className="mb-4 text-lg">
              <strong>Paid Amount:</strong>{formatPrice(paidAmount)}
            </div>
            <div className="mb-4 text-lg">
              <strong>Payment Mode:</strong> {paymentMode}
            </div>
            <div className="mb-4 text-lg">
              <strong>Payment By:</strong> {customerName ? customerName : "NA"}
            </div>
            <div className="mb-4 text-lg">
              <strong>Payment Status:</strong> {paymentStatus}
            </div>

          </div>
        </>

      )}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {paymentDate && (
          <div className="mb-4 text-lg">
            <strong>Payment Date:</strong> {formatDate(paymentDate)}
          </div>
        )}

        {/* Discount */}
        {discountAmount > 0 && (
          <div className="mb-4 text-lg">
            <strong>Discount:</strong> {discountPercent}% off
          </div>
        )}

        {/* VAT */}
        {vatAmount > 0 && (
          <div className="mb-4 text-lg">
            <strong>VAT:</strong> {vatPercentage}%
          </div>
        )}

        {/* Service Charge */}
        {serviceChargeAmount > 0 && (
          <div className="mb-4 text-lg">
            <strong>Service Charge:</strong> {serviceChargePercentage}%
          </div>
        )}

        {/* Tip Charge */}
        {tipAmount > 0 && (
          <div className="mb-4 text-lg">
            <strong>Tips:</strong> {formatPrice(tipAmount)}
          </div>
        )}

      </div>
      {totalAmountAfterTaxes && (
        <div className="mb-4 text-2xl font-semibold text-center">
          <strong>Final Total:</strong> {formatPrice(totalAmountAfterTaxes)}
        </div>
      )}
    </div>
  );
};

export default OrderDetailsCard;
