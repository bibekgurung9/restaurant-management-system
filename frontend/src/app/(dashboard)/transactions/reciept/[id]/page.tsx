"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrinterIcon, ArrowLeft, Receipt as ReceiptIcon } from "lucide-react";
import { RequestHandler } from "@/lib/requests/methods";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReceiptItem {
  id: number;
  itemId?: number;
  comboId?: number;
  quantity: number;
  unit: string;
  price: number;
  itemName?: string;
  comboName?: string;
}

interface PaymentDetails {
  id: number;
  paidAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string;
  vatPercentage: number;
  vatAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  tipAmount: number;
  currency: string;
  remarks: string;
  discountPercent: number;
  discountAmount: number;
  priceBeforeDiscount: number;
  totalAmountAfterTaxes: number;
}

interface ReceiptData {
  id: number;
  table: { id: number; name: string; capacity: number };
  orderItems: ReceiptItem[];
  totalAmount: number;
  guests: number;
  status: string;
  customerId: number | null;
  cancelReason: string | null;
  paymentDetails: PaymentDetails | null;
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchReceipt();
  }, [params.id]);

  const fetchReceipt = async () => {
    try {
      const requests = await RequestHandler();
      const res = await requests.get(`/transactions/receipt/${params.id}`);
      if (res.status && res.data) {
        setReceipt(res.data);
      } else {
        toast.error("Failed to load receipt");
        router.push("/transactions/pending");
      }
    } catch (error) {
      console.error("Receipt fetch error:", error);
      toast.error("Error loading receipt");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Receipt not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `NPR ${amount.toFixed(2)}`;
  const formatDate = (dateStr: string) => format(new Date(dateStr), "dd MMM yyyy, hh:mm a");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Action buttons (hidden when printing) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to orders
        </Button>
        <Button onClick={handlePrint}>
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt Card */}
      <Card className="shadow-lg print:shadow-none print:border-0">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-2">
            <ReceiptIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Restaurant Name</CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">Order ID:</span> #{receipt.id}
            </div>
            <div className="text-right">
              <span className="font-semibold">Table:</span> {receipt.table.name}
            </div>
            <div>
              <span className="font-semibold">Guests:</span> {receipt.guests}
            </div>
            <div className="text-right">
              <span className="font-semibold">Date:</span> {formatDate(receipt.paymentDetails?.paymentDate || new Date().toISOString())}
            </div>
            {receipt.customerId && (
              <div>
                <span className="font-semibold">Customer ID:</span> {receipt.customerId}
              </div>
            )}
            <div className="text-right">
              <span className="font-semibold">Status:</span>{" "}
              <span className="capitalize text-green-600">{receipt.status}</span>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold border-b pb-2 mb-3">Order Items</h3>
            <div className="space-y-2">
              {receipt.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">
                      {item.itemName || item.comboName || "Item"}
                    </span>
                    <span className="text-muted-foreground ml-2">x {item.quantity}</span>
                  </div>
                  <div className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          {receipt.paymentDetails && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.paymentDetails.priceBeforeDiscount)}</span>
              </div>
              {receipt.paymentDetails.discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({receipt.paymentDetails.discountPercent}%)</span>
                  <span>- {formatCurrency(receipt.paymentDetails.discountAmount)}</span>
                </div>
              )}
              {receipt.paymentDetails.vatPercentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>VAT ({receipt.paymentDetails.vatPercentage}%)</span>
                  <span>{formatCurrency(receipt.paymentDetails.vatAmount)}</span>
                </div>
              )}
              {receipt.paymentDetails.serviceChargePercentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Service Charge ({receipt.paymentDetails.serviceChargePercentage}%)</span>
                  <span>{formatCurrency(receipt.paymentDetails.serviceChargeAmount)}</span>
                </div>
              )}
              {receipt.paymentDetails.tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>{formatCurrency(receipt.paymentDetails.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(receipt.paymentDetails.totalAmountAfterTaxes)}</span>
              </div>
            </div>
          )}

          {/* Payment Info */}
          {receipt.paymentDetails && (
            <div className="border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="capitalize">{receipt.paymentDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-semibold">Paid Amount:</span>
                <span>{formatCurrency(receipt.paymentDetails.paidAmount)}</span>
              </div>
              {receipt.paymentDetails.remarks && (
                <div className="mt-2 text-muted-foreground text-xs">
                  {receipt.paymentDetails.remarks}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-4">
            <p>Thank you for dining with us!</p>
            <p>Please keep this receipt for warranty and claims.</p>
          </div>
        </CardContent>
      </Card>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}