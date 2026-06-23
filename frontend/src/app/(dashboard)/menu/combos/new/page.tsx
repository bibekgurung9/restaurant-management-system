import requests from "@/lib/requests";
import Form from "../Form";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { itemListUrl } from "@/config/urls";

export const metadata: Metadata = {
	title: `Add Combo - ${siteConfig.name}`,
	description: "Add Combo",
};

async function page() {
	const foodItems = await requests.get(itemListUrl);

	return (
		<div className="flex flex-col h-full">
			<Form options={foodItems?.data} />
		</div>
	);
}

export default page;
