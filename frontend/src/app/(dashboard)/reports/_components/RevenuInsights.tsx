"use client"
import React, { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { SubmitButton } from "@/components/ui/submit-button";
import { RequestHandler } from "@/lib/requests/methods";
import { Card } from "../../../../components/ui/card";
import { getRevenueInsightsUrl } from "@/config/urls";

function RevenueInsightsForm() {
  const [fromDate, setFromDate] = useState<any>(new Date());
  const [toDate, setToDate] = useState<any>(new Date());
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const requests = await RequestHandler();
      const formattedFromDate = format(fromDate, "yyyy-MM-dd");
      const formattedToDate = format(toDate, "yyyy-MM-dd");

      const requestPayload = {
        startDate: formattedFromDate,
        endDate: formattedToDate,
        timePeriod: "monthly",
      };

      const res = await requests.post(getRevenueInsightsUrl, {
        body: JSON.stringify(requestPayload),
      });

      console.log("RES", res.data)

      if (res.status === true) {
        setRevenueData(res.data.revenueReport);
        setStartDate(res.data.startDate);
        setEndDate(res.data.endDate);
      } else {
        setRevenueData([]);
      }
    } catch (error) {
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-3xl mx-auto shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">Revenue Insights</h2>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1/2">
            <span className="text-gray-700">From Date</span>
            <DatePicker date={fromDate} setDate={setFromDate} />
          </div>
          <div className="w-1/2">
            <span className="text-gray-700">To Date</span>
            <DatePicker date={toDate} setDate={setToDate} />
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <SubmitButton
            pendingText="Fetching Revenue..."
            className="bg-primary text-white text-base px-6 py-2 rounded-md shadow-md"
            onClick={fetchRevenueData}
          >
            Fetch Revenue
          </SubmitButton>
        </div>
      </div>
      <div className="mt-6">
        {loading ? (
          <p className="text-center text-gray-600 mt-4">Loading data...</p>
        ) : revenueData.length > 0 ? (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2" colSpan={4}>
                    Revenue Insights for [{startDate} to {endDate}]
                  </th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Date</th>
                  <th className="border border-gray-300 px-4 py-2">Sales</th>
                  <th className="border border-gray-300 px-4 py-2">True Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((item, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {item.date}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {Number(item.totalRevenue).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {Number(item.trueRevenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-600 mt-4">No data available for the selected range.</p>
        )}
      </div>
    </Card>
  );
}

export default RevenueInsightsForm;
