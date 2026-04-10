'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export function LoginForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);

		await authClient.signIn.email(
			{
				email: formData.get('email') as string,
				password: formData.get('password') as string,
			},
			{
				onSuccess: () => {
					toast.success('Signed in successfully');
					router.push('/dashboard');
				},
				onError: (ctx) => {
					toast.error(`Failed to sign in: ${ctx.error.message}`);
					setError(ctx.error.message);
				},
			},
		);

		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col">
			<h1>Login</h1>
			<div>
				<label htmlFor="email">Email:</label>
				<input type="email" name="email" id="email" placeholder="email" />
			</div>
			<div>
				<label htmlFor="password">Password:</label>
				<input type="password" name="password" id="password" placeholder="password" />
			</div>

			{error && <div>{error}</div>}

			<button type="submit">
				{loading && <Spinner className="size-6 text-blue-500" />} Login!{' '}
			</button>
		</form>
	);
}
