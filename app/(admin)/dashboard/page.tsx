import { ClearInvalidSessionForm } from '@/components/auth/clear-invalid-session-form';
import { LogOutButton } from '@/components/auth/logout';
import { getServerSession } from '@/lib/server-session';

export default async function AdminDashboard() {
	const session = await getServerSession();

	if (!session) {
		return <ClearInvalidSessionForm />;
	}

	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<h1 className="text-2xl font-bold">You are logged in:</h1>
			<ul className="mt-4 list-inside list-disc text-left text-sm">
				<li className="border-b border-gray-200 p-2 text-lg font-bold text-gray-500">
					ID: {session!.user.id}
				</li>
				<li className="border-b border-gray-200 p-2 text-lg font-bold text-gray-500">
					Name: {session!.user.name}
				</li>
				<li className="border-b border-gray-200 p-2 text-lg font-bold text-gray-500">
					Email: {session!.user.email}
				</li>
				<li className="border-b border-gray-200 p-2 text-lg font-bold text-gray-500">
					Created At:{' '}
					{new Date(session!.user.createdAt).toLocaleDateString('es-ES', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
					})}
				</li>
				<li className="border-b border-gray-200 p-2 text-lg font-bold text-gray-500">
					IP Address: {session!.session.ipAddress}
				</li>
			</ul>
			<LogOutButton />
			{/* <form action={signOutAction} className="flex flex-col">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700">Log out!</button>
                <input type="submit" value="Log out!" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700" />
            </form> */}
		</div>
	);
}
