"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { addCategoryUrl, deleteCategoryUrl, updateCategoryUrl } from "@/config/urls";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { Category } from "@/typings";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function CategoryForm({
  data,
  children
}: {
  data?: Category,
  children: React.ReactNode,
}) {
  const [isOpened, setIsOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { replace } = useRouter();

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting category...");
    const requests = await RequestHandler();
    try {
      await requests.delete(deleteCategoryUrl(data!.id), {
        revalidateUrl: "/menu/categories",
      });
      toast.success("Deleted successfully", { id: toastId });
      setIsOpened(false);
    } catch {
      toast.error("Delete failed", { id: toastId });
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <Dialog modal open={isOpened} onOpenChange={(v) => { setIsOpened(v); setConfirmingDelete(false); }}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[800px] overflow-auto">
        <DialogTitle>{data ? "Update" : "Add"} Category</DialogTitle>

        {/* DELETE CONFIRM STATE */}
        {confirmingDelete ? (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{data?.name}</span>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" type="button" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            action={async (formData: FormData) => {
              if (data) formData.append("categoryId", data.id.toString());
              const requests = await RequestHandler();
              const isEdit = Boolean(data?.id);
              const method = isEdit ? requests.patch : requests.post;
              const url = isEdit ? updateCategoryUrl(data!.id!) : addCategoryUrl;
              const res = await method(url, {
                body: formData,
                isFormData: true,
                revalidateUrl: "/menu/categories",
              });
              if (res.status) {
                setIsOpened(false);
                replace("/menu/categories");
              }
              showToast(res);
            }}
            className="flex flex-col h-full"
          >
            <div className="flex flex-col gap-2 mt-8">
              <span>Category name <span className="text-primary">*</span></span>
              <Input
                name="name"
                defaultValue={data?.name ?? ""}
                required
                type="text"
                placeholder="For example Breakfast, Lunch, Dinner..."
              />
            </div>

            <DialogFooter className="mt-5">
              {/* DELETE button only shown when editing */}
              {data && (
                <Button
                  variant="destructive"
                  type="button"
                  className="mr-auto"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={() => setIsOpened(false)} variant="secondary" type="button">
                Cancel
              </Button>
              <SubmitButton
                pendingText={data ? "Updating..." : "Adding..."}
                className="bg-primary text-white text-sm flex items-center rounded-md py-3 px-4 gap-3 shadow-md"
              >
                {data ? "Update" : "Add"} Category
              </SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CategoryForm;