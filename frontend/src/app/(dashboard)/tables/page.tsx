import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import TableForm from "./Form";
import { PencilIcon } from "lucide-react";
import ActionButton from "@/components/layout/ActionButton";
import { tableListUrl } from "@/config/urls";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Table } from "@/typings";

export const metadata = {
  title: "Tables Management",
};

export default async function TablePage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: tables, meta } = await requests.get(
    `${tableListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Table>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "name",
      header: "Table Name",
      render: (table) => (
        <div className="flex flex-col">
          <span className="font-medium">{table.name}</span>
          <span className="text-xs text-muted-foreground">
            {table.code}
          </span>
        </div>
      ),
    },

    {
      key: "capacity",
      header: "Capacity",
      render: (table) => (
        <span>{table.capacity} seats</span>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (table) => {
        const styles = {
          available:
            "bg-green-100 text-green-700",
          occupied:
            "bg-red-100 text-red-700",
          reserved:
            "bg-yellow-100 text-yellow-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${styles[table.status]}`}
          >
            {table.status.toUpperCase()}
          </span>
        );
      },
    },

    {
      key: "actions",
      header: "Actions",
      render: (table) => (
        <div className="flex items-center gap-2">
          <TableForm data={table}>
            <ActionButton>
              Edit
            </ActionButton>
          </TableForm>
        </div>
      ),
    },
  ];

  return (
    <ListLayout
      title="Tables"
      subtitle="Total Tables"
      totalCount={meta?.totalTables ?? 0}
      actions={<Actions />}
    >
      <DataTable
        data={tables}
        columns={columns}
        emptyText="No tables found"
      />
    </ListLayout>
  );
}

function Actions() {
  return (
    <TableForm>
      <ActionButton icon={<PencilIcon className="h-4 w-4" />}>
        Add New Table
      </ActionButton>
    </TableForm>
  );
}