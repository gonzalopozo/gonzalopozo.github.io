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
		<div className="group/experience relative grid size-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden px-5 py-4">
			<ExperienceBackground />

			<CardHeader className="relative z-10 gap-2 p-0">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<CompanyMark company={experience.company} logoUrl={logoUrl} />
						<div className="flex min-w-0 flex-col gap-1">
							<Badge variant={isCurrent ? 'default' : 'secondary'} className="w-fit gap-1.5">
								<span
									className={cn(
										'size-1.5 rounded-full',
										isCurrent ? 'bg-primary-foreground' : 'bg-muted-foreground',
									)}
									aria-hidden="true"
								/>
								{isCurrent ? 'Current role' : 'Experience'}
							</Badge>
							<CardTitle className="line-clamp-2 text-lg/tight text-balance">
								{experience.role}
							</CardTitle>
						</div>
					</div>
					<span className="shrink-0 pt-1 font-mono text-[10px] text-muted-foreground">
						career
					</span>
				</div>

				{experience.companyUrl ? (
					<a
						href={experience.companyUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="relative z-10 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full text-sm font-medium text-primary transition-colors outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
					>
						<span className="truncate">{experience.company}</span>
						<ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
					</a>
				) : (
					<p className="relative z-10 truncate text-sm font-medium text-primary">
						{experience.company}
					</p>
				)}
			</CardHeader>

			<CardContent className="relative z-10 flex min-h-0 flex-col gap-2 overflow-hidden p-0">
				<div className="flex min-w-0 flex-wrap gap-2 overflow-hidden">
					<ExperienceMeta icon={CalendarRange}>{dateRange}</ExperienceMeta>
					{experience.location ? (
						<ExperienceMeta icon={MapPin}>{experience.location}</ExperienceMeta>
					) : null}
				</div>

				<CardDescription className="line-clamp-2 text-sm/relaxed">
					{experience.description}
				</CardDescription>
			</CardContent>

			<CardFooter className="relative z-10 flex items-center justify-between gap-3 p-0">
				{skills.length ? (
					<SkillsPills
						skills={skills}
						limit={3}
						className="gap-1.5 overflow-hidden"
					/>
				) : (
					<span />
				)}
				<GridItemShowMoreButton
					variant="experience"
					label="View experience"
					buttonSize="sm"
					className="h-9 shrink-0 rounded-full px-4"
				/>
			</CardFooter>
		</div>
	);
}
