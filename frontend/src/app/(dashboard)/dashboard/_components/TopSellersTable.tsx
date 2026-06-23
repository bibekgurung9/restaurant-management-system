import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopSeller {
  itemId: number;
  name: string;
  totalQuantity: number;
}

export default function TopSellersTable({ items }: { items: TopSeller[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Selling Items</CardTitle>
        <p className="text-sm text-gray-500">Last 7 days</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No sales data available.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.itemId} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <Badge variant="success">{item.totalQuantity} sold</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}