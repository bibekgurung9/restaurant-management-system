import Form from "./Form";
import requests from "@/lib/requests";
import { Metadata } from "next";
import notFound from "@/app/not-found";
import { comboListUrl, getOrderUrl, itemListUrl, tableListUrl } from "@/config/urls";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Update Order : No.  ${params.id}`,
  };
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const updateOrderId = Number(params.id);

  if (Number.isNaN(updateOrderId)) {
    return notFound();
  }

  if (!updateOrderId) return notFound();

  const [orderResponse, tablesResponse, foodItemsResponse, combosResponse] = await Promise.all([
    requests.get(getOrderUrl(updateOrderId)),
    requests.get(tableListUrl),
    requests.get(itemListUrl),
    requests.get(comboListUrl),
  ]);

  if (orderResponse.status === false) return notFound();

  const { data: order } = orderResponse;
  const { data: tables } = tablesResponse;
  const { data: food } = foodItemsResponse;
  const { data: combos } = combosResponse;

  return (
    <Form order={order} tables={tables} foodItems={food} combos={combos} />
  );
}
