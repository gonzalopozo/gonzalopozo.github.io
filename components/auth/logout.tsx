'use client';

import React, { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogOutButton() {
	const [loading, setLoading] = useState(false);
	const { push } = useRouter();

	const signOutUser = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		setLoading(true);

		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success('Signed out successfully');
					push('/login');
				},
				onError: (error) => {
					toast.error(`Failed to sign out: ${error.error.message}`);
					setLoading(false);
				},
			},
		});
	};

	return (
		<>
			<button
				onClick={signOutUser}
				className="cursor-pointer rounded-md border-2 border-destructive bg-card px-4 py-2 font-bold text-destructive transition-colors duration-300 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				disabled={loading}
			>
				{loading && <Spinner className="size-6 text-current" />} Sign out!
			</button>
		</>
	);
}
