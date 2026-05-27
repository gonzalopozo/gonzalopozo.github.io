'use client';

import { useState } from 'react';
import { Car, Dumbbell, Rocket, Trophy, Watch, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Hobby {
	id: string;
	name: string;
	Icon: LucideIcon;
	description: string;
}

const HOBBIES: Hobby[] = [
	{
		id: 'nba',
		name: 'NBA',
		Icon: Trophy,
		description: 'Competition, teamwork, and rhythm',
	},
	{
		id: 'cars',
		name: 'Cars',
		Icon: Car,
		description: 'Engineering and design appreciation',
	},
	{
		id: 'watches',
		name: 'Watches',
		Icon: Watch,
		description: 'Precision and craftsmanship',
	},
	{
		id: 'startups',
		name: 'Startups',
		Icon: Rocket,
		description: 'Innovation, risk, and momentum',
	},
	{
		id: 'training',
		name: 'Training',
		Icon: Dumbbell,
		description: 'Discipline and consistency',
	},
];

export function HobbiesGridItemContent() {
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	return (
		<section
			aria-label="NBA, cars, watches, startups, and training"
			className="relative size-full min-h-0 overflow-hidden p-4"
		>
			<h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
				Hobbies
			</h3>
			<div className="grid w-full grid-cols-3 gap-2">
				{HOBBIES.map((hobby) => (
					<div
						key={hobby.id}
						className="relative"
						onMouseEnter={() => setHoveredId(hobby.id)}
						onMouseLeave={() => setHoveredId(null)}
					>
						<div
							className={cn(
								'relative w-full h-20 rounded-lg bg-secondary/50 border border-border/50',
								'flex items-center justify-center',
								'transition-all duration-300 ease-out',
								hoveredId === hobby.id
									? 'scale-105 border-primary/50 shadow-lg shadow-primary/10'
									: 'hover:border-muted-foreground/30',
							)}
						>
							<div
								className={cn(
									'absolute inset-0 rounded-lg overflow-hidden transition-opacity duration-300',
									'bg-gradient-to-br from-primary/15 via-accent/5 to-transparent',
									hoveredId === hobby.id ? 'opacity-100' : 'opacity-0',
								)}
							/>

							<hobby.Icon
								className={cn(
									'relative z-10 size-6 text-primary transition-all duration-300',
									hoveredId === hobby.id ? 'opacity-0 scale-75' : 'opacity-70',
								)}
								aria-hidden="true"
							/>

							<div
								className={cn(
									'absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-0.5 p-2',
									'transition-all duration-300',
									hoveredId === hobby.id ? 'opacity-100' : 'opacity-0',
								)}
							>
								<p className="text-[11px] font-semibold text-foreground">
									{hobby.name}
								</p>
								<p className="text-[9px] leading-tight text-muted-foreground text-center line-clamp-2">
									{hobby.description}
								</p>
							</div>

							<div
								className={cn(
									'absolute inset-0 rounded-lg bg-primary/5 transition-opacity duration-300',
									hoveredId === hobby.id ? 'opacity-100' : 'opacity-0',
								)}
							/>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
