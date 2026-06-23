"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addTableUrl, deleteTableUrl, updateTableUrl } from "@/config/urls";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Table } from "@/typings";

type TableForm = {
  id: number | null;
  name: string;
  capacity: string;
  status: string;
  code: string;
};

function TableForm({
  data,
  children
}: {
  data?: Table,
  children: React.ReactNode,
}) {
  const [isOpened, setIsOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [body, setBody] = useState<TableForm>({
    id: data ? data.id : null,
    name: data ? data.name : "",
    capacity: data ? data.capacity : "",
    status: data? data.status : "available",
    code: data ? data.code : "",
  });

  const { replace } = useRouter();

  const handleSubmit = async () => {
    if (!body.name.trim()) {
      return showToast({ status: false, message: "Please enter information", data: undefined });
    }
    if (!body.capacity || parseInt(body.capacity, 10) < 1) {
      return showToast({ status: false, message: "Table capacity must be at least 1", data: undefined });
    }

    const requests = await RequestHandler();
    const isEdit = Boolean(data?.id);
    const method = isEdit ? requests.patch : requests.post;
    const url = isEdit ? updateTableUrl(data!.id!) : addTableUrl;

    const res = await method(url, {
      body: JSON.stringify(body),
      revalidateUrl: "/tables",
    });

    if (res.status) {
      setIsOpened(false);
      replace("/tables");
    }

    return showToast(res);
  };

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting table...");
    const requests = await RequestHandler();
    try {
      await requests.delete(deleteTableUrl(data!.id!), {
        revalidateUrl: "/tables",
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
        <DialogTitle>{data ? "Update" : "Add"} Table</DialogTitle>

        {confirmingDelete ? (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete table{" "}
              <span className="font-medium text-foreground">{data?.name}</span>? This cannot be undone.
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
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-col h-full"
          >
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 mt-8 w-1/2">
                <span>Table name <span className="text-primary">*</span></span>
                <Input
                  defaultValue={data?.name ?? ""}
                  onChange={(e) => setBody({ ...body, name: e.target.value })}
                  type="text"
                  placeholder="Table 1"
                />
              </div>
              <div className="flex flex-col gap-2 mt-8 w-1/2">
                <span>Table code <span className="text-primary">*</span></span>
                <Input
                  defaultValue={data?.code ?? ""}
                  onChange={(e) => setBody({ ...body, code: e.target.value })}
                  type="text"
                  placeholder="TB-01"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-8">
              <span>Table capacity <span className="text-primary">*</span></span>
              <Input
                defaultValue={data?.capacity ?? ""}
                onChange={(e) => setBody({ ...body, capacity: e.target.value })}
                type="number"
                min={1}
              />
            </div>

            <DialogFooter className="mt-5">
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
                {data ? "Update" : "Add"} Table
              </SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TableForm;