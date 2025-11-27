"use server";

import { getServerSession } from "@/lib/server-session";

// Quick test action to verify session is retrievable
export async function testSessionAction() {
    const session = await getServerSession();

    if (!session) {
        return { success: false, error: "Not authenticated" };
    }

    return {
        success: true,
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
        },
    };
}