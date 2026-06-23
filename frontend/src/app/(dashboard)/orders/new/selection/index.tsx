import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ItemsColumn from "./ItemsColumn";
import ItemsSelection from "./ItemsSelection";
import { Combo, FoodItem, OrderItem, Table } from "@/typings";

function Selection({
  foodItems,
  combos,
  table,
  selectedItems,
  setSelectedItems,
  onClose,
}: {
  foodItems: FoodItem[];
  combos: Combo[];
  table: Table;
  selectedItems: OrderItem[];
  setSelectedItems: any;
  onClose: () => void;
}) {

  return (
    <>
      <Tabs defaultValue="food-items" className="h-full w-full flex flex-col">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="food-items">Food Items</TabsTrigger>
            <TabsTrigger value="combos">Combos</TabsTrigger>
          </TabsList>
        </div>

        <Separator className="my-5 bg-primary" />

        <div className="flex flex-grow overflow-hidden"> 
          <TabsContent
            value="food-items"
            className="flex-1 overflow-y-auto"  
          >
            <ItemsSelection
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              data={foodItems}
              type="food" 
            />
          </TabsContent>
          <TabsContent
            value="combos"
            className="flex-1 overflow-y-auto"  
          >
            <ItemsSelection
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              data={combos}
              type="combo" // Pass type as 'combo'
            />
          </TabsContent>
        </div>
      </Tabs>

      <div className="w-2/6 h-full pt-8">
        <ItemsColumn
          table={table}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onClose={onClose}
        />
      </div>
    </>
  );
}

export default Selection;
