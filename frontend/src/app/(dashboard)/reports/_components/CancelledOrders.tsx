"use client";
import { TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";
import { Order } from "@/typings";
import Link from "next/link";
import { Button } from "../../../../components/ui/button";

function CancelledOrdersTable({ data }: { data: Array<Order> | null | undefined }) {
  if (!data || data.length === 0)
    return (
      <div className="w-full text-center text-xl text-primary font-medium mt-12">
        No cancelled orders found.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm">
          <tr className="bg-secondary">
            <td scope="col" className="px-4 py-3">S.N</td>
            <td scope="col" className="px-6 py-3">Order Number</td>
            <td scope="col" className="px-6 py-3">Table Name</td>
            <td scope="col" className="px-6 py-3">Total Amount</td>
            <td scope="col" className="px-6 py-3">Guests</td>
            <td scope="col" className="px-6 py-3">Actions</td>
          </tr>
        </thead>
        <tbody>
          {data?.map((order, i) => (
            <tr key={i} className="bg-white border-b text-sm">
              <td className="px-4 py-3">{i + 1}</td>
              <td className="px-6 py-3">{order.id}</td>
              <td className="px-6 py-3">{order?.table?.name || "N/A"}</td>
              <td className="px-6 py-3">{order.totalAmount}</td>
              <td className="px-6 py-3">{order.guests}</td>
              <td>
                <div className="flex items-center justify-center gap-4 h-full w-full">
                  <Link href={`/transactions/payments/${order?.id}`}>
                    <Button size="icon" variant="default" aria-label="View Order">
                      <EyeIcon className="text-white h-5 w-5" />
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger>
                      <TrashIcon className="h-9 w-9 rounded-md p-1.5 text-white bg-tertiary hover:bg-tertiary/80" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this order.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-primary text-white hover:text-white hover:bg-primary/90">Cancel</AlertDialogCancel>
                        <form
                          action={async () => {
                            const toastId = toast.loading("Deleting Order...");

                            const requests = await RequestHandler();

                            const res = await requests.post(
                              `/admin/order/delete`,
                              {
                                body: JSON.stringify({
                                  orderId: order.id,
                                }),
                                revalidateUrl: "/orders",
                              }
                            );

                            return showToast(res, toastId);
                          }}
                        >
                          <AlertDialogAction type="submit" className="text-white bg-tertiary hover:bg-tertiary/90">
                            Delete
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CancelledOrdersTable;
