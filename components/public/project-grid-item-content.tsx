import Image from 'next/image';
import { ArrowUpRight, Github, type LucideIcon } from 'lucide-react';
import { GridItemShowMoreButton } from '@/components/public/grid-item';
import { SkillsPills } from '@/components/public/skills-pills';
import { StatusIndicator } from '@/components/public/status-indicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProjectInfo, ProjectStatus } from '@/lib/types';

type ProjectGridItemContentVariant = 'vertical' | 'horizontal';

interface ProjectGridItemContentProps {
	project: ProjectInfo;
	variant?: ProjectGridItemContentVariant;
}

interface ProjectMediaProps {
	project: ProjectInfo;
	className?: string;
	sizes: string;
}

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
	active: 'Activo',
	archived: 'Archivado',
	'in-progress': 'En progreso',
};

const PROJECT_STATUS_BADGE_VARIANTS: Record<ProjectStatus, 'default' | 'secondary' | 'outline'> = {
	active: 'default',
	archived: 'outline',
	'in-progress': 'secondary',
};

const PROJECT_DATE_FORMATTERS: Record<'summary' | 'full', Intl.DateTimeFormat> = {
	summary: new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }),
	full: new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}),
};

function formatProjectDate(date: Date, format: 'summary' | 'full' = 'summary') {
	return PROJECT_DATE_FORMATTERS[format].format(new Date(date));
}

function ProjectMedia({ project, className, sizes }: ProjectMediaProps) {
	return (
		<figure className={className}>
			{project.ogImageUrl ? (
				<Image
					src={project.ogImageUrl}
					alt={project.title}
					width={1260}
					height={630}
					className="size-full object-cover transition-transform duration-500 ease-out group-hover/project:scale-[1.03]"
					sizes={sizes}
				/>
			) : (
				<div
					className="relative flex size-full flex-col justify-end bg-linear-to-br from-primary/25 via-secondary to-accent/30 p-6"
					aria-hidden="true"
				>
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
					</div>
					<p className="relative max-w-[12ch] text-2xl font-semibold tracking-tight">
						{project.title}
					</p>
				</div>
			)}
		</figure>
	);
}

interface ProjectActionButtonProps {
	href: string | null;
	icon: LucideIcon;
	label: string;
	size?: 'sm' | 'icon';
	variant: 'default' | 'ghost' | 'outline' | 'secondary';
	className?: string;
	iconOnly?: boolean;
}

function ProjectActionButton({
	href,
	icon: Icon,
	label,
	size = 'sm',
	variant,
	className,
	iconOnly,
}: ProjectActionButtonProps) {
	if (!href) return null;

	return (
		<Button asChild variant={variant} size={size} className={cn('rounded-2xl', className)}>
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={iconOnly ? label : undefined}
			>
				<Icon data-icon="inline-start" aria-hidden="true" />
				{iconOnly ? <span className="sr-only">{label}</span> : label}
			</a>
		</Button>
	);
}

const horizontalActionTileClassName =
	'h-full min-h-11 w-full rounded-2xl border border-border/60 bg-secondary/35 px-0 text-muted-foreground shadow-none hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]';

interface ProjectGridItemContentVariantProps {
	project: ProjectInfo;
	skills: ProjectInfo['projectSkills'][number]['skill'][];
	actionCount: number;
}

function ProjectGridItemVerticalContent({
	project,
	skills,
	actionCount,
}: ProjectGridItemContentVariantProps) {
	return (
		<div className="group/project grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-6 [@container_project-card_(max-width:360px)]:gap-3.5">
			<CardHeader className="gap-0 pb-0">
				<ProjectMedia
					project={project}
					sizes="(max-width: 767px) 100vw, (max-width: 1200px) 38vw, 520px"
					className="relative -mx-6 aspect-video min-h-36 overflow-hidden border-b border-border/60 bg-secondary/40 [@container_project-card_(max-height:340px)]:min-h-22 [@container_project-card_(max-height:440px)_and_(min-height:341px)]:min-h-28"
				/>
			</CardHeader>

			<CardContent className="flex min-h-0 flex-col overflow-hidden sm:px-7 [@container_project-card_(max-width:360px)]:px-3.5">
				<div className="flex min-h-0 flex-1 flex-col justify-between gap-3 overflow-hidden [@container_project-card_(min-width:361px)_and_(max-width:767px)]:gap-2">
					<div className="flex shrink-0 flex-col gap-1.5">
						<div className="flex items-start gap-2">
							<Badge
								variant={PROJECT_STATUS_BADGE_VARIANTS[project.status]}
								className="gap-2"
							>
								<StatusIndicator status={project.status} className="shrink-0" />
								{PROJECT_STATUS_LABELS[project.status]}
							</Badge>
						</div>

						<CardTitle className="text-lg/tight tracking-tight text-balance sm:text-xl [@container_project-card_(max-width:360px)]:text-[1.0625rem]">
							{project.title}
						</CardTitle>

						<CardDescription className="line-clamp-5 h-[5lh] shrink-0 text-sm/relaxed [@container_project-card_(max-height:340px)]:line-clamp-2 [@container_project-card_(max-height:340px)]:h-[2lh] [@container_project-card_(max-height:440px)_and_(min-height:341px)]:line-clamp-3 [@container_project-card_(max-height:440px)_and_(min-height:341px)]:h-[3lh] [@container_project-card_(min-width:361px)_and_(max-width:767px)]:line-clamp-2 [@container_project-card_(min-width:361px)_and_(max-width:767px)]:h-[2lh]">
							{project.description}
						</CardDescription>
					</div>

					{skills.length ? (
						<SkillsPills
							skills={skills}
							limit={6}
							className="shrink-0 gap-3 [@container_project-card_(max-width:360px)]:gap-1.5"
						/>
					) : null}

					<p className="shrink-0 text-xs text-muted-foreground">
						Actualizado en:{' '}
						<span className="font-medium text-foreground">
							{formatProjectDate(project.updatedAt, 'full')}
						</span>
					</p>
				</div>
			</CardContent>

			<CardFooter className="pb-5 sm:px-7 [@container_project-card_(max-width:360px)]:px-3.5 [@container_project-card_(max-width:360px)]:pb-4">
				<div className="flex w-full flex-col gap-2">
					{actionCount ? (
						<div
							className={cn('grid gap-2', {
								'grid-cols-1': actionCount === 1,
								'grid-cols-2': actionCount === 2,
							})}
						>
							<ProjectActionButton
								href={project.repoUrl}
								icon={Github}
								label="Ver repositorio"
								variant="outline"
								iconOnly
								className="h-10 w-full justify-center"
							/>
							<ProjectActionButton
								href={project.url}
								icon={ArrowUpRight}
								label="Abrir proyecto"
								variant="outline"
								iconOnly
								className="h-10 w-full justify-center"
							/>
						</div>
					) : null}

					<GridItemShowMoreButton
						variant="project"
						label="View more"
						className="h-10 w-full justify-center rounded-full"
					/>
				</div>
			</CardFooter>
		</div>
	);
}

