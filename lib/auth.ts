import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as authSchema from '@/db/schema/better-auth';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: { ...authSchema, user: authSchema.users },
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
		disableSignUp: true, // Only allow sign-in, no registration
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes - avoids DB hit on every getSession call
		},
	},
	plugins: [nextCookies()],
});
