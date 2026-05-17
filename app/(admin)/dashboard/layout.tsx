import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Admin Dashboard | Portfolio CMS',
	description: 'Manage your portfolio content',
};

function AdminSidebarFallback() {
	return <aside className="border-border bg-card hidden w-64 border-r lg:block" />;
}

function AdminHeaderFallback() {
	return (
		<header className="border-border bg-card flex h-16 items-center justify-between border-b px-4 lg:px-6" />
	);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="bg-background flex min-h-screen">
			<Suspense fallback={<AdminSidebarFallback />}>
				<AdminSidebar />
			</Suspense>
			<div className="flex flex-1 flex-col">
				<Suspense fallback={<AdminHeaderFallback />}>
					<AdminHeader />
				</Suspense>
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
