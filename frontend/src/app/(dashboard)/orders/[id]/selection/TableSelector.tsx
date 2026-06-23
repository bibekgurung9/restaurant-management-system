import { Table } from "@/typings";

interface TableSelectorProps {
  selectedTable: number | null;
  setSelectedTable: (tableId: number) => void;
  availableTables: Table[];
  disabled: boolean;
}

function TableSelector({ selectedTable, setSelectedTable, availableTables, disabled }: TableSelectorProps) {

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="table" className="font-semibold">
        Select table<span className="text-primary"></span>
      </label>
      <select
        id="table"
        value={selectedTable || ""}
        onChange={(e) => setSelectedTable(Number(e.target.value))}
        className="p-2 border rounded"
        disabled={disabled}
      >
        <option value="">Select a table</option>
        {availableTables.map((table) => (
          <option key={table.id} value={table.id}>
            {table.name} (Capacity: {table.capacity})
          </option>
        ))}
      </select>
    </div>
  );
}

export default TableSelector;