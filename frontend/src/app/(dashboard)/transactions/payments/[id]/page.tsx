import { notFound } from "next/navigation";
import { Metadata } from "next";
import requests from "@/lib/requests";

import { getBillingOrderUrl } from "@/config/urls";
import OrderCheckout from "./Form";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Order # ${params.id}`,
  };
}

async function page({ params }: { params: { id: string } }) {
  const billingOrderId = Number(params.id);

  if (Number.isNaN(billingOrderId)) {
    return notFound();
  }

  const { data: orderDetails } = await requests.get(getBillingOrderUrl(billingOrderId));

  if (!orderDetails) return notFound();

  return (
    <OrderCheckout data={orderDetails} />
  );
}

export default page;
