"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoyaltyProgram } from "@/typings";
import { DatePicker } from "@/components/ui/date-picker";
import { showToast } from "@/lib/requests/showToast";
import { RequestHandler } from "@/lib/requests/methods";
import { SubmitButton } from "@/components/ui/submit-button";
import { createLoyaltyUrl, updateLoyaltyUrl } from "@/config/urls";

function LoyaltyProgramForm({
  loyaltyProgram,
  children,
}: {
  loyaltyProgram?: LoyaltyProgram;
  children: React.ReactNode;
}) {
  const [name, setName] = useState(loyaltyProgram ? loyaltyProgram.name : "");
  const [discount, setDiscount] = useState(loyaltyProgram ? loyaltyProgram.discount : 0);
  const [totalOrdersRequired, setTotalOrdersRequired] = useState(loyaltyProgram ? loyaltyProgram.totalOrdersRequired : 0);
  const [totalAmountSpent, setTotalAmountSpent] = useState(loyaltyProgram ? loyaltyProgram.totalAmountSpent : 0);
  const [description, setDescription] = useState(loyaltyProgram ? loyaltyProgram.description : "");
  const [validFrom, setValidFrom] = useState<any>(loyaltyProgram?.validFrom ? new Date(loyaltyProgram.validFrom) : null);
  const [validTo, setValidTo] = useState<any>(loyaltyProgram?.validTo ? new Date(loyaltyProgram.validTo) : null);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    if (!loyaltyProgram) {
      setValidFrom(null);
      setValidTo(null);
    }
  }, [loyaltyProgram]);

  useEffect(() => {
    if (!loyaltyProgram) return;

    setName(loyaltyProgram.name ?? "");
    setDiscount(loyaltyProgram.discount ?? 0);
    setTotalOrdersRequired(loyaltyProgram.totalOrdersRequired ?? 0);
    setTotalAmountSpent(loyaltyProgram.totalAmountSpent ?? 0);
    setDescription(loyaltyProgram.description ?? "");

    setValidFrom(
      loyaltyProgram.validFrom ? new Date(loyaltyProgram.validFrom) : null
    );

    setValidTo(
      loyaltyProgram.validTo ? new Date(loyaltyProgram.validTo) : null
    );
  }, [loyaltyProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validFrom || !validTo) {
      showToast({
        message: "Valid From and Valid To dates are required!",
        status: false,
        data: undefined,
      });
      return;
    }

    if (new Date(validFrom) > new Date(validTo)) {
      showToast({
        message: "Valid from date must be earlier than valid to date!",
        status: false,
        data: undefined,
      });
      return;
    }

    const payload = {
      name,
      discount,
      totalOrdersRequired,
      totalAmountSpent,
      description,
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
    };

    try {
      const requests = await RequestHandler();

      const isEdit = Boolean(loyaltyProgram?.id);

      const method = isEdit ? requests.patch : requests.post;
      const url = isEdit
        ? updateLoyaltyUrl(loyaltyProgram!.id!)
        : createLoyaltyUrl;

      const res = await method(url, {
        body: JSON.stringify(payload),
        revalidateUrl: "/customers/loyalty",
      });

      if (res.status) {
        setIsOpened(false);
        setValidFrom(null);
        setValidTo(null);
      }

      return showToast(res);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog modal open={isOpened} onOpenChange={setIsOpened}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[800px] overflow-auto">
        <DialogTitle>{loyaltyProgram ? "Update" : "Add"} Loyalty Program</DialogTitle>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col mt-4 gap-3"
        >
          <div>
            <span className="secondary-text">Program Name *</span>
            <Input
              defaultValue={loyaltyProgram ? loyaltyProgram.name : ""}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              name="name"
              type="text"
            />
          </div>

          <div>
            <span className="secondary-text">Discount (%)  *</span>
            <Input
              defaultValue={loyaltyProgram ? loyaltyProgram.discount : ""}
              onChange={(e) => setDiscount(parseInt(e.target.value))}
              required
              name="discount"
              type="number"
              min={1}
            />
          </div>

          <div>
            <span className="secondary-text">Total Orders Required  *</span>
            <Input
              defaultValue={loyaltyProgram ? loyaltyProgram.totalOrdersRequired : ""}
              onChange={(e) => setTotalOrdersRequired(parseInt(e.target.value))}
              required
              name="totalOrdersRequired"
              type="number"
              min={0}
            />
          </div>

          <div>
            <span className="secondary-text">Total Amount Spent Required (In NPR)  *</span>
            <Input
              defaultValue={loyaltyProgram ? loyaltyProgram.totalAmountSpent : ""}
              onChange={(e) => setTotalAmountSpent(parseFloat(e.target.value))}
              required
              name="totalAmountSpent"
              type="number"
              min={0}
            />
          </div>

          <div>
            <span className="secondary-text">Description  *</span>
            <Input
              defaultValue={loyaltyProgram ? loyaltyProgram.description : ""}
              onChange={(e) => setDescription(e.target.value)}
              required
              name="description"
              type="text"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1/2">
              <span className="secondary-text">Valid From  *</span>
              <div className="bg-accent">
                <DatePicker date={validFrom} setDate={setValidFrom} />
              </div>
            </div>
            <div className="w-1/2">
              <span className="secondary-text">Valid To  *</span>
              <div className="bg-accent">
                <DatePicker date={validTo} setDate={setValidTo} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-5">
            <Button onClick={() => setIsOpened(false)} variant={"secondary"} type="button">
              Cancel
            </Button>
            <SubmitButton
              pendingText={loyaltyProgram ? "Updating..." : "Adding..."}
              className="bg-primary text-white text-sm flex items-center rounded-md py-3 px-4 gap-3 shadow-md"
            >
              {loyaltyProgram ? "Update" : "Add"} Program
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LoyaltyProgramForm;
