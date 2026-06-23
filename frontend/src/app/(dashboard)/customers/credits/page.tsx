import ListLayout from "@/components/layout/ListLayout";
import { getCustomersCreditUrls } from "@/config/urls";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";

import Link from "next/link";
import ActionButton from "@/components/layout/ActionButton";
import { EyeIcon } from "lucide-react";
import { Column, DataTable } from "@/components/layout/DataTable";
import { CustomerCredit } from "@/typings";

export const metadata = {
  title: "Admin - Customer Credit",
  description: "Customer credit records.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const res = await requests.get(
    `${getCustomersCreditUrls}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<CustomerCredit>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "customer",
      header: "Customer",
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {customer.name}
          </span>

          <span className="text-xs text-muted-foreground">
            ID #{customer.id}
          </span>
        </div>
      ),
    },

    {
      key: "credit",
      header: "Credit Summary",
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">
            Available: NPR {customer.availableCredit}
          </span>

          <span
            className={
              customer.currentCredit > 0
                ? "text-red-500 text-xs"
                : "text-green-600 text-xs"
            }
          >
            Outstanding: NPR {customer.currentCredit}
          </span>
        </div>
      ),
    },

    {
      key: "updated",
      header: "Last Updated",
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {new Date(
            customer.updatedAt
          ).toLocaleDateString()}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (customer) => (
        <Link href={`/customerss/${customer.id}`}>
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
      title="Customer Credit History"
      subtitle="Customer Credit Overview"
      totalCount={res.meta?.totalCustomers ?? 0}
      link={{
        href: "/customers",
        label: "Manage Customers",
      }}
    >
      <DataTable
        data={res.data}
        columns={columns}
        emptyText="No credit records found"
      />
    </ListLayout>
  );
}