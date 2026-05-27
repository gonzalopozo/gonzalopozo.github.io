import {
	SiReact,
	SiTypescript,
	SiNextdotjs,
	SiTailwindcss,
	SiNodedotjs,
	SiPostgresql,
	SiDocker,
	SiGit,
	SiAmazonaws,
	SiPython,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import { GridItemShowMoreButton } from '@/components/public/grid-item';

const TECH_STACK: { icon: IconType; label: string }[] = [
	{ icon: SiReact, label: 'React' },
	{ icon: SiTypescript, label: 'TypeScript' },
	{ icon: SiNextdotjs, label: 'Next.js' },
	{ icon: SiTailwindcss, label: 'Tailwind' },
	{ icon: SiNodedotjs, label: 'Node.js' },
	{ icon: SiPostgresql, label: 'PostgreSQL' },
	{ icon: SiDocker, label: 'Docker' },
	{ icon: SiGit, label: 'Git' },
	{ icon: SiAmazonaws, label: 'AWS' },
	{ icon: SiPython, label: 'Python' },
];

function TechMarquee() {
	return (
		<div className="relative flex overflow-hidden">
			<div className="flex animate-tech-marquee items-center gap-5">
				{[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
					<span
						key={`${tech.label}-${i}`}
						className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground"
					>
						<tech.icon className="size-4" aria-hidden="true" />
						{tech.label}
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
