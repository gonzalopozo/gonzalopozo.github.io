import { GridItemShowMoreButton } from '@/components/public/grid-item-show-more-button';
import { SkillsPills } from '@/components/public/skills-pills';
import type { ExperienceData } from '@/lib/types';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
});

export function ExperienceGridItemContent({ experience }: { experience: ExperienceData }) {
	const dates = experience.startDate
		? `${dateFormatter.format(experience.startDate)} – ${experience.endDate ? dateFormatter.format(experience.endDate) : 'Present'}`
		: experience.endDate
			? dateFormatter.format(experience.endDate)
			: null;

	return (
		<div className="group/experience flex size-full min-h-0 flex-col gap-3 overflow-hidden px-6 py-5">
			<div
				className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
				tabIndex={0}
				role="region"
				aria-label={`${experience.role} at ${experience.company}`}
			>
				<h2 className="text-2xl/tight font-bold tracking-tight text-balance">
					{experience.role}
				</h2>
				<p className="text-sm font-semibold">
					{experience.companyUrl ? (
						<a
							href={experience.companyUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
						>
							{experience.company}
						</a>
					) : (
						experience.company
					)}
				</p>
				{dates || experience.location ? (
					<p className="text-xs text-muted-foreground">
						{[dates, experience.location].filter(Boolean).join(' · ')}
					</p>
				) : null}
				<p className="text-sm/relaxed whitespace-pre-line text-muted-foreground">
					{experience.description}
				</p>
			</div>
			<SkillsPills skills={experience.experienceSkills.map(({ skill }) => skill)} limit={5} />
			<GridItemShowMoreButton
				variant="experience"
				label="View experience"
				className="h-9 w-fit shrink-0 rounded-full px-4"
			/>
		</div>
	);
}
