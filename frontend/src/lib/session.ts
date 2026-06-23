"use server";

import { decodeJwt } from "jose";

const REFRESH_BEFORE_EXPIRY = 300;

export function verifyAccess(accessToken: string) {
  if (!accessToken) return null;

  try {
    const payload = decodeJwt(accessToken);

    if (!payload.exp) return null;

    const expTime = payload.exp * 1000;
    const currentTime = Date.now();

    const closeToExpiry =
      expTime - currentTime <= REFRESH_BEFORE_EXPIRY * 1000;

    if (expTime < currentTime) {
      console.warn("Access token is expired");
      return null;
    }

    return {
      payload,
      closeToExpiry,
    };
  } catch (e) {
    console.error("Invalid token format:", e);
    return null;
  }
}