import { type IconType } from 'react-icons';
import {
	SiReact,
	SiTypescript,
	SiNextdotjs,
	SiTailwindcss,
	SiNodedotjs,
	SiPostgresql,
	SiDocker,
	SiGit,
	SiAmazon,
	SiPython,
} from 'react-icons/si';

import { GridItemShowMoreButton } from '@/components/public/grid-item';

const TECH_STACK: IconType[] = [
	SiReact,
	SiTypescript,
	SiNextdotjs,
	SiTailwindcss,
	SiNodedotjs,
	SiPostgresql,
	SiDocker,
	SiGit,
	SiAmazon,
	SiPython,
];

function TechMarquee() {
	return (
		<div className="relative flex overflow-hidden">
			<div className="flex w-max animate-tech-marquee items-center gap-6">
				{[...TECH_STACK, ...TECH_STACK].map((Icon, i) => (
					<span
						key={`tech-${i}`}
						className="flex shrink-0 items-center text-muted-foreground"
					>
						<Icon className="size-7" aria-hidden="true" />
					</span>
				))}
			</div>
		</div>
	);
}

export function ExperienceGridItemContent() {
	return (
		<div className="group/experience grid size-full min-h-0 grid-rows-[1fr_auto_auto] items-center gap-3 overflow-hidden px-6 py-5">
			<div className="flex flex-col gap-1.5">
				<p className="text-2xl/tight font-bold tracking-tight text-balance">
					Full Stack Developer
				</p>
				<p className="text-sm/relaxed text-muted-foreground">
					Building modern web applications with cutting-edge technologies and thoughtful
					interfaces.
				</p>
			</div>

			<TechMarquee />

			<GridItemShowMoreButton
				variant="experience"
				label="View experience"
				className="h-9 w-fit rounded-full px-4"
			/>
		</div>
	);
}
