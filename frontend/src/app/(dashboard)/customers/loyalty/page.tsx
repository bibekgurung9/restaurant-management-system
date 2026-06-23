import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { loyaltyListUrl } from "@/config/urls";

import LoyaltyForm from "./Form";
import ActionButton from "@/components/layout/ActionButton";
import { PencilIcon } from "lucide-react";
import { Column, DataTable } from "@/components/layout/DataTable";
import { LoyaltyProgram } from "@/typings";

export const metadata = {
  title: "Admin - Loyalty Programs",
};

export default async function Page({
  searchParams,
}: {
  searchParams: any;
}) {
  const { data: loyalty, meta } = await requests.get(
    `${loyaltyListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<LoyaltyProgram>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "name",
      header: "Program",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {item.name}
          </span>

          <span className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </span>
        </div>
      ),
    },

    {
      key: "discount",
      header: "Discount",
      render: (item) => (
        <span className="font-medium text-green-600">
          {item.discount}%
        </span>
      ),
    },

    {
      key: "conditions",
      header: "Conditions",
      render: (item) => (
        <div className="flex flex-col text-sm">
          <span>
            Orders: {item.totalOrdersRequired}
          </span>

          <span className="text-xs text-muted-foreground">
            Spend: NPR {item.totalAmountSpent}
          </span>
        </div>
      ),
    },

    {
      key: "validity",
      header: "Validity",
      render: (item) => (
        <div className="text-xs text-muted-foreground">
          <div>
            {new Date(item.validFrom).toLocaleDateString()}
          </div>
          <div>
            → {new Date(item.validTo).toLocaleDateString()}
          </div>
        </div>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (item) => {
        const styles = {
          available:
            "bg-green-100 text-green-700",
          inactive:
            "bg-gray-100 text-gray-600",
          expired:
            "bg-red-100 text-red-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${styles[item.status]}`}
          >
            {item.status}
          </span>
        );
      },
    },

    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        
        <LoyaltyForm loyaltyProgram={item}>
          <ActionButton
            icon={<PencilIcon className="h-4 w-4" />}
          >
            Edit
          </ActionButton>
        </LoyaltyForm>
      ),
    },
  ];

  return (
    <ListLayout
      title="Loyalty Programs"
      subtitle="Customer reward rules & discounts"
      totalCount={meta?.totalLoyaltyPrograms ?? 0}
      actions={<Actions />}
    >
      <DataTable
        data={loyalty}
        columns={columns}
        emptyText="No loyalty programs found"
      />
    </ListLayout>
  );
}

function Actions() {
  return (
    <LoyaltyForm>
      <ActionButton icon={<PencilIcon className="h-4 w-4" />}>
        Add Loyalty Program
      </ActionButton>
    </LoyaltyForm>
  );
}