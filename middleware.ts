import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/", "/features", "/pricing", "/contact"];
const STATIC_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon",
  "/og-image",
  "/robots",
  "/sitemap",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and API routes
  if (
    STATIC_PREFIXES.some((p: string) => pathname.startsWith(p)) ||
    pathname.includes(".") ||
    pathname === "/api/auth"
  ) {
    return NextResponse.next();
  }

  // Public marketing pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Platform routes
  if (pathname.startsWith("/platform")) {
    if (pathname === "/platform/sign-in") {
      if (token && (token as any).userType === "platform") {
        return NextResponse.redirect(new URL("/platform/companies", req.url));
      }
      return NextResponse.next();
    }
    if (!token || (token as any).userType !== "platform") {
      return NextResponse.redirect(new URL("/platform/sign-in", req.url));
    }
    // Redirect /platform to /platform/companies
    if (pathname === "/platform") {
      return NextResponse.redirect(new URL("/platform/companies", req.url));
    }
    return NextResponse.next();
  }

  // Company slug routes (everything else with a path segment)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return NextResponse.next();

  const companySlug = segments[0];
  const isSignIn = segments[1] === "sign-in" && segments.length === 2;
  const isCustomerArea = segments[1] === "my";

  // Sign-in page: allow unauthenticated, redirect signed-in users
  if (isSignIn) {
    if (token) {
      const tokenData = token as any;
      if (tokenData.userType === "platform") {
        return NextResponse.redirect(new URL("/platform/companies", req.url));
      }
      if (tokenData.companySlug === companySlug) {
        if (tokenData.userType === "employee") {
          return NextResponse.redirect(new URL(`/${companySlug}/dashboard`, req.url));
        }
        if (tokenData.userType === "customer") {
          return NextResponse.redirect(new URL(`/${companySlug}/my`, req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // All other company routes require auth
  if (!token) {
    return NextResponse.redirect(new URL(`/${companySlug}/sign-in`, req.url));
  }

  const tokenData = token as any;

  // Platform users cannot access company routes
  if (tokenData.userType === "platform") {
    return NextResponse.redirect(new URL("/platform/companies", req.url));
  }

  // Verify company slug matches user's company
  if (tokenData.companySlug !== companySlug) {
    return NextResponse.redirect(new URL(`/${tokenData.companySlug}/${tokenData.userType === "customer" ? "my" : "dashboard"}`, req.url));
  }

  // Customer area
  if (isCustomerArea) {
    if (tokenData.userType !== "customer") {
      return NextResponse.redirect(new URL(`/${companySlug}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // Employee area
  if (tokenData.userType === "customer") {
    return NextResponse.redirect(new URL(`/${companySlug}/my`, req.url));
  }

  if (tokenData.userType !== "employee") {
    return NextResponse.redirect(new URL(`/${companySlug}/sign-in`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|og-image|.*\\..*).*)" ],
};
