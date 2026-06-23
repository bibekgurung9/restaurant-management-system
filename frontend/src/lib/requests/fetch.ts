"use server";

import { cookies } from "next/headers";

const apiUrl: string = process.env.API_URL!;

export default async function fetchRequest(
  url: string,
  options: RequestInit = {},
  withAuth: boolean = true,
  isFormData: boolean = false
): Promise<Response> {
  "use server";

  let headers = {} as any;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (!options.cache) {
    options.cache = "default";
  }

  if (withAuth) {
    const accessToken = cookies().get("access_token")?.value;
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  options.headers = { ...options.headers, ...headers };

  return fetch(apiUrl + url, { ...options });
}
