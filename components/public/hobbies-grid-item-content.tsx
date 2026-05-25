import { Car, Dumbbell, Rocket, Trophy, Watch, type LucideIcon } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HobbySignal {
	label: string;
	signal: string;
	Icon: LucideIcon;
}

const HOBBY_SIGNALS: HobbySignal[] = [
	{ label: 'NBA', signal: 'rhythm', Icon: Trophy },
	{ label: 'Cars', signal: 'mechanics', Icon: Car },
	{ label: 'Watches', signal: 'precision', Icon: Watch },
	{ label: 'Startups', signal: 'momentum', Icon: Rocket },
	{ label: 'Training', signal: 'discipline', Icon: Dumbbell },
];

function DialGraphic() {
	const ticks = Array.from({ length: 28 }, (_, index) => {
		const angle = (index / 28) * Math.PI * 2;
		const innerRadius = index % 7 === 0 ? 76 : 84;
		const outerRadius = 94;
		const center = 110;

		return {
			id: `dial-tick-${index}`,
			x1: center + Math.cos(angle) * innerRadius,
			y1: center + Math.sin(angle) * innerRadius,
			x2: center + Math.cos(angle) * outerRadius,
			y2: center + Math.sin(angle) * outerRadius,
			wide: index % 7 === 0,
		};
	});

	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute -top-20 -right-14 size-64 text-primary/20 transition-transform duration-700 ease-out group-hover/hobby:rotate-6"
			viewBox="0 0 220 220"
		>
			<circle
				cx="110"
				cy="110"
				r="96"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.38"
				strokeWidth="1"
			/>
			<circle
				cx="110"
				cy="110"
				r="65"
				fill="none"
				stroke="currentColor"
				strokeDasharray="2 9"
				strokeOpacity="0.42"
				strokeWidth="1"
			/>
			{ticks.map(({ id, x1, y1, x2, y2, wide }) => (
				<line
					key={id}
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					stroke="currentColor"
					strokeLinecap="round"
					strokeOpacity={wide ? '0.72' : '0.34'}
					strokeWidth={wide ? '2.4' : '1'}
				/>
			))}
			<path
				d="M110 110 155 78"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeOpacity="0.75"
				strokeWidth="3"
			/>
			<circle cx="110" cy="110" r="5" fill="currentColor" opacity="0.55" />
		</svg>
	);
}

function CourtGraphic() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute -bottom-5 left-3 h-32 w-72 text-accent/20 transition-transform duration-700 ease-out group-hover/hobby:translate-x-2"
			viewBox="0 0 288 128"
		>
			<rect
				x="8"
				y="8"
				width="272"
				height="112"
				rx="18"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.38"
				strokeWidth="1"
			/>
			<path
				d="M144 8v112M8 64h272M52 32h58v64H52zM178 32h58v64h-58z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeOpacity="0.38"
				strokeWidth="1"
			/>
			<circle
				cx="144"
				cy="64"
				r="24"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.45"
				strokeWidth="1"
			/>
			<path
				d="M110 64a29 29 0 0 1-58 0M178 64a29 29 0 0 0 58 0"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.45"
				strokeWidth="1"
			/>
		</svg>
	);
}

export function HobbiesGridItemContent() {
	return (
		<section
			aria-label="Outside the editor: basketball, cars, watches, startups, and training"
			className="relative grid size-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[radial-gradient(circle_at_82%_18%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_72%,transparent),transparent_58%)]"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,color-mix(in_oklch,var(--accent)_9%,transparent)_42%,transparent_73%)] opacity-80"
			/>
			<DialGraphic />
			<CourtGraphic />

			<CardHeader className="relative z-10 gap-3 px-5 pt-5 pb-0 [@container_hobby-card_(max-width:420px)]:px-4 [@container_hobby-card_(max-width:420px)]:pt-4">
				<div className="flex items-center justify-between gap-3">
					<span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
						outside the editor
					</span>
					<span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-medium text-foreground">
						details compound
					</span>
				</div>

				<div className="max-w-88">
					<CardTitle className="text-xl/tight tracking-tight text-balance [@container_hobby-card_(max-width:420px)]:text-lg">
						Systems where details compound.
					</CardTitle>
					<CardDescription className="mt-2 line-clamp-2 max-w-120 text-xs/relaxed text-balance [@container_hobby-card_(max-width:420px)]:line-clamp-3">
						Basketball, cars, watches, startups, and training shape how I think about
						rhythm, precision, and momentum.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="relative z-10 flex min-h-0 items-end px-5 pt-4 pb-5 [@container_hobby-card_(max-width:420px)]:px-4 [@container_hobby-card_(max-width:420px)]:pb-4">
				<ul className="grid w-full grid-cols-5 gap-1.5 [@container_hobby-card_(max-width:420px)]:grid-cols-3">
					{HOBBY_SIGNALS.map(({ label, signal, Icon }, index) => (
						<li
							key={label}
							className={cn(
								'group/signal flex min-h-16 min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-2.5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent)] backdrop-blur-md transition-[border-color,background-color,transform] duration-300 ease-out group-hover/hobby:border-primary/25 group-hover/hobby:bg-card/90 [@container_hobby-card_(max-width:420px)]:min-h-14',
								index % 2 === 0
									? 'group-hover/hobby:translate-y-0.5'
									: 'group-hover/hobby:-translate-y-1',
							)}
						>
							<span className="grid size-7 place-items-center rounded-xl bg-secondary text-primary transition-colors duration-300 ease-out group-hover/signal:bg-primary group-hover/signal:text-primary-foreground">
								<Icon aria-hidden="true" className="size-3.5" />
							</span>
							<span className="min-w-0">
								<span className="block truncate text-[11px] font-semibold text-foreground">
									{label}
								</span>
								<span className="block truncate text-[10px] text-muted-foreground">
									{signal}
								</span>
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</section>
	);
}
