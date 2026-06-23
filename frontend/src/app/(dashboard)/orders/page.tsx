import ListLayout from "@/components/layout/ListLayout";
import { orderListUrl } from "@/config/urls";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";

import Link from "next/link";
import ActionButton from "@/components/layout/ActionButton";
import { EyeIcon } from "lucide-react";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Order } from "@/typings";

export const metadata = {
  title: "Orders",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: orders, meta } = await requests.get(
    `${orderListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Order>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "order",
      header: "Order",
      render: (order) => (
        <span className="font-medium">
          #{order.id}
        </span>
      ),
    },

    {
      key: "table",
      header: "Table",
      render: (order) => (
        <span>
          {order.table?.name ?? "Walk-in"}
        </span>
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
          NPR {order.totalAmount}
        </span>
      ),
    },

    {
      key: "payment",
      header: "Payment",
      render: (order) => (
        <span className="text-muted-foreground">
          {order.paymentMode ?? "Unpaid"}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (order) => {
        const styles = {
          pending:
            "bg-yellow-100 text-yellow-700",
          completed:
            "bg-green-100 text-green-700",
          cancelled:
            "bg-red-100 text-red-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              styles[order.status as keyof typeof styles] ??
              "bg-muted text-muted-foreground"
            }`}
          >
            {order.status.toLocaleUpperCase()}
          </span>
        );
      },
    },

    {
      key: "actions",
      header: "Actions",
      render: (order) => (
        <Link href={`/orders/${order.id}`}>
          <ActionButton
            icon={<EyeIcon className="h-4 w-4" />}
          >
            View
          </ActionButton>
        </Link>
      ),
    },
  ];

  return (
    <ListLayout
      title="Orders"
      subtitle="Total Orders"
      totalCount={meta?.totalOrders ?? 0}
      link={{
        href: "/orders/new",
        label: "Add New Order",
      }}
    >
      <DataTable
        data={orders}
        columns={columns}
        emptyText="No orders found"
      />
    </ListLayout>
  );
}