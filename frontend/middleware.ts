import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (publicPaths.some((p) => pathname === p)) {
        return NextResponse.next();
    }

    // Check for access token cookie
    const token = request.cookies.get("access_token");
    if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/jobs") || pathname.startsWith("/profile"))) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/jobs/:path*", "/profile/:path*"],
};
