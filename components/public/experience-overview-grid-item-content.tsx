import type { CSSProperties } from 'react';
import { DynamicIcon } from '@/components/public/dynamic-icon';
import { GridItemShowMoreButton } from '@/components/public/grid-item-show-more-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { getPublicUsedSkills } from '@/lib/queries/skills';
import { cn } from '@/lib/utils';

type UsedSkill = Awaited<ReturnType<typeof getPublicUsedSkills>>[number];

function getSkillWebsiteUrl(value: string | null) {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
	} catch {
		return null;
	}
}

function TechMarquee({ skills }: { skills: UsedSkill[] }) {
	if (skills.length === 0) return null;
	const visibleLoop = Array.from(
		{ length: Math.max(1, Math.ceil(10 / skills.length)) },
		() => skills,
	).flat();

	return (
		<TooltipProvider delayDuration={250} skipDelayDuration={150} disableHoverableContent>
			<div
				data-tech-marquee-viewport
				className="relative flex cursor-default overflow-hidden py-2"
			>
				<div
					data-tech-marquee-track
					className="flex w-max animate-tech-marquee items-center gap-2 motion-reduce:animate-none"
					style={{ animationDuration: `${Math.max(8, visibleLoop.length * 0.8)}s` }}
				>
					{[...visibleLoop, ...visibleLoop].map((skill, index) => {
						const hasColor =
							skill.useColor && /^#[0-9a-f]{6}$/i.test(skill.customColor ?? '');
						const url = getSkillWebsiteUrl(skill.url);
						const linkLabel = `Explore ${skill.name}`;
						const isRepeatedCopy = index >= skills.length;
						const itemClassName =
							'relative flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground';
						const icon = (
							<DynamicIcon
								iconFullName={skill.icon}
								useColor={skill.useColor}
								customColor={skill.customColor}
								className={
									hasColor
										? 'size-7.5 group-hover/grid-item:text-(--icon-color)'
										: 'size-7.5'
								}
							/>
						);
						const style = {
							'--icon-delay': `${Math.min(index % visibleLoop.length, 10) * 35}ms`,
						} as CSSProperties;

						return url ? (
							<Tooltip key={`${skill.id}-${index}`}>
								<TooltipTrigger asChild>
									<a
										data-tech-marquee-item
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={linkLabel}
										aria-hidden={isRepeatedCopy || undefined}
										tabIndex={isRepeatedCopy ? -1 : undefined}
										className={cn(
											itemClassName,
											'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
										)}
										style={style}
									>
										{icon}
									</a>
								</TooltipTrigger>
								<TooltipContent side="top">{linkLabel}</TooltipContent>
							</Tooltip>
						) : (
							<span
								key={`${skill.id}-${index}`}
								data-tech-marquee-item
								className={cn(itemClassName, 'cursor-default')}
								style={style}
							>
								{icon}
							</span>
						);
					})}
				</div>
			</div>
		</TooltipProvider>
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
