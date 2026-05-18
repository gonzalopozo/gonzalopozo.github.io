import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Admin Dashboard | Portfolio CMS',
	description: 'Manage your portfolio content',
};

function AdminSidebarFallback() {
	return <aside className="
   hidden w-64 border-r border-border bg-card
   lg:block
 " />;
}

function AdminHeaderFallback() {
	return (
		<header className="
    flex h-16 items-center justify-between border-b border-border bg-card px-4
    lg:px-6
  " />
	);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen bg-background">
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
