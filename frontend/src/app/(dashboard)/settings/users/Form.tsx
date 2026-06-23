"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { createStaffUrl, deleteStaffByIdUrl, updateStaffByIdUrl } from "@/config/urls";
import { AdminRole } from "@/config/constant";

function UserForm({
  data,
  children,
}: {
  data?: any;
  children: React.ReactNode;
}) {
  const [isOpened, setIsOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting staff...");

    const requests = await RequestHandler();

    const res = await requests.delete(deleteStaffByIdUrl(data.id), {
      revalidateUrl: "/settings/users",
    });

    showToast(res, toastId);

    setConfirmingDelete(false);
    setIsOpened(false);
  };


  return (
    <Dialog
      open={isOpened}
      onOpenChange={(v) => {
        setIsOpened(v);
        setConfirmingDelete(false);
      }}
    >
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[800px] overflow-auto">
        <DialogTitle>
          {data ? "Update Staff" : "Add Staff"}
        </DialogTitle>


        {confirmingDelete ? (

          <div className="flex flex-col gap-4 py-4">

            <p>
              Delete{" "}
              <b>{data?.name}</b> permanently?
            </p>


            <DialogFooter>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>


              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>

            </DialogFooter>

          </div>


        ) : (

          <form action={async () => {
            const requests = await RequestHandler();

            const isEdit = Boolean(data?.id);

            const body = {
              name: (document.querySelector('[name="name"]') as HTMLInputElement).value,
              email: (document.querySelector('[name="email"]') as HTMLInputElement).value,
              role: (document.querySelector('[name="role"]') as HTMLSelectElement).value,
              phone: (document.querySelector('[name="phone"]') as HTMLInputElement).value,
              remarks: (document.querySelector('[name="remarks"]') as HTMLInputElement).value,
              ...(() => {
                const password = (
                  document.querySelector('[name="password"]') as HTMLInputElement
                ).value;

                return password ? { password } : {};
              })(),
            };

            const res = await (isEdit ? requests.patch : requests.post)(
              isEdit ? updateStaffByIdUrl(data.id) : createStaffUrl,
              {
                body: JSON.stringify(body),
                revalidateUrl: "/admin/staff",
              }
            );

            showToast(res);

            if (res.status) {
              setIsOpened(false);
            }
          }}
            className="flex flex-col gap-4"
          >
            <div>
              <span>Name *</span>

              <Input
                name="name"
                required
                defaultValue={data?.name ?? ""}
                placeholder="Staff name"
              />

            </div>



            <div>
              <span>Email *</span>

              <Input
                name="email"
                type="email"
                required
                defaultValue={data?.email ?? ""}
                placeholder="email@example.com"
              />

            </div>

            <div>
              <span>Phone</span>

              <Input
                name="phone"
                defaultValue={data?.phone ?? ""}
                placeholder="Phone number"
              />

            </div>



            <div>
              <span>Role *</span>
              <select
                name="role"
                defaultValue={data?.role ?? AdminRole.STAFF}
                className="border rounded-md p-2"
              >
                {Object.values(AdminRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span>Remarks</span>

              <Input
                name="remarks"
                defaultValue={data?.remarks ?? ""}
                placeholder="Remarks"
              />

            </div>

            <div>
              <span>Password {data ? "(leave empty to keep current)" : "*"}</span>

              <Input
                name="password"
                type="password"
                required={!data}
                defaultValue=""
                placeholder={data ? "New password (optional)" : "Password"}
              />
            </div>

            <DialogFooter className="mt-5">
              {data && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>

              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpened(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                pendingText={
                  data
                    ? "Updating..."
                    : "Adding..."
                }
              >
                {data ? "Update" : "Add"} Staff
              </SubmitButton>


            </DialogFooter>


          </form>

        )}

      </DialogContent>

    </Dialog>
  );
}

export default UserForm;