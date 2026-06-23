import { notFound } from "next/navigation";
import { Metadata } from "next";
import requests from "@/lib/requests";
import CustomerDetailsCard from "@/app/(dashboard)/customers/_components/CustomerDetails";
import { customerListUrl } from "@/config/urls";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Customer Detail : # ${params.id}`,
  };
}

async function page({
  params,
}: {
  params: { id: string };
}) {
  const customerId = Number(params.id);

  if (Number.isNaN(customerId)) {
    return notFound();
  }

  if (!customerId) return notFound();

  const { data: data, meta } = await requests.get(`${customerListUrl}?customerId=${customerId}`,
    {
      revalidateUrl: "/customers",
    });
  if (!data) return notFound();

  return <CustomerDetailsCard customer={data[0]} />
}

export default page;
