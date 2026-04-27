import Image from 'next/image';
import { ArrowUpRight, Code2, Github, type LucideIcon } from 'lucide-react';
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

interface ProjectGridItemContentProps {
	project: ProjectInfo;
	orientation?: 'horizontal' | 'vertical';
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

function formatProjectDate(date: Date) {
	return new Intl.DateTimeFormat('es-ES', {
		month: 'short',
		year: 'numeric',
	}).format(new Date(date));
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
}

function ProjectActionButton({ href, icon: Icon, label, variant }: ProjectActionButtonProps) {
	if (!href) {
		return null;
	}

	return (
		<Button asChild variant={variant} size="sm" className="rounded-full">
			<a href={href} target="_blank" rel="noopener noreferrer">
				<Icon data-icon="inline-start" aria-hidden="true" />
				{label}
			</a>
		</Button>
	);
}

export function ProjectGridItemContent({
	project,
	orientation = 'vertical',
}: ProjectGridItemContentProps) {
	const skills = project.projectSkills.map(({ skill }) => skill);
	const isHorizontal = orientation === 'horizontal';

	return (
		<div
			className={cn('group/project flex h-full min-h-0 flex-col', {
				'md:grid md:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]': isHorizontal,
			})}
		>
			<figure
				className={cn(
					'border-border/60 bg-secondary/40 relative min-h-[13rem] overflow-hidden border-b',
					{
						'aspect-[5/4]': !isHorizontal,
						'md:min-h-0 md:border-r md:border-b-0': isHorizontal,
					},
				)}
			>
				{project.ogImageUrl ? (
					<Image
						src={project.ogImageUrl}
						alt={project.title}
						width={1260}
						height={630}
						className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/project:scale-[1.03]"
						sizes={
							isHorizontal
								? '(max-width: 767px) 100vw, (max-width: 1200px) 42vw, 520px'
								: '(max-width: 767px) 100vw, (max-width: 1200px) 24vw, 280px'
						}
					/>
				) : (
					<div
						className="from-primary/25 via-secondary to-accent/30 flex h-full w-full flex-col justify-between bg-linear-to-br p-6"
						aria-hidden="true"
					>
						<Badge variant="secondary">Vista previa próximamente</Badge>
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm">Proyecto portfolio</p>
							<p className="max-w-[12ch] text-2xl font-semibold tracking-tight">
								{project.title}
							</p>
						</div>
					</div>
				)}
				<div className="from-background/80 via-background/15 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent" />
				<div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-2">
					<Badge variant={isHorizontal ? 'default' : 'secondary'}>
						{isHorizontal ? 'Proyecto destacado' : 'Proyecto seleccionado'}
					</Badge>
					<Badge variant="secondary">
						<Code2 aria-hidden="true" />
						{skills.length} tecnologías
					</Badge>
				</div>
			</figure>
			<div className="flex h-full min-h-0 flex-col py-6">
				<CardHeader className="content-start items-start gap-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant={PROJECT_STATUS_BADGE_VARIANTS[project.status]}
							className="gap-2"
						>
							<StatusIndicator status={project.status} className="shrink-0" />
							{PROJECT_STATUS_LABELS[project.status]}
						</Badge>
						<Badge variant="outline">{getProjectAccessLabel(project)}</Badge>
					</div>
					<div className="space-y-2">
						<CardTitle
							className={cn('tracking-tight text-balance', {
								'text-xl': !isHorizontal,
								'md:text-2xl': isHorizontal,
							})}
						>
							{project.title}
						</CardTitle>
						<CardDescription
							className={cn('leading-6', {
								'line-clamp-4': !isHorizontal,
								'line-clamp-3': isHorizontal,
							})}
						>
							{project.description}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="flex flex-1 flex-col gap-4 pt-2">
					<div className="space-y-3">
						<p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase">
							<Code2 className="text-primary size-4" aria-hidden="true" />
							Stack principal
						</p>
						<SkillsPills skills={skills} limit={isHorizontal ? 6 : 4} />
					</div>
				</CardContent>
				<CardFooter className="border-border/60 mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
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
							variant={isHorizontal ? 'default' : 'outline'}
						/>
						<GridItemShowMoreButton variant="project" />
					</div>
				</CardFooter>
			</div>
		</div>
	);
}
