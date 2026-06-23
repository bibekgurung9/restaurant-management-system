import requests from "@/lib/requests";
import Form from "../Form";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { categoryListUrl } from "@/config/urls";

export const metadata: Metadata = {
	title: `Add Food Item - ${siteConfig.name}`,
	description: "Add Food Item",
};

async function page() {
	const categories = await requests.get(categoryListUrl);

	return (
		<div className="flex flex-col h-full">
			<Form options={categories?.data} />
		</div>
	);
}

export default page;
