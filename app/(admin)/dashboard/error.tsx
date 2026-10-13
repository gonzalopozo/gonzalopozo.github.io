'use client';

import { Button } from '@/components/ui/button';

/** Keep action/query errors generic; never render database or authorization details. */
export default function DashboardError({ reset }: { reset: () => void }) {
	return (
		<div role="alert" className="space-y-4 rounded-xl border border-border bg-card p-6">
			<h2 className="text-xl font-semibold">The request could not be completed</h2>
			<p className="text-muted-foreground">
				Check the submitted information and your account access, then try again.
			</p>
			<Button onClick={reset}>Try again</Button>
		</div>
	);
}
