import { formatDate, formatTime } from "@/lib/format-date";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import * as XLSX from "xlsx";

export const downloadDayOrdersExcel = async (date: string) => {
  const requests = await RequestHandler();

  try {
    const res = await requests.post(`/admin/billing/all-records`, {
      body: JSON.stringify({ date }),
    });

    // Check if response and data are valid
    if (res?.status && res?.data) {
      const ordersData = res.data.orders || [];
      const metricsData = res.data.metrics || {};

      if (!ordersData.length) {
        showToast({ message: "No data available for the selected date.", status: false, data: undefined });
        return;
      }

      // Prepare data for Excel export
      const dataToExport = ordersData.map((order: any) =>
        order.orderItems.map((item: any) => ({
          "Order ID": order.orderId,
          "Status": order.status,
          "Table Name": order.table?.name || "N/A",
          "Item Name": item.itemName || "N/A",
          "Combo Name": item.comboName || "N/A",
          "Quantity": item.quantity,
          "Price": item.price,
          "Total Price": item.totalPrice,
          "Created At": formatTime(order.createdAt),
          "Total Amount": order.totalAmount,
        }))
      ).flat();

      // Calculate the total number of orders and total amount
      const totalOrders = ordersData.length;
      const totalAmount = ordersData.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0).toFixed(2);

      // Use metricsData.metricDate or fallback to the provided date
      const fileDate = metricsData.metricDate || date;

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");

      // Prepare summary data to append at the end of the Orders sheet
      const summaryData = [
        { "Summary": "Total Orders", "Count": totalOrders },
        { "Summary": "Total Amount", "Amount": `NPR. ${totalAmount}` },
      ];

      // Add the summary data at the end of the Orders sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });

      // Append the summary data below the last row of the Orders sheet
      const ordersSheet = wb.Sheets["Orders"];
      const ordersRange = XLSX.utils.decode_range(ordersSheet["!ref"] as string);
      ordersRange.e.r += 2; // Skip a row for padding
      ordersSheet["!ref"] = XLSX.utils.encode_range(ordersRange);
      XLSX.utils.sheet_add_json(ordersSheet, summaryData, { header: [], skipHeader: true, origin: -1 });

      // Write the file
      XLSX.writeFile(wb, `orders_${formatDate(fileDate)}.xlsx`);

      showToast({ message: "Excel file downloaded successfully.", status: true, data: null });
    } else {
      showToast({ message: "No data available for the selected date.", status: false, data: undefined });
    }
  } catch (error) {
    console.error("Error downloading Excel:", error);
    showToast({ message: "Error downloading Excel file.", status: false, data: undefined });
  }
};
