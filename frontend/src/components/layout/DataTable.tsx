import React from "react";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  data?: T[] | null;
  columns: Column<T>[];
  emptyText?: string;
};

export function DataTable<T>({
  data,
  columns,
  emptyText = "No data found",
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center text-sm text-muted-foreground py-12">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-muted/40 text-sm text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t hover:bg-muted/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-6 py-3 align-middle ${col.className ?? ""}`}
                >
                  {col.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}