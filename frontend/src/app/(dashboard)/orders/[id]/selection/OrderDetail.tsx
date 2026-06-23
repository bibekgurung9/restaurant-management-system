import { Badge } from "@/components/ui/badge";
import { getOrderBadgeVariant } from "@/utils/badgeVariants";
import { Order } from "@/typings";

interface OrderDetailProps {
  detail: Order;
}

function OrderDetail({ detail }: OrderDetailProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-x-4">
        <h3 className="font-semibold text-xl">Order Status:</h3>
        <Badge variant={getOrderBadgeVariant(detail?.status)} className="capitalize">
          {detail?.status}
        </Badge>
      </div>

      <div className="flex gap-x-4">
        <h4 className="font-semibold">Table:</h4>
        <div>
          {detail?.table?.name}
          <span> | Capacity: {detail?.table?.capacity}</span>
        </div>
      </div>

      <div className="flex gap-x-4">
        <h4 className="font-semibold">Guests:</h4>
        <span>{detail?.guests}</span>
      </div>
    </div>
  );
}

export default OrderDetail;
