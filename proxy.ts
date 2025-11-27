import { NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
    // Cookie-based check using cached session data (more info than getSessionCookie)
    // Still NOT fully secure - real validation happens in Server Actions
    const session = await getCookieCache(request);
    const { pathname } = request.nextUrl;

    // If user seems logged in, redirect away from auth pages
    if (session && pathname.startsWith("/sign-in")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user seems logged out, redirect away from protected pages
    if (!session && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/sign-in", "/dashboard/:path*"],
};