import { Car, Dumbbell, Rocket, Trophy, Watch, type LucideIcon } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Hobby {
	label: string;
	Icon: LucideIcon;
}

const HOBBIES: Hobby[] = [
	{ label: 'NBA', Icon: Trophy },
	{ label: 'Cars', Icon: Car },
	{ label: 'Watches', Icon: Watch },
	{ label: 'Startups', Icon: Rocket },
	{ label: 'Training', Icon: Dumbbell },
];

export function HobbiesGridItemContent() {
	return (
		<section
			aria-label="NBA, cars, watches, startups, and training"
			className="relative grid size-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
		>
			<CardHeader className="relative z-10 gap-3 px-5 pt-5 pb-0 [@container_hobby-card_(max-width:420px)]:px-4 [@container_hobby-card_(max-width:420px)]:pt-4">
				<div className="flex items-center justify-between gap-3">
					<span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
						beyond code
					</span>
					<span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-medium text-foreground">
						5 hobbies
					</span>
				</div>

				<div className="max-w-88">
					<CardTitle className="text-xl/tight tracking-tight text-balance [@container_hobby-card_(max-width:420px)]:text-lg">
						Life beyond the terminal.
					</CardTitle>
					<CardDescription className="mt-2 line-clamp-2 max-w-120 text-xs/relaxed text-balance [@container_hobby-card_(max-width:420px)]:line-clamp-3">
						Hobbies that teach me about rhythm, craft, and discipline.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="relative z-10 flex min-h-0 items-end px-5 pt-4 pb-5 [@container_hobby-card_(max-width:420px)]:px-4 [@container_hobby-card_(max-width:420px)]:pb-4">
				<ul className="flex w-full flex-wrap gap-1.5">
					{HOBBIES.map(({ label, Icon }) => (
						<li
							key={label}
							className="group/signal inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-3 py-2 transition-[border-color,background-color] duration-300 ease-out group-hover/hobby:border-primary/25 group-hover/hobby:bg-secondary/80"
						>
							<span className="grid size-6 place-items-center rounded-xl bg-secondary text-primary transition-colors duration-300 ease-out group-hover/signal:bg-primary group-hover/signal:text-primary-foreground">
								<Icon aria-hidden="true" className="size-3.5" />
							</span>
							<span className="text-[11px] font-semibold text-foreground">{label}</span>
						</li>
					))}
				</ul>
			</CardContent>
		</section>
	);
}
