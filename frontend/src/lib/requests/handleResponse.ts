import { revalidatePath } from "next/cache";

export async function handleResponse(
	method: string,
	res: Response,
	revalidateUrl?: string | null
): Promise<{
	status: boolean;
	message: string;
	meta: any;
	data: any;
}> {
	try {
		console.log(
			`\n ${method.toUpperCase()} -`,
			`\x1b[35m${res.url} \x1b[0m`,
			res.status,
			res.statusText
		);

		const response = await res.json();

		if (typeof response !== "object") {
			throw new Error("Invalid response from server");
		}

		let { status, message, meta, data } = response;

		if (typeof message !== "string") {
			if (status) {
				message = "Request completed successfully.";
			} else {
				message = "Something went wrong. Please try again.";
			}
		}

		if (!status) {
			console.log(`\x1b[31m ⨯ ERROR\x1b[0m - ${message} \n`);
			return { status, data, meta, message };
		}

		if (revalidateUrl) {
			console.log(`\x1b[33m ⚡ REVALIDATING\x1b[0m - ${revalidateUrl}`);
			revalidatePath(revalidateUrl, "page");
		}

		console.log(`\x1b[32m ✓ SUCCESS\x1b[0m - ${message} \n`);
		return { status, data, meta, message };
	} catch (err: any) {
		console.log(`\x1b[31m ⨯ ERROR\x1b[0m - ${err.message + "fasfdf"} \n`);
		return {
			status: false,
			data: null,
			meta: null,
			message:
				"An error occurred while processing your request. Please try again.",
		};
	}
}
