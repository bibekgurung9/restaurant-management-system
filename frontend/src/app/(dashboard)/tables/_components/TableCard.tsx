"use client";
import { cn } from "@/lib/utils";
import { Table } from "@/typings";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { showToast } from "@/lib/requests/showToast";
import { HandPlatter } from "lucide-react";

function TableCard({
  table,
}: {
  table: Table;
}) {
  const handleClick = () => {
    if (table.status === "occupied") {
      showToast({
        message: `Table is already occupied.`,
        status: false,
        data: table.name
      });
    }
  };

  return (
    <div
      className={cn(
        table.status === "available"
          ? "bg-green-50"
          : table.status === "reserved"
            ? "bg-yellow-50"
            : "bg-red-50",
        "relative border flex flex-col justify-between h-fit w-full md:max-w-72 shadow-lg rounded-md"
      )}
      // Disable click for occupied tables
      onClick={handleClick}
      style={{
        cursor: table.status === "occupied" ? "not-allowed" : "pointer",
      }}
    >
      {/* Table Details */}
      <div className="flex flex-col items-center h-full w-full p-3">
        <HandPlatter className="h-14 w-14" />
        <span>{table.name}</span>
        <div
          className={cn(
            table.status === "available"
              ? "text-green-700 bg-green-200"
              : table.status === "reserved"
                ? "text-yellow-700 bg-yellow-200"
                : "text-red-700 bg-red-200",
            "flex justify-between mt-2 py-2 px-2 w-full text-sm font-medium rounded-sm"
          )}
        >
          <div className="flex gap-1 items-center">
            <UserGroupIcon className="h-5 w-5" />
            <span>{table.capacity}</span>
          </div>
          <span>{table.code}</span>
        </div>
      </div>
    </div>
  );
}

export default TableCard;
