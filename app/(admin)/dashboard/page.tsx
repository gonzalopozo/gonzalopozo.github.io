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
            <h1 className="text-2xl font-bold">You are logged in:</h1>
            <ul className="list-disc list-inside text-left mt-4 text-sm">
                <li className="text-gray-500 font-bold text-lg p-2 border-b border-gray-200">ID: {session!.user.id}</li>
                <li className="text-gray-500 font-bold text-lg p-2 border-b border-gray-200">Name: {session!.user.name}</li>
                <li className="text-gray-500 font-bold text-lg p-2 border-b border-gray-200">Email: {session!.user.email}</li>
                <li className="text-gray-500 font-bold text-lg p-2 border-b border-gray-200">Created At: {new Date(session!.user.createdAt).toLocaleDateString( "es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</li>
                <li className="text-gray-500 font-bold text-lg p-2 border-b border-gray-200">IP Address: {session!.session.ipAddress}</li>
            </ul>
            <LogOutButton />
            {/* <form action={signOutAction} className="flex flex-col">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700">Log out!</button>
                <input type="submit" value="Log out!" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700" />
            </form> */}
        </div>
    )
}