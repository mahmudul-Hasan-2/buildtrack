import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";
import { Role } from "@prisma/client";
import { ROLE_DASHBOARD_MAP } from "@/lib/permissions";

const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fetch active session via better-auth API endpoint (Edge-safe)
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 1. Redirect unauthenticated users trying to access /dashboard/*
  if (isDashboardRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated, handle role-based routing
  if (session?.user) {
    const userRole = (session.user.role as Role) || Role.SITE_ENGINEER;
    const targetDashboard = ROLE_DASHBOARD_MAP[userRole];

    // Redirect away from login/register pages if already logged in
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }

    // Redirect root /dashboard to the user's specific role dashboard
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }

    // Enforce strict role isolation on /dashboard/<role-segment>
    if (isDashboardRoute) {
      const allowedPrefix = targetDashboard;
      // Allow ADMINs to view any dashboard if needed, otherwise lock strictly to role prefix
      if (userRole !== Role.ADMIN && !pathname.startsWith(allowedPrefix)) {
        return NextResponse.redirect(new URL(targetDashboard, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
