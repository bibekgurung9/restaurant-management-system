"use client";
import Link from "next/link";

import MetricCard from "@/components/global/MetricCard";
import { useState } from "react";
import { downloadDayOrdersExcel } from "@/utils/downloadDayOrdersExcel";
import { showToast } from "@/lib/requests/showToast";
import { formatDate, formatTime } from "@/lib/format-date";
import { getOrderBadgeVariant } from "@/utils/badgeVariants";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import OrderStatusFilterActions from "@/components/search/orderFilter";
import DatePickerWithQuery from "@/components/search/DatePicker";

function DayOrdersTable({ ordersData, metricsData }: { ordersData?: any[]; metricsData?: any }) {
  const [loading, setLoading] = useState(false);

  const handleDownloadExcel = async () => {
    setLoading(true);
  
    if (!metricsData?.metricDate) {
      showToast({ message: "No data available for the selected date.", status: false, data: undefined });
      setLoading(false);
      return; 
    }
  
    try {
      const dateToDownload = metricsData.metricDate;
      await downloadDayOrdersExcel(dateToDownload);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showToast({ message: "Error downloading Excel file.", status: false, data: undefined });
    } finally {
      setLoading(false);
    }
  };
  
  const renderMetrics = () => {
    if (!metricsData) {
      return (
        <div className="grid grid-cols-3 gap-4 mb-4 cursor-default">
          <MetricCard title="Total Orders" number={0} />
          <MetricCard title="Total Sales" number="Rs. 0.00" />
          <MetricCard title="Selected Date" number="N/A" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-4 mb-4 cursor-default">
        <MetricCard title="Total Orders" number={metricsData.totalOrders || 0} />
        <MetricCard title="Total Sales" number={`Rs. ${metricsData.totalSales || "0.00"}`} />
        <MetricCard title="Selected Date" number={formatDate(metricsData?.metricDate || new Date())} />
      </div>
    );
  };

  const renderOrdersTable = () => {
    if (!ordersData || ordersData.length === 0) {
      return (
        <div className="w-full text-center text-xl text-primary font-medium mt-12">
          No orders found.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-secondary rounded-lg shadow-sm">
        <table className="w-full text-center text-sm border-collapse">
          <thead className="text-gray-700 font-medium">
            <tr className="bg-secondary">
              <th className="px-4 py-3">S. No</th>
              <th className="px-6 py-3">Order Number</th>
              <th className="px-6 py-3">Table Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Order Placed</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersData.map((order, i) => (
              <tr key={i} className="bg-white border-b hover:bg-gray-100">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-6 py-3">{order.orderId}</td>
                <td className="px-6 py-3">{order.table?.name || "N/A"}</td>
                <td className="px-6 py-3">
                  <Badge variant={getOrderBadgeVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-3">
                  <ul>
                    {order.orderItems.map((item: any, index: number) => (
                      <li key={index}>
                        {item.itemName} (Qty: {item.quantity})
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-3">{formatTime(order.createdAt)}</td>
                <td className="px-6 py-3">
                  <Link href={`/transactions/payments/${order.orderId}`} className="text-blue-500 hover:underline">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="">
      <div className="mb-4 p-4 bg-gray-50 shadow-sm">
        {renderMetrics()}

        <div className="flex justify-between items-center mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Date</label>
            <DatePickerWithQuery />
          </div>

          <div className="flex gap-4 items-center">
            <Button onClick={handleDownloadExcel} disabled={loading} type="button">
              {loading ? "Downloading..." : "Download"}
            </Button>
            <OrderStatusFilterActions />
          </div>
        </div>
      </div>

      {renderOrdersTable()}
    </div>
  );
}

export default DayOrdersTable;
