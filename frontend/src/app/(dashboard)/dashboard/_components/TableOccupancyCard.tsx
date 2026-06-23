import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table } from "lucide-react";

interface TableOccupancyProps {
  data: {
    totalTables: number;
    occupiedTables: number;
    freeTables: number;
    occupancyRate: number;
  };
}

export default function TableOccupancyCard({ data }: TableOccupancyProps) {
  const { totalTables, occupiedTables, freeTables, occupancyRate } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
        <Table className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{occupiedTables} / {totalTables}</div>
        <p className="text-xs text-muted-foreground">
          {freeTables} tables free
        </p>
        <Progress value={occupancyRate} className="mt-2" />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {occupancyRate}% occupied
        </p>
      </CardContent>
    </Card>
  );
}