import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const { pathname } = request.nextUrl;

	// Optimistic redirect: logged-in → away from /login
	if (sessionCookie && pathname.startsWith('/login')) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	// Optimistic redirect: logged-out → away from /dashboard
	if (!sessionCookie && pathname.startsWith('/dashboard')) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/login', '/dashboard/:path*'],
};
