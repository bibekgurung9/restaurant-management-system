import requests from "@/lib/requests";
import { dashboardOverviewUrl } from "@/config/urls";
import CancellationRateCard from "./_components/CancellationRateCard";
import TableOccupancyCard from "./_components/TableOccupancyCard";
import LowStockAlerts from "./_components/LowStocksAlert";
import MetricsGrid from "./_components/MetricsGrid";
import RevenueComparisonCard from "./_components/RevenueComparisionCard";
import TopSellersTable from "./_components/TopSellersTable";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { data: data } = await requests.get(dashboardOverviewUrl);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Metrics Row */}
        <MetricsGrid metrics={data.metrics} />

        {/* Two‑column layout for charts & tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column – Revenue comparison (spans 2 cols on large screens) */}
          <div className="lg:col-span-2">
            <RevenueComparisonCard data={data.revenueComparison} />
          </div>

          {/* Right column – Table occupancy & cancellation */}
          <div className="space-y-6">
            <TableOccupancyCard data={data.tableOccupancy} />
            <CancellationRateCard data={data.cancellationRate} />
          </div>
        </div>

        {/* Bottom row – Top sellers & low stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSellersTable items={data.topSellers} />
          <LowStockAlerts items={data.lowStocks} />
        </div>
      </div>
    </div>
  );
}