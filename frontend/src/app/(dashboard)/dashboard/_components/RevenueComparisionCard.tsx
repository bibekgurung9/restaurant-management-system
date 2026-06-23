"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format-price";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface RevenueData {
  currentWeekRevenue: number;
  previousWeekRevenue: number;
  percentChange: number;
}

export default function RevenueComparisonCard({ data }: { data: RevenueData }) {
  const isPositive = data.percentChange >= 0;
  const maxValue = Math.max(data.currentWeekRevenue, data.previousWeekRevenue);
  const currentBarWidth = (data.currentWeekRevenue / maxValue) * 100;
  const previousBarWidth = (data.previousWeekRevenue / maxValue) * 100;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Revenue Comparison</CardTitle>
        <p className="text-sm text-gray-500">Last 7 days vs previous week</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Percentage change chip */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(data.percentChange)}%
          </div>
          <span className="text-sm text-gray-500">vs previous week</span>
        </div>

        {/* Bar chart */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>This week</span>
              <span className="font-semibold">{formatPrice(data.currentWeekRevenue)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${currentBarWidth}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Previous week</span>
              <span className="font-semibold">{formatPrice(data.previousWeekRevenue)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: `${previousBarWidth}%` }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}