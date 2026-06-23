import ActionButton from "@/components/layout/ActionButton";
import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import { lowStockListUrl } from "@/config/urls";
import requests from "@/lib/requests";
import { LowStockItem } from "@/typings";
import { pageQuery } from "@/utils/query-handler";
import Link from "next/link";

export const metadata = {
  title: "Low Stocks",
};

export default async function LowStockPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: inventory, meta } = await requests.get(
    `${lowStockListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<LowStockItem>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "item",
      header: "Item",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs font-medium">
              {item.name.charAt(0)}
            </div>
          )}

          <div>
            <div className="font-medium">{item.name}</div>
            {/* <div className="text-xs text-muted-foreground">
              {item.name}
            </div> */}
          </div>
        </div>
      ),
    },

    {
      key: "quantity",
      header: "Current Stock",
      render: (item) => (
        <span className="font-medium text-red-500">
          {item.inventory.quantity}
        </span>
      ),
    },

    {
      key: "threshold",
      header: "Threshold",
      render: (item) => item.inventory.threshold,
    },

    {
      key: "difference",
      header: "Needed",
      render: (item) => (
        <span className="font-medium">
          {Math.max(
            item.inventory.threshold - item.inventory.quantity,
            0
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-3">
          <Link href={`/menu/items/${item.id}`}>
            <ActionButton>
              Edit
            </ActionButton>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <ListLayout
      title="Low Stocks"
      subtitle="Total Inventory Low Stocks"
      totalCount={meta?.totalItems ?? 0}
    >
      <DataTable
        data={inventory}
        columns={columns}
        emptyText="No low stock items found"
      />
    </ListLayout>
  );
}