import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyAccess } from "./lib/session";
import { NextURL } from "next/dist/server/web/next-url";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|icons|icns).*)",
  ],
};

const publicRoutes = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/not-found",
];

const apiUrl = process.env.API_URL!;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl}/admin/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh access token');
    }

    // Return the new access token from the response
    return data.data.accessToken;

  } catch (error: any) {
    console.error('Error during token refresh:', error.message);
    return null;
  }
}

async function handleSessionValidation(
  req: NextRequest,
  url: NextURL,
) {
  const accessToken = req.cookies?.get("access_token")?.value ?? "";
  const refreshToken = req.cookies.get('refresh_token')?.value || '';

  if (!accessToken || !refreshToken) {
    const loginUrl = new URL('/auth/login', url);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyAccess(accessToken);

  if (!session) {
    // Token is expired, or invalid
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        const response = NextResponse.next();
        response.cookies.set('access_token', newAccessToken);
        return response;
      } else {
        const loginUrl = new URL(`/auth/login`, url);
        return NextResponse.redirect(loginUrl);
      }
    } else {

      const loginUrl = new URL(`/auth/login`, url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (session.closeToExpiry) {
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        const response = NextResponse.next();
        response.cookies.set('access_token', newAccessToken);
        return response;
      }
    }
  }


  return NextResponse.rewrite(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/verify-email",
  ];

  // Allow public routes immediately
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // No tokens → go login
  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const session = await verifyAccess(accessToken);

  if (!session) {
    const newAccessToken = refreshToken
      ? await refreshAccessToken(refreshToken)
      : null;

    if (!newAccessToken) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const res = NextResponse.next();
    res.cookies.set("access_token", newAccessToken);
    return res;
  }

  return NextResponse.next(); // ✅ IMPORTANT
}