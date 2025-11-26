// middleware.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Define role-based route access
const roleAccess = {
  ADMIN: ["/admin", "/api/users", "/api/logs"],
  participant: ["/participant", ]
}

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/api/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Get session
  const session = await auth()
  
  // Redirect to login if accessing protected route without session
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (session && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = getDashboardUrl(session.user.role)
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }
  
  // Check role-based access
  if (session && !isPublicRoute) {
    const userRole = session.user.role
    const hasAccess = checkRouteAccess(pathname, userRole)
    
    if (!hasAccess) {
      // Redirect to appropriate dashboard if user doesn't have access
      const dashboardUrl = getDashboardUrl(userRole)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
  }
  
  return NextResponse.next()
}

function checkRouteAccess(pathname: string, role: string): boolean {
  const allowedRoutes = roleAccess[role as keyof typeof roleAccess]
  if (!allowedRoutes) return false
  
  return allowedRoutes.some(route => pathname.startsWith(route))
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin"
    case "PARTICIPANT":
      return "/participant"

    default:
      return "/"
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
