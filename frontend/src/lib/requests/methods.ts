"use server";

import { handleResponse } from "./handleResponse";
import fetchRequest from "./fetch";

interface ResponseData {
	status: boolean;
	message: string;
	data: any;
	meta: any;
}

interface RequestOptions extends RequestInit {
	withAuth?: boolean;
	isFormData?: boolean;
	revalidateUrl?: string | null;
}

async function request(
	url: string,
	method: "GET" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "DELETE",
	options: RequestOptions = { withAuth: true }
): Promise<ResponseData> {
	"use server";

	const res = await fetchRequest(
		url,
		{ ...options, method },
		options.withAuth,
		options.isFormData
	);
	return await handleResponse(method, res, options.revalidateUrl);
}

export async function RequestHandler() {
	let handler =
		(method: "GET" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "DELETE") =>
		async (url: string, options?: RequestOptions) => {
			"use server";
			return request(url, method, options);
		};

	return {
		get: handler("GET"),
		options: handler("OPTIONS"),
		post: handler("POST"),
		put: handler("PUT"),
		patch: handler("PATCH"),
		delete: handler("DELETE"),
	};
}
