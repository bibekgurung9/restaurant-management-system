import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  itemId: number;
  name: string;
  currentStock: number;
  threshold: number;
  unit: string;
}

export default function LowStockAlerts({ items }: { items: LowStockItem[] }) {
  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-green-600">All items are well stocked ✓</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.itemId} className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-semibold">{item.currentStock}</span>
                  <span className="text-gray-400">/ {item.threshold} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}