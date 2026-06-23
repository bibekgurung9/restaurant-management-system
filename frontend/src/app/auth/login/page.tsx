import React from "react";
import LoginForm from "./LoginForm";
import { siteConfig } from "@/config/site";

export const metadata = {
	title: `Login | ${siteConfig.name}`,
};

function page() {
	return (
		<div className="flex flex-col mt-5 w-full">
			<span className="text-4xl font-semibold mb-6">Welcome back!</span>

			<span className="text-lg font-medium">
				<span className="underline underline-offset-8 decoration-4 decoration-primary">
					Login
				</span>{" "}
				to your account
			</span>
			<LoginForm />
		</div>
	);
}

export default page;
