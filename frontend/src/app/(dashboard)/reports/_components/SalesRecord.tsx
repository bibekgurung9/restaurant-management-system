"use client";
import { useState, useEffect } from "react";
import { showToast } from "@/lib/requests/showToast";

import Link from "next/link";

import { downloadCompletedOrdersExcel } from "@/utils/downloadCompleteOrderExcel";
import MetricCard from "@/components/global/MetricCard";
import DataPreview from "@/app/(dashboard)/reports/_components/DataPreview";

import { formatDate } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { getOrderBadgeVariant } from "@/utils/badgeVariants";
import { Button } from "@/components/ui/button";
import DatePickerWithQuery from "@/components/search/DatePicker";

function SalesRecordTable({ ordersData, metricsData }: { ordersData?: any[]; metricsData?: any }) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(metricsData?.metricDate || null);

  useEffect(() => {
    if (metricsData?.metricDate) {
      setSelectedDate(metricsData.metricDate);
    }
  }, [metricsData]);

  const handleDownloadExcel = async () => {
    setLoading(true);

    try {
      const dateToDownload = metricsData?.metricDate;
      if (!dateToDownload) {
        throw new Error("Metric date is not available");
      }
      await downloadCompletedOrdersExcel(dateToDownload);
    } catch (error) {
      showToast({ message: "Data not found!", status: false, data: undefined });
    } finally {
      setLoading(false);
    }
  };

  const renderMetrics = () => {
    if (!metricsData) {
      return (
        <div className="grid grid-cols-3 gap-4 mb-4 cursor-default">
          <MetricCard title="Total Orders" number={0} />
          <MetricCard title="Total Sales (Excluding Credit)" number="Rs. 0.00" />
          <MetricCard title="Selected Date" number="N/A" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-4 mb-4 cursor-default">
        <MetricCard title="Total Orders" number={metricsData.totalOrders || 0} />
        <MetricCard title="Total Sales" number={`Rs. ${metricsData.totalAmount || "0.00"}`} />
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
      <div>
        <div className="overflow-x-auto border border-secondary rounded-lg shadow-sm">
          <table className="w-full text-center text-sm border-collapse">
            <thead className="text-gray-700 font-medium">
              <tr className="bg-secondary">
                <th className="px-4 py-3">S. No</th>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Payment Mode</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Guests</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.map((record, i) => (
                <tr key={i} className="bg-white border-b hover:bg-gray-100">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-6 py-3">{record.id}</td>
                  <td className="px-6 py-3">{record.paymentMode}</td>
                  <td className="px-6 py-3">
                    <Badge variant={getOrderBadgeVariant(record.status)} className="capitalize">{record.status}</Badge>
                  </td>
                  <td className="px-6 py-3">{record.guests}</td>
                  <td className="px-6 py-3">{record.totalAmount}</td>
                  <td className="px-6 py-3">
                    <Link href={`/transactions/payments/${record.id}`} className="text-blue-500 hover:underline">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {ordersData && metricsData && selectedDate && (
              <>
                <DataPreview date={selectedDate} />
                <Button onClick={handleDownloadExcel} disabled={loading} type="button">
                  {loading ? "Downloading..." : "Download"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {renderOrdersTable()}
    </div>
  );
}

export default SalesRecordTable;
