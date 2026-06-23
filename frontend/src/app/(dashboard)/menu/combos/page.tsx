import ListLayout from "@/components/layout/ListLayout";
import { comboListUrl } from "@/config/urls";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import Link from "next/link";
import ActionButton from "@/components/layout/ActionButton";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Combo } from "@/typings";

export const metadata = {
  title: "Combos",
};

export default async function ComboPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const combosResponse = await requests.get(
    `${comboListUrl}?${pageQuery(searchParams.page)}`
  );

  const { data: combos, meta } = combosResponse;

  console.log("COMBOS", combos)

  const columns: Column<Combo>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "name",
      header: "Combo",
      render: (combo) => (
        <div className="flex items-center gap-3">
          {combo.image ? (
            <img
              src={combo.image}
              className="h-10 w-10 rounded-md object-cover"
              alt={combo.name}
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs font-medium">
              {combo.name.charAt(0)}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-medium">{combo.name}</span>

            <span className="text-xs text-muted-foreground line-clamp-1">
              {combo.description}
            </span>
          </div>
        </div>
      ),
    },

    {
      key: "price",
      header: "Price",
      render: (combo) => (
        <span className="font-medium">
          NPR {combo.price}
        </span>
      ),
    },

    {
      key: "items",
      header: "Items",
      render: (combo) => (
        <span className="text-muted-foreground">
          {combo.items?.length ?? 0} items
        </span>
      ),
    },

    {
      key: "expirable",
      header: "Validity",
      render: (combo) =>
        combo.expirable ? (
          <div className="text-xs text-muted-foreground">
            <div>
              {new Date(combo.dateFrom).toLocaleDateString()}
            </div>
            <div>
              → {new Date(combo.dateTo).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            Permanent
          </span>
        ),
    },

    {
      key: "status",
      header: "Status",
      render: (combo) => (
        <span
          className={
            combo.available
              ? "text-green-600 font-medium"
              : "text-red-500 font-medium"
          }
        >
          {combo.available ? "Available" : "Unavailable"}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (combo) => (
        <div className="flex items-center gap-3">
          <Link href={`/menu/combos/${combo.id}`}>
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
      title="Combo List"
      subtitle="Manage item bundles and offers"
      totalCount={meta?.totalCombos}
      link={{
        href: "/menu/combos/new",
        label: "Add New Combo",
      }}
    >
      <DataTable
        data={combos}
        columns={columns}
        emptyText="No combos found"
      />
    </ListLayout>
  );
}