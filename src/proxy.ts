import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const hasSession = !!getSessionCookie(request);

  // Fast cookie check only. Real authorization happens on the server (requireRole).
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/budget/:path*",
    "/expenses/:path*",
    "/materials/:path*",
    "/contractors/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/settings/:path*",
  ],
};
