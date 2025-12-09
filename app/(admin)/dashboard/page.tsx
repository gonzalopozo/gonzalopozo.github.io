import { LogOutButton } from "@/components/auth/logout";
import { getServerSession } from "@/lib/server-session"
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const session = await getServerSession();

    if (!session) {
        // Redirect to Route Handler that clears invalid cookies
        // This prevents redirect loop with proxy's optimistic check
        redirect("/api/auth/clear-invalid-session");
    }


    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">You are logged in: {session!.user.id}</h1>
            <LogOutButton />
            {/* <form action={signOutAction} className="flex flex-col">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700">Log out!</button>
                <input type="submit" value="Log out!" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700" />
            </form> */}
        </div>
    )
}