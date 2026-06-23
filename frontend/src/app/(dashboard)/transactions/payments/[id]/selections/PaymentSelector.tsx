import React from "react";
import Image from "next/image";
import { paymentMethods } from "@/config/constant";

interface PaymentMethodSelectorProps {
  status: string | undefined;
  selectedMethod: string;
  onSelect: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  status,
  selectedMethod,
  onSelect,
}) => {

  const isDisabled = status === "completed" || status === "credit";

  return (
    <div className="flex gap-4 my-4">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          onClick={() => !isDisabled && onSelect(method.id)} 
          className={`cursor-pointer p-2 rounded-md flex flex-col items-center ${selectedMethod === method.id ? "border-2 border-primary" : "border border-gray-200"
            } w-20 h-20 ${isDisabled ? "opacity-50 pointer-events-none" : ""
            }`}
        >
          {method.image ? (
            <Image
              src={method.image}
              alt={method.label}
              className={`rounded-md ${isDisabled ? "blur-xs" : ""}`}
              placeholder="blur"
            />
          ) : (
            method.icon
          )}
          <p className={`text-sm text-center mt-2 ${isDisabled ? "text-gray-400" : ""}`}>
            {method.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;
