import Image from 'next/image';
import { ArrowUpRight, Code2, Github, type LucideIcon } from 'lucide-react';
import { GridItemShowMoreButton } from '@/components/public/grid-item';
import { SkillIcon } from '@/components/public/skill-icon';
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

export type ProjectCardLayout = 'default' | 'vertical-tall';

interface ProjectGridItemContentProps {
	project: ProjectInfo;
	layout?: ProjectCardLayout;
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

function formatProjectDate(date: Date, format: 'summary' | 'full' = 'summary') {
	const dateFormat: Intl.DateTimeFormatOptions =
		format === 'full'
			? { day: '2-digit', month: '2-digit', year: 'numeric' }
			: { month: 'short', year: 'numeric' };

	return new Intl.DateTimeFormat('es-ES', dateFormat).format(new Date(date));
}

function getProjectAccessLabel(project: ProjectInfo) {
	if (project.url) return 'Disponible online';
	if (project.repoUrl) return 'Código público';
	return 'Vista privada';
}

interface ProjectActionButtonProps {
	href: string | null;
	icon: LucideIcon;
	label: string;
	variant: 'default' | 'ghost' | 'outline' | 'secondary';
	className?: string;
	iconOnly?: boolean;
}

function ProjectActionButton({
	href,
	icon: Icon,
	label,
	variant,
	className,
	iconOnly,
}: ProjectActionButtonProps) {
	if (!href) return null;

	return (
		<Button asChild variant={variant} size="sm" className={cn('rounded-full', className)}>
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

function DefaultProjectGridItemContent({ project }: ProjectGridItemContentProps) {
	const skills = project.projectSkills.map(({ skill }) => skill);

	return (
		<div className="group/project relative flex h-full min-h-0 flex-col [@container_project-card_(min-width:380px)_and_(min-height:280px)]:grid [@container_project-card_(min-width:380px)_and_(min-height:280px)]:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
			<figure className="border-border/60 bg-secondary/40 relative aspect-5/4 min-h-52 overflow-hidden border-b [@container_project-card_(max-height:159px)]:hidden [@container_project-card_(min-width:380px)_and_(min-height:280px)]:aspect-auto [@container_project-card_(min-width:380px)_and_(min-height:280px)]:min-h-0 [@container_project-card_(min-width:380px)_and_(min-height:280px)]:border-r [@container_project-card_(min-width:380px)_and_(min-height:280px)]:border-b-transparent">
				{project.ogImageUrl ? (
					<Image
						src={project.ogImageUrl}
						alt={project.title}
						width={1260}
						height={630}
						className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/project:scale-[1.03]"
						sizes="(max-width: 767px) 100vw, (max-width: 1200px) 40vw, 500px"
					/>
				) : (
					<div
						className="from-primary/25 via-secondary to-accent/30 relative flex h-full w-full flex-col justify-end bg-linear-to-br p-6"
						aria-hidden="true"
					>
						<div className="absolute inset-0 overflow-hidden">
							<div className="animate-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent" />
						</div>
						<p className="relative max-w-[12ch] text-2xl font-semibold tracking-tight">
							{project.title}
						</p>
					</div>
				)}
				<div className="from-background/60 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent to-transparent" />
			</figure>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-primary)_12%,transparent),color-mix(in_oklch,var(--color-accent)_8%,transparent))] [@container_project-card_(max-height:159px)]:block"
			/>

			<div className="relative z-1 flex h-full min-h-0 flex-col px-6 py-5 [@container_project-card_(max-height:159px)]:py-3">
				<div className="flex flex-1 flex-col content-start items-start gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant={PROJECT_STATUS_BADGE_VARIANTS[project.status]}
							className="gap-2"
						>
							<StatusIndicator status={project.status} className="shrink-0" />
							<span className="[@container_project-card_(max-height:159px)]:hidden">
								{PROJECT_STATUS_LABELS[project.status]}
							</span>
						</Badge>
						<Badge
							variant="outline"
							className="[@container_project-card_(max-height:279px)]:hidden"
						>
							{getProjectAccessLabel(project)}
						</Badge>
					</div>
					<div className="w-full space-y-1.5">
						<CardTitle className="text-xl tracking-tight text-balance">
							{project.title}
						</CardTitle>
						<CardDescription className="line-clamp-4 leading-6 [@container_project-card_(max-height:159px)]:hidden [@container_project-card_(max-height:279px)]:line-clamp-2">
							{project.description}
						</CardDescription>
					</div>
				</div>

				<div className="mt-4 flex flex-col gap-3 [@container_project-card_(max-height:159px)]:hidden">
					<p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase [@container_project-card_(max-height:279px)]:hidden">
						<Code2 className="text-primary size-4" aria-hidden="true" />
						Stack principal
					</p>
					<SkillsPills skills={skills} limit={6} />
				</div>

