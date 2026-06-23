"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Customer } from "@/typings";
import { createCustomerUrl, updateCustomerUrl } from "@/config/urls";

function CustomerForm({
  data,
  children,
}: {
  data?: Customer;
  children: React.ReactNode;
}) {
  const [isOpened, setIsOpened] = useState(false);
  const [body, setBody] = useState<Customer>({
    id: null,
    name: "",
    phone: "",
    email: "",
    availableCredit: 0,
    currentCredit: 0,
  });

  useEffect(() => {
    if (data) {
      setBody({
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        availableCredit: data.availableCredit,
        currentCredit: data.currentCredit,
        id: data.id,
      });
    }
  }, [data]);

  const { replace } = useRouter();

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  return (
    <Dialog modal open={isOpened} onOpenChange={setIsOpened}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[800px] overflow-auto">
        <DialogTitle>{data ? "Update" : "Add"} Customer</DialogTitle>
        <form
          action={async () => {
            const requests = await RequestHandler();

            if (!validatePhone(body.phone)) {
              return showToast({
                status: false,
                message: "Phone number must be exactly 10 digits.",
                data: undefined,
              });
            }


            if (body.availableCredit! < body.currentCredit!) {
              return showToast({
                status: false,
                message: "Available credit cannot be lower than the current credit.",
                data: undefined,
              });
            }

            const isEdit = Boolean(data?.id);

            const method = isEdit ? requests.patch : requests.post;
            const url = isEdit ? updateCustomerUrl(data!.id!) : createCustomerUrl;

            const res = await method(url, {
              body: JSON.stringify(body),
              revalidateUrl: "/tables",
            });

            if (res.status) {
              setIsOpened(false);
              setBody({
                id: null,
                name: "",
                phone: "",
                email: "",
                availableCredit: 0,
                currentCredit: 0,
              });
              replace("/customers");
            }

            return showToast(res);
          }}
          className="flex flex-col h-full"
        >
          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-2 mt-8 w-1/2">
              <span>
                Customer Name <span className="text-primary">*</span>
              </span>
              <Input
                value={body.name}
                onChange={(e) => setBody({ ...body, name: e.target.value })}
                type="text"
                placeholder="John Doe"
              />
            </div>
            <div className="flex flex-col gap-2 mt-8 w-1/2">
              <span>
                Customer Phone <span className="text-primary">*</span>
              </span>
              <Input
                value={body.phone}
                onChange={(e) => setBody({ ...body, phone: e.target.value })}
                type="text"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-8">
            <span>Customer Email (optional)</span>
            <Input
              value={body.email || ""}
              onChange={(e) => setBody({ ...body, email: e.target.value })}
              type="email"
              placeholder="john@example.com"
            />
          </div>

          <div className="flex flex-col gap-2 mt-8">
            <span>
              Available Credit * <span className="text-primary text-sm">( Default: 10000 )</span>
            </span>
            <Input
              value={body.availableCredit}
              onChange={(e) =>
                setBody({
                  ...body,
                  availableCredit: parseFloat(e.target.value) || 0, // Ensure value is a number
                })
              }
              type="number"
              placeholder="Enter credit limit"
              min={body.currentCredit} // Restrict input to values >= currentCredit
            />
            <small className="text-sm text-gray-500">
              Current Credit: {body.currentCredit}
            </small>
          </div>

          <DialogFooter className="mt-5">
            <Button onClick={() => setIsOpened(false)} variant={"secondary"} type="button">
              Cancel
            </Button>
            <SubmitButton
              onClick={() => setIsOpened(false)}
              pendingText={data ? "Updating..." : "Adding..."}
              className="bg-primary text-white text-sm flex items-center rounded-md py-3 px-4 gap-3 shadow-md"
            >
              {data ? "Update" : "Add"} Customer
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CustomerForm;
