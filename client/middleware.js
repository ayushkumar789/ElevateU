import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("elevateu_jwt")?.value; // same key as TOKEN_KEY
    const { pathname } = req.nextUrl;

    const protectedPaths = ["/dashboard", "/resume", "/interview", "/jobs", "/profile"];
    const needsAuth = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

    if (needsAuth && !token) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/resume/:path*",
        "/interview/:path*",
        "/jobs/:path*",
        "/profile/:path*"
    ],
};
