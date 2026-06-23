import Form from "../Form";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import requests from "@/lib/requests";
import { itemListUrl, categoryListUrl } from "@/config/urls";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data } = await requests.get(
    `${itemListUrl}?itemId=${params.id}`
  );

  return {
    title: data.name,
  };
}

export default async function UpdateItemPage({ params }: { params: { id: string } }) {
  const { data } = await requests.get(
    `${itemListUrl}?itemId=${params.id}`
  );

  console.log("DATA", data)

  const categories = await requests.get(categoryListUrl);

  if (!data) return notFound();

  return (
    <div className="flex flex-col h-full">
      <span className="normal-text">Update Item</span>
      <Form options={categories?.data} data={data} />
    </div>
  );
}

