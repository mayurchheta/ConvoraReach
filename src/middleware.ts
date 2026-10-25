import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes — no auth check
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/contact" ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/instagram/callback") ||
    pathname.startsWith("/api/contact") ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/data-deletion"
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth session token cookie
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Rewrite /instagram/* to /app/instagram/* (hide org slug from URL)
  if (pathname.startsWith("/instagram")) {
    const newPath = `/app${pathname}`
    return NextResponse.rewrite(new URL(newPath, req.url))
  }

  // Rewrite /profile to /profile (no change needed, already standalone)
  // Rewrite /dashboard to /app/instagram/dashboard
  if (pathname === "/dashboard") {
    return NextResponse.rewrite(new URL("/app/instagram/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
