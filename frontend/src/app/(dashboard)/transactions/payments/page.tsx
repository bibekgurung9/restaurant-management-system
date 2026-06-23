import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import { paymentListUrl } from "@/config/urls";
import requests from "@/lib/requests";
import { Payment } from "@/typings";
import { pageQuery } from "@/utils/query-handler";

export const metadata = {
  title: "Admin - Payment History",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: payments, meta } = await requests.get(
    `${paymentListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Payment>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "order",
      header: "Order",
      render: (payment) => (
        <span className="font-medium">
          #{payment.orderId}
        </span>
      ),
    },

    {
      key: "customer",
      header: "Customer",
      render: (payment) => (
        <span className="text-muted-foreground">
          #{payment.customerId}
        </span>
      ),
    },

    {
      key: "amount",
      header: "Amount",
      render: (payment) => (
        <span className="font-medium">
          NPR {payment.paidAmount.toFixed(2)}
        </span>
      ),
    },

    {
      key: "method",
      header: "Method",
      render: (payment) => (
        <span>{payment.paymentMethod}</span>
      ),
    },

    {
      key: "reference",
      header: "Reference",
      render: (payment) => (
        <span className="text-muted-foreground">
          {payment.paymentReference ?? "-"}
        </span>
      ),
    },

    {
      key: "date",
      header: "Date",
      render: (payment) => (
        <span className="text-sm">
          {new Date(payment.paymentDate).toLocaleDateString()}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (payment) => {
        const styles = {
          completed: "bg-green-100 text-green-700",
          pending: "bg-yellow-100 text-yellow-700",
          failed: "bg-red-100 text-red-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${styles[
              payment.paymentStatus as keyof typeof styles
            ] ?? "bg-muted text-muted-foreground"
              }`}
          >
            {payment.paymentStatus}
          </span>
        );
      },
    },
  ];

  return (
    <ListLayout
      title="Payment History"
      subtitle="Total Payments"
      totalCount={meta?.totalPayments ?? 0}
    >
      <DataTable
        data={payments}
        columns={columns}
        emptyText="No payments found"
      />
    </ListLayout>
  );
}