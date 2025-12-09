"use client"

import React, { useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LogOutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setLoading(true);

        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Signed out successfully");
                    router.push("/login");
                },
                onError: (error) => {
                    toast.error(`Failed to sign out: ${error.error.message}`);
                    setLoading(false);
                }
            }
        })
    }

    return (
        <>
            <button onClick={handleClick} className="text-red-500 hover:text-red-600 font-bold cursor-pointer transition-colors duration-300 border-2 border-red-500 rounded-md px-4 py-2 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>{loading && <Spinner className="size-6 text-green-400" />} Sign out!</button>
        </>
    )
}