import ActionButton from "@/components/layout/ActionButton";
import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import { getCancelledSalesUrl } from "@/config/urls";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import Link from "next/link";

export const metadata = {
  title: "Cancelled Orders",
};

interface CancelledOrder {
  id: number;
  table: {
    name: string;
  };
  totalAmount: number;
  paymentMode: string | null;
  status: "cancelled";
  guests: number;
  createdAt: string;
}

export default async function CancelledOrdersPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {

  const { data: cancels, meta } = await requests.get(
    `${getCancelledSalesUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<CancelledOrder>[] = [

    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },


    {
      key: "order",
      header: "Order",
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-medium">
            #{order.id}
          </span>

          <span className="text-xs text-muted-foreground">
            {order.table?.name ?? "No Table"}
          </span>
        </div>
      ),
    },


    {
      key: "guests",
      header: "Guests",
      render: (order) => order.guests,
    },


    {
      key: "amount",
      header: "Amount",
      render: (order) => (
        <span className="font-medium">
          Rs. {order.totalAmount.toFixed(2)}
        </span>
      ),
    },


    {
      key: "payment",
      header: "Payment",
      render: (order) => (
        <span className="text-muted-foreground capitalize">
          {order.paymentMode ?? "Unpaid"}
        </span>
      ),
    },


    {
      key: "date",
      header: "Cancelled At",
      render: (order) => (
        <span className="text-sm text-muted-foreground">
          {new Date(
            order.createdAt
          ).toLocaleString()}
        </span>
      ),
    },


    {
      key: "status",
      header: "Status",
      render: () => (
        <span className="
          px-2 py-1
          rounded-full
          text-xs
          font-medium
          bg-red-100
          text-red-700
        ">
          Cancelled
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (order) => (
        <Link href={`/orders/${order.id}`}>
          <ActionButton>
            View
          </ActionButton>
        </Link>
      ),
    },

  ];


  return (
    <ListLayout
      title="Cancelled Orders"
      subtitle="Cancelled Order History"
      totalCount={meta?.totalCancelledOrders ?? 0}
    >

      <DataTable
        data={cancels}
        columns={columns}
        emptyText="No cancelled orders found"
      />

    </ListLayout>
  );
}