import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
export default NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  
  if (isOnDashboard) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl));

    const user = req.auth?.user as { role?: string } | undefined;
    const role = user?.role;
    const path = req.nextUrl.pathname;
    
    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    if (path.startsWith("/dashboard/lender") && role !== "LENDER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    if (path.startsWith("/dashboard/worker") && role !== "WORKER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    
    // If they are exactly at /dashboard, send them to their role-specific dashboard
    if (path === "/dashboard") {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.nextUrl));
      if (role === "LENDER") return NextResponse.redirect(new URL("/dashboard/lender", req.nextUrl));
      if (role === "WORKER") return NextResponse.redirect(new URL("/dashboard/worker", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
