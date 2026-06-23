import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { restaurantConfig } from "@/config/restaurant";
import { formatPrice } from "@/lib/format-price";
import { ShoppingBag, CreditCard, Clock } from "lucide-react";

interface MetricsProps {
  todaySales: number;
  todayOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
}

export default function MetricsGrid({ metrics }: { metrics: MetricsProps }) {
  const { todaySales, todayOrders, avgOrderValue, pendingOrders } = metrics;

  const cards = [
    {
      title: "Today's Sales",
      value: `${formatPrice(todaySales)}`,
      icon: restaurantConfig.currencyIcon,
      // change: "+12%",
      // changeType: "positive",
    },
    {
      title: "Total Orders",
      value: todayOrders,
      icon: ShoppingBag,
      // change: "+5%",
      // changeType: "positive",
    },
    {
      title: "Average Order",
      value: `${formatPrice(avgOrderValue)}`,
      icon: CreditCard,
      // change: "-2%",
      // changeType: "negative",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      change: pendingOrders > 0 ? "Needs attention" : "All clear",
      changeType: pendingOrders > 0 ? "warning" : "positive",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className={`text-xs ${
              card.changeType === "positive" ? "text-green-600" :
              card.changeType === "negative" ? "text-red-600" : "text-amber-600"
            }`}>
              {card.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}