import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "vi"];
const defaultLocale = "vi";

export function middleware(request: NextRequest) {
  // IISNode passes named pipe through URL (e.g. //pipe/uuid/...), strip it out.
  let pathname = request.nextUrl.pathname;
  if (pathname.match(/^\/?\/?pipe\/[^\/]+/)) {
    pathname = pathname.replace(/^\/?\/?pipe\/[^\/]+/, '');
  }
  if (!pathname || pathname === '') pathname = '/';
  
  // Update the request URL internally so other parts of the Next.js app don't see the pipe
  request.nextUrl.pathname = pathname;

  // Ignore API routes and public files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // static files like .png, .ico
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Redirect if there is no locale
  // By default, let's use the defaultLocale
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
  ],
};
