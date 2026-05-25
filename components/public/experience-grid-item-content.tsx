import Image from 'next/image';
import {
	ArrowUpRight,
	BriefcaseBusiness,
	CalendarRange,
	MapPin,
	type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { GridItemShowMoreButton } from '@/components/public/grid-item';
import { SkillsPills } from '@/components/public/skills-pills';
import { cn } from '@/lib/utils';
import type { ExperienceData } from '@/lib/types';

interface ExperienceGridItemContentProps {
	experience: ExperienceData | null | undefined;
}

interface ExperienceMetaProps {
	icon: LucideIcon;
	children: string;
}

const EXPERIENCE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	year: 'numeric',
});

function formatExperienceDate(date: Date) {
	return EXPERIENCE_DATE_FORMATTER.format(new Date(date));
}

function formatExperienceRange(startDate: Date | null, endDate: Date | null) {
	if (!startDate && !endDate) return 'Timeline pending';

	const startLabel = startDate ? formatExperienceDate(startDate) : 'Start pending';
	const endLabel = endDate ? formatExperienceDate(endDate) : 'Present';

	return `${startLabel} - ${endLabel}`;
}

function getCompanyInitials(company: string) {
	const initials = company
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');

	return initials || '?';
}

function getSafeCompanyLogoUrl(companyLogo: string | null) {
	const logo = companyLogo?.trim();
	if (!logo) return null;
	if (logo.startsWith('/')) return logo;

	const blobHostname = process.env.BLOB_PUBLIC_HOSTNAME?.replace(/\/$/, '');
	if (!blobHostname) return null;

	return logo.startsWith(`${blobHostname}/`) ? logo : null;
}

function ExperienceMeta({ children, icon: Icon }: ExperienceMetaProps) {
	return (
		<span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-secondary/65 px-2.5 py-1 text-xs text-muted-foreground">
			<Icon className="size-3.5 shrink-0" aria-hidden="true" />
			<span className="truncate">{children}</span>
		</span>
	);
}

function CompanyMark({ company, logoUrl }: { company: string; logoUrl: string | null }) {
	return (
		<div
			className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border/70 bg-secondary text-sm font-semibold text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_4%,transparent)]"
			aria-hidden="true"
		>
			{logoUrl ? (
				<Image
					src={logoUrl}
					alt=""
					width={96}
					height={96}
					className="size-full object-cover"
					sizes="48px"
				/>
			) : (
				<span>{getCompanyInitials(company)}</span>
			)}
		</div>
	);
}

function ExperienceBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_38%),linear-gradient(to_bottom_right,color-mix(in_oklch,var(--secondary)_72%,transparent),transparent)]" />
			<div className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(135deg,color-mix(in_oklch,var(--border)_85%,transparent)_0_1px,transparent_1px_12px)] opacity-35" />
		</div>
	);
}

function ExperienceEmptyState() {
	return (
		<div className="group/experience relative grid size-full place-items-center overflow-hidden px-6 py-5">
			<ExperienceBackground />

			<div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
				<div className="flex items-center justify-between gap-3">
					<span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border/70 bg-secondary text-primary">
						<BriefcaseBusiness className="size-5" aria-hidden="true" />
					</span>
					<Badge variant="secondary">Experience</Badge>
				</div>

				<div className="flex flex-col gap-1">
					<p className="text-lg/tight font-semibold text-balance">Experience timeline</p>
					<p className="text-sm text-muted-foreground">Coming soon</p>
				</div>

				<GridItemShowMoreButton
					variant="experience"
					label="View experience"
					className="h-9 w-fit rounded-full px-4"
				/>
			</div>
		</div>
	);
}

