import { OrderItem } from "@/typings";
import { RequestHandler } from "@/lib/requests/methods";
import { showToast } from "@/lib/requests/showToast";

import { addOrderUrl } from "@/config/urls";
import { prepareItemsForRequest } from "@/utils/orderItemHelpers";

interface OrderCreationParams {
  tableId: number;
  items: OrderItem[];
  guestCount: number;
  appliedDiscount?: number;
  discountAmount?: number;
  paymentMode?: string | null;
}

/**
 * Create an order and handle response
 */
export const createOrder = async (params: OrderCreationParams) => {
  const requests = await RequestHandler();
  
  const itemsToSend = prepareItemsForRequest(params.items);

  const requestBody = {
    tableId: params.tableId,
    items: itemsToSend,
    guestCount: params.guestCount,
    appliedDiscount: params.appliedDiscount || 0,
    discountAmount: params.discountAmount || 0,
    paymentMode: params.paymentMode || null,
  };

  return await requests.post(addOrderUrl, {
    body: JSON.stringify(requestBody),
    revalidateUrl: "/orders",
  });
};

/**
 * Create order and show toast notification
 */
export const createOrderWithToast = async (params: OrderCreationParams, toastId?: string | number) => {
  const res = await createOrder(params);
  showToast(res, toastId);
  return res;
};