				<div className="mt-auto hidden items-center gap-1.5 [@container_project-card_(max-height:159px)]:flex">
					{skills.slice(0, 2).map(({ id, name, icon }) => (
						<Badge
							variant="secondary"
							key={`${id}-${name}`}
							className="gap-1.5 text-xs"
						>
							{icon ? <SkillIcon iconFullName={icon} /> : null}
							{name}
						</Badge>
					))}
					{skills.length > 2 ? (
						<Badge variant="secondary" className="font-mono text-xs">
							+{skills.length - 2}
						</Badge>
					) : null}
					{project.url ? (
						<a
							href={project.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-primary ml-auto transition-colors"
							aria-label="Ver proyecto"
						>
							<ArrowUpRight className="size-4" aria-hidden="true" />
						</a>
					) : null}
				</div>

				<div className="border-border/60 mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4 [@container_project-card_(max-height:279px)]:hidden">
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
							Última actualización
						</span>
						<span className="text-sm font-medium">
							{formatProjectDate(project.updatedAt)}
						</span>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<ProjectActionButton
							href={project.repoUrl}
							icon={Github}
							label="Código"
							variant="ghost"
						/>
						<ProjectActionButton
							href={project.url}
							icon={ArrowUpRight}
							label="Ver proyecto"
							variant="default"
						/>
						<GridItemShowMoreButton variant="project" />
					</div>
				</div>
			</div>
		</div>
	);
}

function TallProjectGridItemContent({ project }: ProjectGridItemContentProps) {
	const skills = project.projectSkills.map(({ skill }) => skill);
	const actionCount = Number(Boolean(project.repoUrl)) + Number(Boolean(project.url));

	return (
		<div className="group/project flex h-full min-h-0 flex-col">
			<figure className="border-border/60 bg-secondary/40 relative aspect-video min-h-36 overflow-hidden border-b [@container_project-card_(max-height:340px)]:min-h-22 [@container_project-card_(max-height:440px)_and_(min-height:341px)]:min-h-28">
				{project.ogImageUrl ? (
					<Image
						src={project.ogImageUrl}
						alt={project.title}
						width={1260}
						height={630}
						className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/project:scale-[1.03]"
						sizes="(max-width: 767px) 100vw, (max-width: 1200px) 38vw, 520px"
					/>
				) : (
					<div
						className="from-primary/25 via-secondary to-accent/30 relative flex h-full w-full flex-col justify-end bg-linear-to-br p-6"
						aria-hidden="true"
					>
						<div className="absolute inset-0 overflow-hidden">
							<div className="animate-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent" />
						</div>
						<p className="relative max-w-[12ch] text-2xl font-semibold tracking-tight">
							{project.title}
						</p>
					</div>
				)}
				<div className="from-background/72 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent to-transparent" />
			</figure>

			<div className="flex h-full min-h-0 flex-col px-6 py-6 sm:px-7 [@container_project-card_(max-height:340px)]:gap-2 [@container_project-card_(max-width:360px)]:px-3.5 [@container_project-card_(max-width:360px)]:py-3.5">
				<div className="flex flex-1 flex-col gap-5">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-start gap-2">
							<Badge
								variant={PROJECT_STATUS_BADGE_VARIANTS[project.status]}
								className="gap-2"
							>
								<StatusIndicator status={project.status} className="shrink-0" />
								{PROJECT_STATUS_LABELS[project.status]}
							</Badge>
						</div>

						<CardTitle className="text-lg leading-tight tracking-tight text-balance sm:text-xl [@container_project-card_(max-width:360px)]:text-[1.0625rem]">
							{project.title}
						</CardTitle>

						<CardDescription className="line-clamp-3 text-sm leading-relaxed [@container_project-card_(max-height:340px)]:line-clamp-1 [@container_project-card_(max-height:440px)_and_(min-height:341px)]:line-clamp-2">
							{project.description}
						</CardDescription>
					</div>

					{skills.length ? (
						<SkillsPills
							skills={skills}
							limit={4}
							className="gap-3 [@container_project-card_(max-width:360px)]:gap-1.5"
						/>
					) : null}

					<p className="text-muted-foreground text-xs">
						Actualizado en:{' '}
						<span className="text-foreground font-medium">
							{formatProjectDate(project.updatedAt, 'full')}
						</span>
					</p>
				</div>

				<div className="mt-auto flex flex-col gap-2 pt-5">
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
			</div>
		</div>
	);
}

export function ProjectGridItemContent({
	project,
	layout = 'default',
}: ProjectGridItemContentProps) {
	if (layout === 'vertical-tall') {
		return <TallProjectGridItemContent project={project} layout={layout} />;
	}

	return <DefaultProjectGridItemContent project={project} layout={layout} />;
}
