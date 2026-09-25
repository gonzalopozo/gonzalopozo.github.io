import type { CSSProperties } from 'react';
import { DynamicIcon } from '@/components/public/dynamic-icon';
import { GridItemShowMoreButton } from '@/components/public/grid-item-show-more-button';
import type { getPublicUsedSkills } from '@/lib/queries/skills';
import { cn } from '@/lib/utils';

type UsedSkill = Awaited<ReturnType<typeof getPublicUsedSkills>>[number];

function TechMarquee({ skills }: { skills: UsedSkill[] }) {
	if (skills.length === 0) return null;
	const visibleLoop = Array.from(
		{ length: Math.max(1, Math.ceil(10 / skills.length)) },
		() => skills,
	).flat();

	return (
		<div className="relative flex overflow-hidden" aria-hidden="true">
			<div
				className="flex w-max animate-tech-marquee items-center gap-6 motion-reduce:animate-none"
				style={{ animationDuration: `${Math.max(8, visibleLoop.length * 0.8)}s` }}
			>
				{[...visibleLoop, ...visibleLoop].map((skill, index) => {
					const hasColor =
						skill.useColor && /^#[0-9a-f]{6}$/i.test(skill.customColor ?? '');
					return (
						<span
							key={`${skill.id}-${index}`}
							className="flex shrink-0 items-center text-muted-foreground"
							style={
								{
									'--icon-delay': `${Math.min(index % visibleLoop.length, 10) * 35}ms`,
								} as CSSProperties
							}
						>
							<DynamicIcon
								iconFullName={skill.icon}
								useColor={skill.useColor}
								customColor={skill.customColor}
								className={
									hasColor
										? 'size-7 group-hover/grid-item:text-(--icon-color) motion-safe:transition-colors motion-safe:delay-(--icon-delay) motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]'
										: 'size-7'
								}
							/>
						</span>
					);
				})}
			</div>
		</div>
	);
}

export function ExperienceOverviewGridItemContent({ skills }: { skills: UsedSkill[] }) {
	return (
		<div
			className={cn(
				'group/experience grid size-full min-h-0 items-center gap-3 overflow-hidden px-6 py-5',
				skills.length ? 'grid-rows-[1fr_auto_auto]' : 'grid-rows-[1fr_auto]',
			)}
		>
			<div className="flex flex-col gap-1.5">
				<p className="text-2xl/tight font-bold tracking-tight text-balance">
					Full Stack Developer
				</p>
				<p className="text-sm/relaxed text-muted-foreground">
					Building modern web applications with cutting-edge technologies and thoughtful
					interfaces.
				</p>
			</div>

			<TechMarquee skills={skills} />

			<GridItemShowMoreButton
				variant="experience"
				label="View experience"
				className="h-9 w-fit rounded-full px-4"
			/>
		</div>
	);
}
