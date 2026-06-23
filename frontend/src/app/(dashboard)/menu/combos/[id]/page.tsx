import Form from "../Form";
import { notFound } from "next/navigation";
import requests from "@/lib/requests";
import { comboListUrl, itemListUrl } from "@/config/urls";

export const metadata = {
  title: "Admin - Update Combo",
};

async function page({ params }: { params: { id: string } }) {
  const { data : combo } = await requests.get(
    `${comboListUrl}?comboId=${params.id}`
  );

  const foodItems = await requests.get(itemListUrl);

  if (!combo) return notFound();

  return (
    <div className="flex flex-col h-full">
      <span className="normal-text mb-4">Update Combo</span>
        <Form options={foodItems?.data} combo={combo} />
    </div>
  );
}

export default page;
