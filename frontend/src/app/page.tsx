import { redirect } from "next/navigation";
import requests from "@/lib/requests";
import { getMeUrl } from "@/config/urls";

export default async function HomePage() {
  let session = null;

  try {
    const res = await requests.get(getMeUrl);
    session = res?.data;
  } catch (e) {
    session = null;
  }

  // If logged in → go to main app
  if (session) {
    redirect("/dashboard"); // or /dashboard, /app, etc.
  }

  // If NOT logged in → go to login page
  redirect("/auth/login");
}