function ProjectGridItemHorizontalContent({ project, skills }: ProjectGridItemContentVariantProps) {
	return (
		<div className="group/project grid h-full min-h-0 grid-cols-[minmax(12rem,0.78fr)_minmax(0,1.22fr)] [@container_project-card_(max-width:480px)]:grid-cols-1 [@container_project-card_(max-width:480px)]:grid-rows-[minmax(6rem,0.75fr)_minmax(0,1fr)]">
			<ProjectMedia
				project={project}
				sizes="(max-width: 767px) 100vw, (max-width: 1200px) 22vw, 260px"
				className="relative min-h-0 overflow-hidden border-r border-border/60 bg-secondary/40 [@container_project-card_(max-width:480px)]:border-r-0 [@container_project-card_(max-width:480px)]:border-b"
			/>

			<CardContent className="grid min-h-0 grid-cols-[minmax(0,1fr)_3.5rem] gap-3 overflow-hidden py-4 pr-4 [@container_project-card_(max-width:480px)]:grid-cols-1 [@container_project-card_(max-width:480px)]:grid-rows-[minmax(0,1fr)_auto] [@container_project-card_(max-width:480px)]:gap-2.5 [@container_project-card_(max-width:480px)]:py-3.5 [@container_project-card_(max-width:480px)]:pr-3.5">
				<div className="flex min-h-0 flex-col gap-2 overflow-hidden">
					<Badge
						variant={PROJECT_STATUS_BADGE_VARIANTS[project.status]}
						className="w-fit shrink-0 gap-2"
					>
						<StatusIndicator status={project.status} className="shrink-0" />
						{PROJECT_STATUS_LABELS[project.status]}
					</Badge>

					<CardTitle className="line-clamp-2 shrink-0 text-base/tight tracking-tight text-balance [@container_project-card_(max-width:360px)]:text-[0.9375rem]">
						{project.title}
					</CardTitle>

					<CardDescription className="flex-1 text-xs/relaxed">
						{project.description}
					</CardDescription>

					{skills.length ? (
						<SkillsPills
							skills={skills}
							limit={4}
							className="shrink-0 gap-1.5 overflow-hidden [@container_project-card_(max-width:360px)]:hidden"
						/>
					) : null}

					<p className="mt-auto shrink-0 truncate text-xs text-muted-foreground">
						Actualizado en:{' '}
						<span className="font-medium text-foreground">
							{formatProjectDate(project.updatedAt, 'full')}
						</span>
					</p>
				</div>

				<CardFooter className="grid min-h-0 w-full auto-rows-fr grid-cols-1 gap-1.5 p-0 [@container_project-card_(max-width:480px)]:auto-cols-fr [@container_project-card_(max-width:480px)]:grid-flow-col [@container_project-card_(max-width:480px)]:grid-rows-1">
					<ProjectActionButton
						href={project.repoUrl}
						icon={Github}
						label="Ver repositorio"
						size="icon"
						variant="ghost"
						iconOnly
						className={horizontalActionTileClassName}
					/>
					<ProjectActionButton
						href={project.url}
						icon={ArrowUpRight}
						label="Abrir proyecto"
						size="icon"
						variant="ghost"
						iconOnly
						className={horizontalActionTileClassName}
					/>

					<GridItemShowMoreButton
						variant="project"
						buttonSize="icon"
						buttonVariant="ghost"
						icon="arrow-right"
						iconOnly
						label="View more"
						className={horizontalActionTileClassName}
					/>
				</CardFooter>
			</CardContent>
		</div>
	);
}

export function ProjectGridItemContent({
	project,
	variant = 'vertical',
}: ProjectGridItemContentProps) {
	const skills = project.projectSkills.map(({ skill }) => skill);
	const actionCount = Number(Boolean(project.repoUrl)) + Number(Boolean(project.url));

	if (variant === 'horizontal') {
		return (
			<ProjectGridItemHorizontalContent
				project={project}
				skills={skills}
				actionCount={actionCount}
			/>
		);
	}

	return (
		<ProjectGridItemVerticalContent
			project={project}
			skills={skills}
			actionCount={actionCount}
		/>
	);
}
