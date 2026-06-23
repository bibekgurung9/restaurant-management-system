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
  title: "Admin - Pending Orders",
  description: "View all orders placed by customers.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: orders } = await requests.get(
    `${orderListUrl}?${pageQuery(searchParams.page)}`
  );

  const pendingOrders = orders?.filter(
    (order: Order) => order.status === "pending"
  );

  const columns: Column<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-medium">
            #{order.id}
          </span>

          <span className="text-xs text-muted-foreground">
            {order.table.name}
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
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Pending
        </span>
      ),
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
      title="Pending Orders"
      subtitle="Orders awaiting processing"
      totalCount={pendingOrders?.length ?? 0}
    >
      <DataTable
        data={pendingOrders}
        columns={columns}
        emptyText="No pending orders found"
      />
    </ListLayout>
  );
}