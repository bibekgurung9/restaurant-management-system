import { RequestHandler } from "@/lib/requests/methods";
import { formatTime } from "@/lib/format-date";

// Helper function to normalize payment method keys to lowercase
const normalizePaymentMethod = (method: string) => {
  return method.toLowerCase();
};

export const fetchCompletedOrdersData = async (date: string) => {
  const requests = await RequestHandler();

  try {
    const res = await requests.post(`/admin/sales/all-records`, {
      body: JSON.stringify({ date }),
    });
    if (res?.status && res?.data) {
      const ordersData = res.data.records || [];
      const metricsData = res.data.metrics || {};

      if (!ordersData.length) {
        return { message: "No data available for the selected date.", status: false };
      }

      // Prepare data for orders
      const formattedOrders = ordersData.map((order: any) => ({
        id: order.id,
        table: order.table || "N/A",
        totalAmount: order.totalAmount || "N/A",
        guests: order.guests || "N/A",
        paymentMethod: order.paymentDetails.paymentMethod || "N/A",
        paymentStatus: order.paymentDetails.paymentStatus || "N/A",
        paidAmount: order.paymentDetails.paidAmount || "N/A",
        vatAmount: order.paymentDetails.vatAmount || "N/A",
        serviceChargeAmount: order.paymentDetails.serviceChargeAmount || "N/A",
        discountAmount: order.paymentDetails.discountAmount || "N/A",
        remainingAmount: order.paymentDetails.remainingAmount || "N/A",
        currency: order.paymentDetails.currency || "N/A",
        createdAt: formatTime(order.createdAt),
      }));

      // Prepare metrics data for summary
      const summaryData = {
        totalOrders: metricsData.totalOrders || 0,
        totalSales: metricsData.totalSales || 0,
        totalDiscount: metricsData.totalDiscount || 0,
        totalServiceCharge: metricsData.totalServiceCharge || 0,
        totalVAT: metricsData.totalVAT || 0,
        totalTips: metricsData.totalTips || 0,
        openingBalance: metricsData.openingBalance || 0,
        closingBalance: metricsData.closingBalance || 0,
      };

      // Normalize payment method stats and include breakdown
      const paymentMethodStats = metricsData.paymentMethodStats || {};
      const normalizedStats: { [key: string]: string } = {};

      // Normalize each payment method and prepare the formatted string
      for (let method in paymentMethodStats) {
        const normalizedMethod = normalizePaymentMethod(method);
        normalizedStats[normalizedMethod] = `NPR. ${paymentMethodStats[method] || 0}`;
      }

      // Add normalized payment method stats to the summary
      const paymentMethodSummary = Object.keys(normalizedStats).map(method => ({
        [`Total ${method.charAt(0).toUpperCase() + method.slice(1)} Payments`]: normalizedStats[method],
      }));

      // Merge the normalized payment method summary with the existing summary data
      const fullSummaryData = { ...summaryData, paymentMethodStats: paymentMethodSummary };

      return { status: true, data: { orders: formattedOrders, metrics: fullSummaryData } };
    } else {
      return { message: "No data available for the selected date.", status: false };
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return { message: "Error fetching data.", status: false };
  }
};
