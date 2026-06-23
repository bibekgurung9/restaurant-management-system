import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface CancellationRateProps {
  data: {
    completedOrders: number;
    cancelledOrders: number;
    cancellationRate: number;
  };
}

export default function CancellationRateCard({ data }: CancellationRateProps) {
  const { completedOrders, cancelledOrders, cancellationRate } = data;

  // Decide colour based on rate
  const rateColor = cancellationRate > 10 ? "text-red-600" : cancellationRate > 5 ? "text-yellow-600" : "text-green-600";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${rateColor}`}>{cancellationRate}%</div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Completed: {completedOrders}</span>
          <span>Cancelled: {cancelledOrders}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Last 7 days
        </p>
      </CardContent>
    </Card>
  );
}