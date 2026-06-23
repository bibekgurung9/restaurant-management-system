"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combo, FoodItem } from "@/typings";
import ImagePicker from "@/components/global/ImagePicker";
import MultipleSelector from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { SubmitButton } from "@/components/ui/submit-button";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { ArrowLeft, ArrowRight, Calendar, Package, Tag, List, DollarSign, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { addComboUrl, updateComboUrl } from "@/config/urls";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function ComboForm({
  options = [],
  combo,
}: {
  options: FoodItem[];
  combo?: Combo;
}) {
  const { push, back } = useRouter();
  const [image, setImage] = useState(combo ? combo.image : "");
  const [isLimited, setIsLimited] = useState(combo ? combo.expirable : false);
  const [items, setItems] = useState<any[]>(combo ? combo.items?.map((i) => i.id) : []);
  const [quantities, setQuantities] = useState<any[]>(combo ? combo.items?.map((i) => i.quantity) : []);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const [fromDate, setFromDate] = useState<any>(combo?.dateFrom ? format(new Date(combo.dateFrom), "yyyy-MM-dd") : null);
  const [toDate, setToDate] = useState<any>(combo?.dateTo ? format(new Date(combo.dateTo), "yyyy-MM-dd") : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (combo) {
      if (!combo.dateFrom) setFromDate(null);
      if (!combo.dateTo) setToDate(null);
    }
  }, [combo]);

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setQuantities((prevQuantities) => {
      const newQuantities = [...prevQuantities];
      const index = items.indexOf(itemId);
      if (index > -1) {
        newQuantities[index] = quantity;
      } else {
        newQuantities.push(quantity);
      }
      return newQuantities;
    });
  };

  const handleItemSelection = (selectedOptions: any[]) => {
    const selectedIds = selectedOptions.map((option: any) => option.value);

    const newItems = selectedIds;
    const newQuantities = newItems.map((itemId) => {
      const existingIndex = items.indexOf(itemId);
      if (existingIndex !== -1) {
        return quantities[existingIndex];
      }
      return 0;
    });

    const filteredQuantities = quantities.filter((_, index) => selectedIds.includes(items[index]));

    setItems(newItems);
    setQuantities(filteredQuantities.concat(newQuantities.slice(filteredQuantities.length)));
  };

  const paginatedItems = items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const isValid = items.length > 0 && quantities.some(quantity => quantity > 0);

  const totalItems = items.reduce((sum, itemId, index) => {
    return sum + (quantities[index] || 0);
  }, 0);

  return (
    <form
      action={async (formData: FormData) => {
        if (!isValid) {
          showToast({ message: "Please select at least one item with a non-zero quantity.", status: false, data: undefined });
          return;
        }

        setIsSubmitting(true);

        if (combo) formData.append("comboId", combo.id.toString());

        formData.append("image", image);

        const formattedItems = items.map((itemId, index) => ({
          itemId,
          quantity: quantities[index] || 0,
        }));

        formData.append("items", JSON.stringify(formattedItems));
        formData.append("expirable", isLimited ? "1" : "0");

        if (isLimited) {
          if (fromDate) formData.append("dateFrom", fromDate.toString());
          if (toDate) formData.append("dateTo", toDate.toString());
        }

        const requests = await RequestHandler();

        const isEdit = Boolean(combo?.id);

        const method = isEdit ? requests.patch : requests.post;
        const url = isEdit ? updateComboUrl(combo!.id) : addComboUrl;

        const res = await method(url, {
          body: formData,
          isFormData: true,
          revalidateUrl: "/menu/combos",
        });

        setIsSubmitting(false);

        if (res.status) {
          push("/menu/combos");
        }
        return showToast(res);
      }}
      className="flex-1 overflow-y-auto p-4"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {combo ? "Edit Combo" : "Create New Combo"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {combo ? "Update your combo details" : "Fill in the details to create a new combo"}
            </p>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1">
            {combo ? "Editing" : "New"}
          </Badge>
        </div>

        <Separator />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Basic Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Combo Name <span className="text-destructive">*</span>
                  </label>
                  <Input 
                    defaultValue={combo?.name} 
                    required 
                    autoFocus 
                    name="name" 
                    type="text" 
                    placeholder="e.g., Family Feast"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <Input 
                    defaultValue={combo?.description} 
                    required 
                    name="description" 
                    type="text" 
                    placeholder="Brief description of the combo"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Price <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      defaultValue={combo?.price} 
                      required 
                      name="price" 
                      type="text" 
                      placeholder="0.00"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Image Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Combo Image</h3>
                <span className="text-destructive text-sm">*</span>
              </div>
              <div className="flex justify-center">
                <ImagePicker image={image} setImage={setImage} />
              </div>
            </Card>

            {/* Limited Time Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Limited Time Offer</h3>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={isLimited}
                    onChange={() => setIsLimited(true)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  <span className="text-sm text-foreground">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={!isLimited}
                    onChange={() => setIsLimited(false)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  <span className="text-sm text-foreground">No</span>
                </label>
              </div>

              {isLimited && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Start Date <span className="text-destructive">*</span>
                    </label>
                    <DatePicker date={fromDate} setDate={setFromDate} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      End Date <span className="text-destructive">*</span>
                    </label>
                    <DatePicker date={toDate} setDate={setToDate} />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <List className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Select Food Items</h3>
                <span className="text-destructive text-sm">*</span>
                {items.length > 0 && (
                  <Badge variant="outline" className="ml-auto">
                    {items.length} items
                  </Badge>
                )}
              </div>

              <MultipleSelector
                className="h-12 overflow-y-auto"
                onChange={handleItemSelection}
                options={options.map<any>((item) => ({
                  label: item?.name || 'Unknown Item',
                  value: item?.id || 0,
                }))}
                value={items as any}
                placeholder="Search and select food items..."
                emptyIndicator={
                  <p className="text-center leading-10 text-muted-foreground">
                    No food items found.
                  </p>
                }
              />

              {items.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Quantities</span>
                    <Badge variant="outline" className="text-xs">
                      Total: {totalItems} items
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {paginatedItems.map((itemId, index) => {
                      const actualIndex = currentPage * itemsPerPage + index;
                      const foodItem = options.find((item) => item.id === itemId);
                      return (
                        <div 
                          key={itemId} 
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground flex-1 truncate">
                            {foodItem?.name || "Unknown Item"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Qty</span>
                            <Input
                              type="number"
                              value={quantities[actualIndex] || 0}
                              onChange={(e) =>
                                handleQuantityChange(itemId, parseInt(e.target.value) || 0)
                              }
                              min={1}
                              className="w-16 h-8 text-sm text-center"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {items.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                        className="gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {Math.ceil(items.length / itemsPerPage)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, Math.ceil(items.length / itemsPerPage) - 1)
                          )
                        }
                        disabled={currentPage === Math.ceil(items.length / itemsPerPage) - 1}
                        className="gap-1"
                      >
                        Next
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Summary Card */}
            {items.length > 0 && (
              <Card className="p-5 shadow-sm bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Items</p>
                    <p className="text-lg font-semibold text-foreground">
                      {items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="text-lg font-semibold text-foreground">
                      {totalItems}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => back()}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <SubmitButton
                pendingText={combo ? "Updating..." : "Adding..."}
                disabled={!isValid || isSubmitting}
              >
                {combo ? "Update Combo" : "Create Combo"}
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ComboForm;