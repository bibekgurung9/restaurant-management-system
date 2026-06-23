import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";

import Link from "next/link";
import ActionButton from "@/components/layout/ActionButton";
import { EyeIcon } from "lucide-react";
import { inventoryListUrl } from "@/config/urls";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Stock } from "@/typings";

export const metadata = {
  title: "Stock",
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: stocks, meta } = await requests.get(
    `${inventoryListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Stock>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "item",
      header: "Item",
      render: (stock) => (
        <div className="flex items-center gap-3">
          {stock.image ? (
            <img
              src={stock.image}
              alt={stock.itemName}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
              {stock.itemName.charAt(0)}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-medium">
              {stock.itemName}
            </span>

            <span className="text-xs text-muted-foreground">
              NPR {stock.price}
            </span>
          </div>
        </div>
      ),
    },


    {
      key: "stock",
      header: "Stock",
      render: (stock) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {stock.quantity} {stock.unit}
          </span>

          <span className="text-xs text-muted-foreground">
            Min: {stock.threshold}
          </span>
        </div>
      ),
    },


    {
      key: "status",
      header: "Status",
      render: (stock) => {
        const styles = {
          in_stock:
            "bg-green-100 text-green-700",

          low_stock:
            "bg-yellow-100 text-yellow-700",

          out_of_stock:
            "bg-red-100 text-red-700",
        };


        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              styles[stock.status]
            }`}
          >
            {stock.status.replace("_", " ")}
          </span>
        );
      },
    },


    {
      key: "actions",
      header: "Actions",
      render: (stock) => (
        <Link href={`/menu/items/${stock.itemId}`}>
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
      title="Stock"
      subtitle="Inventory Overview"
      totalCount={meta?.totalItems ?? 0}
    >
      <DataTable
        data={stocks}
        columns={columns}
        emptyText="No stock records found"
      />
    </ListLayout>
  );
}