import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { PencilIcon } from "lucide-react";
import CustomerForm from "./Form";
import ActionButton from "@/components/layout/ActionButton";
import { customerListUrl } from "@/config/urls";

import Link from "next/link";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Customer } from "@/typings";

export const metadata = {
  title: "Admin - Customers",
};

export default async function CustomerPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: customers, meta } = await requests.get(
    `${customerListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Customer>[] = [
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
          <span className="font-medium">{customer.name}</span>

          <span className="text-xs text-muted-foreground">
            {customer.phone}
          </span>
        </div>
      ),
    },

    {
      key: "email",
      header: "Email",
      render: (customer) => (
        <span className="text-muted-foreground">
          {customer.email}
        </span>
      ),
    },

    {
      key: "credit",
      header: "Credit",
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">
            NPR {customer.currentCredit}
          </span>

          <span className="text-xs text-muted-foreground">
            Available: NPR {customer.availableCredit}
          </span>
        </div>
      ),
    },

    {
      key: "orders",
      header: "Orders",
      render: (customer) => (
        <div className="flex flex-col">
          <span>{customer.totalOrders}</span>

          <span className="text-xs text-muted-foreground">
            NPR {customer.totalOrderAmount}
          </span>
        </div>
      ),
    },

    {
      key: "joined",
      header: "Joined",
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {new Date(customer.createdAt ? customer.createdAt : "None").toLocaleDateString()}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (customer) => (
        <Link href={`/customers/${customer.id}`}>
          <ActionButton icon={<PencilIcon className="h-4 w-4" />}>
            View
          </ActionButton>
        </Link>
      ),
    },
  ];

  return (
    <ListLayout
      title="Customer Management"
      subtitle="Total Registered Customers"
      totalCount={meta?.totalCustomers ?? 0}
      actions={<Actions />}
    >
      <DataTable
        data={customers}
        columns={columns}
        emptyText="No customers found"
      />
    </ListLayout>
  );
}

function Actions() {
  return (
    <CustomerForm>
      <ActionButton icon={<PencilIcon className="h-4 w-4" />}>
        Add Customer
      </ActionButton>
    </CustomerForm>
  );
}