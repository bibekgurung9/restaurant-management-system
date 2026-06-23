import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, XCircle } from "lucide-react";

interface CancelOrderProps {
  isOrderCancelled: boolean;
  setIsOrderCancelled: (cancelled: boolean) => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  disabled: boolean;
}

const CancelOrder = ({ 
  isOrderCancelled, 
  setIsOrderCancelled, 
  cancelReason, 
  setCancelReason, 
  disabled 
}: CancelOrderProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id="cancelOrder"
          checked={isOrderCancelled}
          onChange={(e) => setIsOrderCancelled(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive"
        />
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <XCircle className="w-4 h-4 text-destructive" />
          Cancel this order
        </span>
      </label>
    </div>

    {isOrderCancelled && (
      <div className="relative">
        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="cancelReason"
          disabled={disabled}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Enter reason for canceling the order..."
          required
          className="pl-9 h-11"
        />
      </div>
    )}
  </div>
);

export default CancelOrder;