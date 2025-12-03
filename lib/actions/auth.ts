"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// import { getServerSession } from "@/lib/server-session";

export async function signInAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log(email, password);
    
    await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })

    redirect("/dashboard");
}

export async function signOutAction() {
    await auth.api.signOut({
        headers: await headers(),
    })

    redirect("/login")
}