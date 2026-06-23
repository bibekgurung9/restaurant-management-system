import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { categoryListUrl, itemListUrl } from "@/config/urls";
import Link from "next/link";
import ActionButton from "@/components/layout/ActionButton";
import { Item } from "@/typings";
import { Column, DataTable } from "@/components/layout/DataTable";
import CategoryFilter from "./_components/CategoryFilter";

export const metadata = {
  title: "Items",
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const categoryId = searchParams?.categoryId;
  const queryString = categoryId ? `categoryId=${categoryId}` : "";

  const res = await requests.get(
    `${itemListUrl}?${queryString}&${pageQuery(searchParams.page)}`
  );

  const { data: categories } = await requests.get(`${categoryListUrl}`);

  const columns: Column<Item>[] = [
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
          <img
            src={item.image}
            className="h-10 w-10 rounded-md object-cover"
            alt={item.name}
          />

          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {item.name}
            </span>

            <span className="text-xs text-muted-foreground">
              {item.unit}
            </span>
          </div>
        </div>
      ),
    },

    {
      key: "category",
      header: "Category",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.categoryName}
        </span>
      ),
    },

    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span className="font-medium">
          NPR {item.price}
        </span>
      ),
    },

    {
      key: "inventory",
      header: "Stock",
      render: (item) => {
        if (!item.isLimited || !item.inventory) {
          return (
            <span className="text-muted-foreground text-sm">
              Unlimited
            </span>
          );
        }

        return (
          <div className="flex flex-col text-sm">
            <span>
              Qty:{" "}
              <span className="font-medium">
                {item.inventory.quantity}
              </span>
            </span>

            <span className="text-muted-foreground text-xs">
              Threshold: {item.inventory.threshold}
            </span>
          </div>
        );
      },
    },

    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={
            item.available
              ? "text-green-600 font-medium"
              : "text-red-500 font-medium"
          }
        >
          {item.available ? "Available" : "Unavailable"}
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
      title="Items"
      subtitle="Manage your menu items"
      totalCount={res.meta?.totalItems}
      link={{
        href: "/menu/items/new",
        label: "Add New Item",
      }}
      actions={<CategoryFilter data={categories} />}
    >
      <DataTable
        data={res.data}
        columns={columns}
        emptyText="No items found"
      />
    </ListLayout>
  );
}