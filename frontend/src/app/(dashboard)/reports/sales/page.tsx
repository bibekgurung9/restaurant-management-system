import MetricCard from "@/components/global/MetricCard";
import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import { getDailySalesUrl } from "@/config/urls";
import { formatPrice } from "@/lib/format-price";
import requests from "@/lib/requests";
import { SaleRecord } from "@/typings";
import { pageQuery } from "@/utils/query-handler";

export const metadata = {
  title: "Sales",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string };
}) {

  const { data: sales, meta } = await requests.get(
    `${getDailySalesUrl}?${pageQuery(searchParams.page)}`
  );


  const columns: Column<SaleRecord>[] = [

    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },


    {
      key: "order",
      header: "Order",
      render: (sale) => (
        <div className="flex flex-col">
          <span className="font-medium">
            #{sale.id}
          </span>

          <span className="text-xs text-muted-foreground">
            {sale.table}
          </span>
        </div>
      ),
    },


    {
      key: "guests",
      header: "Guests",
      render: (sale) => sale.guests,
    },


    {
      key: "amount",
      header: "Amount",
      render: (sale) => (
        <span className="font-medium">
          {formatPrice(Number(sales.totalAmount) || 0)}
        </span>
      ),
    },

    {
      key: "payment",
      header: "Payment",
      render: (sale) => (
        <span className="capitalize text-muted-foreground">
          {
            sale.paymentDetails?.paymentMethod ??
            "Unknown"
          }
        </span>
      ),
    },


    {
      key: "date",
      header: "Date",
      render: (sale) => (
        <span className="text-sm text-muted-foreground">
          {new Date(
            sale.createdAt
          ).toLocaleString()}
        </span>
      ),
    },

  ];


  return (
    <ListLayout
      title="Sales Overview"
      subtitle="Sales History"
      totalCount={sales.metrics.totalOrders}
    >

      <div className="space-y-4">


        {/* Metrics */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <MetricCard
            title="Total Orders"
            number={sales.metrics.totalOrders}
          />

          <MetricCard
            title="Total Sales (Excluding Credit)"
            number={formatPrice(Number(sales.metrics.totalSales) || 0)}
          />

          <MetricCard
            title="Closing Balance"
            number={formatPrice(Number(sales.metrics.closingBalance) || 0)}
          />

        </div>
        <DataTable
          data={sales.records}
          columns={columns}
          emptyText="No sales found"
        />

      </div>

    </ListLayout>
  );
}