export function ExperienceGridItemContent({ experience }: ExperienceGridItemContentProps) {
	if (!experience) return <ExperienceEmptyState />;

	const skills = experience.experienceSkills.map(({ skill }) => skill);
	const isCurrent = !experience.endDate;
	const logoUrl = getSafeCompanyLogoUrl(experience.companyLogo);
	const dateRange = formatExperienceRange(experience.startDate, experience.endDate);

	return (
		<div className="group/experience relative grid size-full min-h-0 grid-cols-[auto_minmax(0,1fr)] overflow-hidden px-5 py-4 [@container_experience-card_(max-width:480px)]:grid-cols-1 [@container_experience-card_(max-width:480px)]:grid-rows-[auto_minmax(0,1fr)] [@container_experience-card_(max-width:480px)]:gap-3 [@container_experience-card_(max-width:480px)]:p-5">
			<ExperienceBackground />

			<div className="relative z-10 flex min-h-0 flex-col items-center gap-3 py-1 [@container_experience-card_(max-width:480px)]:h-12 [@container_experience-card_(max-width:480px)]:flex-row [@container_experience-card_(max-width:480px)]:py-0">
				<CompanyMark company={experience.company} logoUrl={logoUrl} />
				<span className="min-h-0 flex-1 rounded-full bg-linear-to-b from-primary/70 via-border to-transparent [@container_experience-card_(max-width:480px)]:h-px [@container_experience-card_(max-width:480px)]:min-h-px [@container_experience-card_(max-width:480px)]:w-full [@container_experience-card_(max-width:480px)]:bg-linear-to-r" />
				<span
					className={cn(
						'size-2.5 shrink-0 rounded-full',
						isCurrent
							? 'bg-status-active shadow-[0_0_0_6px_color-mix(in_oklch,var(--status-active)_16%,transparent)]'
							: 'bg-status-archived',
					)}
				/>
			</div>

			<div className="relative z-10 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden pl-4 [@container_experience-card_(max-width:480px)]:pl-0">
				<CardHeader className="gap-2 p-0">
					<div className="flex items-center justify-between gap-3">
						<Badge variant={isCurrent ? 'default' : 'secondary'} className="gap-1.5">
							<span
								className={cn(
									'size-1.5 rounded-full',
									isCurrent ? 'bg-primary-foreground' : 'bg-muted-foreground',
								)}
								aria-hidden="true"
							/>
							{isCurrent ? 'Current role' : 'Experience'}
						</Badge>
						<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
							career
						</span>
					</div>

					<div className="flex min-w-0 flex-col gap-1">
						<CardTitle className="line-clamp-2 text-lg/tight text-balance [@container_experience-card_(max-width:480px)]:text-xl/tight">
							{experience.role}
						</CardTitle>

						{experience.companyUrl ? (
							<a
								href={experience.companyUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full text-sm font-medium text-primary transition-colors outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
							>
								<span className="truncate">{experience.company}</span>
								<ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
							</a>
						) : (
							<p className="truncate text-sm font-medium text-primary">
								{experience.company}
							</p>
						)}
					</div>
				</CardHeader>

				<CardContent className="flex min-h-0 flex-col gap-3 overflow-hidden p-0">
					<div className="flex min-w-0 flex-wrap gap-2 overflow-hidden">
						<ExperienceMeta icon={CalendarRange}>{dateRange}</ExperienceMeta>
						{experience.location ? (
							<ExperienceMeta icon={MapPin}>{experience.location}</ExperienceMeta>
						) : null}
					</div>

					<CardDescription className="line-clamp-2 text-sm/relaxed [@container_experience-card_(max-height:250px)]:line-clamp-1 [@container_experience-card_(max-width:480px)]:line-clamp-3">
						{experience.description}
					</CardDescription>

					{skills.length ? (
						<SkillsPills
							skills={skills}
							limit={5}
							className="gap-1.5 overflow-hidden [@container_experience-card_(max-height:250px)]:hidden"
						/>
					) : null}
				</CardContent>

				<CardFooter className="flex items-center justify-between gap-3 p-0">
					<p className="min-w-0 truncate text-xs text-muted-foreground">
						Selected work chapter
					</p>
					<GridItemShowMoreButton
						variant="experience"
						label="View experience"
						buttonSize="sm"
						className="h-9 shrink-0 rounded-full px-4"
					/>
				</CardFooter>
			</div>
		</div>
	);
}
