import { redirect } from "next/navigation";
import requests from "@/lib/requests";
import { routePermissions } from "@/config/permissions";
import { getMeUrl } from "@/config/urls";

export async function requireRole(pathname: string) {
  const session = await requests.get(getMeUrl);

  const allowedRoles = routePermissions[pathname];

  if (!allowedRoles) return;

  if (!allowedRoles.includes(session.data.role)) {
    redirect("/unauthorized");
  }
}