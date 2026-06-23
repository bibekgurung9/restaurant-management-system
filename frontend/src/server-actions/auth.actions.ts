"use server";

import { cookies } from "next/headers";
import { logoutUrl } from "@/config/urls";
import requests from "@/lib/requests";

const apiUrl = process.env.API_URL!;

export async function adminLogin(formData: FormData) {
  const body = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  return await fetch(apiUrl + `/auth/login`, {
    method: "POST",
    cache: "no-cache",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include',
  }).then(async (res) => {
    return await res.json();
  });
}

export async function setSessionCookie(token: string) {
  cookies().set("access_token", token);
}

export async function setRefreshCookie(token: string) {
  cookies().set("refresh_token", token);
}

export async function logoutSession() {
  cookies().delete("access_token");
}


export async function adminLogout() {
  const cookieStore = await cookies();

  try {
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return {
        status: false,
        message: "No refresh token found.",
      };
    }

    const res = await requests.post(logoutUrl, {
      body: JSON.stringify({
        refreshToken,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.status) {
      return {
        status: false,
        message: res.message,
      };
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return {
      status: true,
      message: "Logged out successfully.",
    };

  } catch (error) {
    console.error("Logout error:", error);

    return {
      status: false,
      message: "Logout failed.",
    };
  }
}