import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";                 // your Drizzle Turso client
import * as authSchema from "@/db/schema/better-auth";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    database: drizzleAdapter(db, {
        provider: "sqlite",                   // Turso/libSQL uses sqlite dialect
        schema: { ...authSchema, user: authSchema.users },
        usePlural: true,
    }),
    emailAndPassword: { enabled: true },    // configure in step 6
});