"use client";
import TableCard from '@/app/(dashboard)/tables/_components/TableCard'
import { Combo, FoodItem, Table } from '@/typings'
import React, { useState } from 'react'
import Screens from './_main'
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

const DialogPage = ({ tables, foodItems, combos }: {
  tables: Table[],
  foodItems: FoodItem[],
  combos: Combo[]
}) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTable(null);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
      {tables.map((table: Table) => (
        <Dialog
          key={table.id}
          open={selectedTable?.id === table.id}
          onOpenChange={handleDialogOpenChange}
        >
          {table.status === "occupied" ? (
            <div className="cursor-not-allowed opacity-60">
              <TableCard table={table} />
            </div>
          ) : (
            <DialogTrigger
              className="cursor-pointer"
              onClick={() => setSelectedTable(table)}
            >
              <TableCard table={table} />
            </DialogTrigger>
          )}
          {selectedTable?.id === table.id && (
            <Screens
              table={selectedTable}
              foodItems={foodItems}
              combos={combos}
              onClose={() => setSelectedTable(null)}
            />
          )}
        </Dialog>
      ))}
    </div>
  );
};

export default DialogPage;
