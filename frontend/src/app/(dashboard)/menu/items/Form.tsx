"use client";
import ImagePicker from "@/components/global/ImagePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Category, Item } from "@/typings";
import Link from "next/link";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { PlusCircle, Package, Image as ImageIcon, Layers, AlertCircle, Box } from 'lucide-react';
import { addItemUrl, updateItemUrl } from "@/config/urls";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function Form({ data, options }: { data?: Item; options: any }) {
  const [itemImage, setItemImage] = useState(data ? data.image : "");
  const [isLimited, setIsLimited] = useState(data ? data.isLimited : false);
  const [quantity, setQuantity] = useState(data ? data.inventory?.quantity : "");
  const [threshold, setThreshold] = useState(data ? data.inventory?.threshold : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { replace, back } = useRouter();

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        
        const imageToAppend = itemImage || "";
        formData.append("image", imageToAppend);

        if (data) formData.append("itemId", data.id.toString());

        if (isLimited) {
          if (!formData.has("quantity")) {
            formData.append("quantity", quantity!.toString());
          }
          if (!formData.has("threshold")) {
            formData.append("threshold", threshold!.toString());
          }
        }

        const requests = await RequestHandler();

        const isEdit = Boolean(data?.id);

        const method = isEdit ? requests.patch : requests.post;
        const url = isEdit ? updateItemUrl(data!.id!) : addItemUrl;

        const res = await method(url, {
          body: formData,
          isFormData: true,
          revalidateUrl: "/items",
        });

        setIsSubmitting(false);

        if (res.status) {
          replace("/menu/items");
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
              {data ? "Edit Item" : "Create New Item"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data ? "Update your item details" : "Fill in the details to add a new item to your menu"}
            </p>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1">
            {data ? "Editing" : "New"}
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
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="name"
                    required
                    defaultValue={data?.name}
                    type="text"
                    placeholder="e.g., Classic Burger"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Price <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="price"
                      required
                      min={1}
                      defaultValue={data?.price}
                      type="number"
                      placeholder="0.00"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Unit <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="unit"
                      required
                      defaultValue={data?.unit}
                      type="text"
                      placeholder="e.g., piece, plate, kg, litre"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Category Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Category</h3>
                <span className="text-destructive text-sm">*</span>
              </div>
              <Select required defaultValue={String(data?.categoryId)} name="categoryId">
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <Link 
                    href="/menu/categories" 
                    className="relative flex items-center gap-2 w-full cursor-pointer select-none rounded-sm py-2 pl-2 pr-8 outline-none hover:bg-accent hover:text-primary transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Category</span>
                  </Link>
                  {options?.map((option: Category, i: number) => (
                    <SelectItem key={i} value={String(option.id)}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Select an existing category or create a new one
              </p>
            </Card>

            {/* Image Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Item Image</h3>
                <span className="text-destructive text-sm">*</span>
              </div>
              <div className="flex justify-center">
                <ImagePicker image={itemImage} setImage={setItemImage} />
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Inventory Card */}
            <Card className="p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Inventory Management</h3>
                <Badge 
                  variant={isLimited ? "default" : "outline"} 
                  className="ml-auto text-xs"
                >
                  {isLimited ? "Limited" : "Unlimited"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isLimited"
                      checked={isLimited}
                      value={isLimited ? "true" : "false"}
                      onChange={(e) => setIsLimited(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Track Inventory</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Enable to set quantity limits and low stock alerts
                  </p>
                </div>

                {isLimited && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Quantity <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="quantity"
                        required
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min={1}
                        placeholder="e.g., 100"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Low Stock Threshold <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="threshold"
                        required
                        type="number"
                        value={threshold}
                        min={1}
                        onChange={(e) => setThreshold(e.target.value)}
                        placeholder="e.g., 10"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You'll be alerted when stock falls below this number
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Summary Card */}
            {data && (
              <Card className="p-5 shadow-sm bg-primary/5 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <Badge variant="default" className="text-xs">
                      {isLimited ? "Limited Stock" : "Unlimited"}
                    </Badge>
                  </div>
                  {isLimited && data.inventory && (
                    <>
                      <Separator className="bg-primary/10" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available Quantity</span>
                        <span className="text-sm font-semibold text-foreground">
                          {data.inventory.quantity || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Threshold</span>
                        <span className="text-sm font-semibold text-foreground">
                          {data.inventory.threshold || 0}
                        </span>
                      </div>
                    </>
                  )}
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
                pendingText={data ? "Updating..." : "Adding..."}
                disabled={isSubmitting}
              >
                {data ? "Update Item" : "Create Item"}
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default Form;