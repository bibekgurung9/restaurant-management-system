import { RequestHandler } from "@/lib/requests/methods";
import * as XLSX from "xlsx";
import { formatDate, formatTime } from "@/lib/format-date";
import { showToast } from "@/lib/requests/showToast";

// Helper function to normalize payment method keys to lowercase
const normalizePaymentMethod = (method: string) => {
  return method.toLowerCase();
};

export const downloadCompletedOrdersExcel = async (date: string) => {
  const requests = await RequestHandler();

  try {
    const res = await requests.post(`/admin/sales/all-records`, {
      body: JSON.stringify({ date }),
    });

    if (res?.status && res?.data) {
      const ordersData = res.data.records || [];
      const metricsData = res.data.metrics || {};

      if (!ordersData.length) {
        showToast({ message: "No data available for the selected date.", status: false, data: undefined });
        return;
      }

      // Prepare data for Excel export (Orders data)
      const dataToExport = ordersData.map((order: any) => ({
        "Order ID": order.id,
        "Table Name": order.table || "N/A",
        "Total Amount": order.totalAmount || "N/A",
        "Guests": order.guests || "N/A",
        "Payment Method": order.paymentDetails.paymentMethod || "N/A",
        "Payment Status": order.paymentDetails.paymentStatus || "N/A",
        "Paid Amount": order.paymentDetails.paidAmount || "N/A",
        "VAT Amount": order.paymentDetails.vatAmount || "N/A",
        "Service Charge Amount": order.paymentDetails.serviceChargeAmount || "N/A",
        "Discount Amount": order.paymentDetails.discountAmount || "N/A",
        "Remaining Amount": order.paymentDetails.remainingAmount || "N/A",
        "Currency": order.paymentDetails.currency || "N/A",
        "Created At": formatTime(order.createdAt) || "N/A",
      }));

      // Prepare summary data for metrics (Sales Data)
      const summaryData = [
        { "Summary": "Total Orders", "Count": metricsData.totalOrders || 0 },
        { "Summary": "Total Sales", "Amount": `NPR. ${metricsData.totalSales || 0}` },
        { "Summary": "Total Discount Amount", "Amount": `NPR. ${metricsData.totalDiscount || 0}` },
        { "Summary": "Total Service Charge", "Amount": `NPR. ${metricsData.totalServiceCharge || 0}` },
        { "Summary": "Total VAT Amount", "Amount": `NPR. ${metricsData.totalVAT || 0}` },
        { "Summary": "Total Credit Payments", "Amount": `NPR. ${metricsData.totalCreditPayments || 0}` },
        { "Summary": "Opening Balance", "Amount": `NPR. ${metricsData.openingBalance || 0}` },
        { "Summary": "Closing Balance", "Amount": `NPR. ${metricsData.closingBalance || 0}` },
        { "Summary": "Total Tips", "Amount": `NPR. ${metricsData.totalTips || 0}` },
      ];

      // Normalize payment method keys and include breakdown
      const paymentMethodStats = metricsData.paymentMethodStats || {};
      const normalizedStats: { [key: string]: string } = {};

      // Normalize each payment method and prepare the formatted string
      for (let method in paymentMethodStats) {
        const normalizedMethod = normalizePaymentMethod(method);
        normalizedStats[normalizedMethod] = `NPR. ${paymentMethodStats[method] || 0}`;
      }

      // Add normalized payment method stats to summary
      const paymentMethodSummary = Object.keys(normalizedStats).map(method => ({
        "Summary": `Total ${method.charAt(0).toUpperCase() + method.slice(1)} Payments`,
        "Amount": normalizedStats[method],
      }));

      // Combine summary data and normalized payment method breakdown
      const fullSummaryData = [...summaryData, ...paymentMethodSummary];

      // Create a new Excel workbook
      const wb = XLSX.utils.book_new();

      // Create sheet for orders data
      const wsOrders = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

      // Create sheet for summary metrics data
      const wsSummary = XLSX.utils.json_to_sheet(fullSummaryData, { skipHeader: true });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary Metrics");

      // Generate the Excel file and prompt for download
      XLSX.writeFile(wb, `completed_orders_${formatDate(date)}.xlsx`);

      showToast({ message: "Sales Report downloaded successfully.", status: true, data: null });
    } else {
      showToast({ message: "No data available for the selected date.", status: false, data: undefined });
    }
  } catch (error) {
    console.error("Error downloading Excel:", error);
    showToast({ message: "Error downloading Excel file.", status: false, data: undefined });
  }
};
