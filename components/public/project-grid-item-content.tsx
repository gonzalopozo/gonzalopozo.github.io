import Image from 'next/image';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
// TODO: card action view transitions for more info
// import { CardAction } from "@/components/ui/card"
// import { ArrowBigDownDashIcon } from "lucide-react";
import { GridItemShowMoreButton } from '@/components/public/grid-item';
import { SkillsPills } from '@/components/public/skills-pills';
import { StatusIndicator } from '@/components/public/status-indicator';
import { cn } from '@/lib/utils';
import type { ProjectInfo } from '@/lib/types';

interface ProjectGridItemContentProps {
	project: ProjectInfo;
}

export function ProjectGridItemContent({ project }: ProjectGridItemContentProps) {
	const skills = project.projectSkills.map(({ skill }) => skill);

	return (
		<>
			<figure className="relative min-h-0 overflow-hidden">
				{project.ogImageUrl ? (
					<Image
						src={project.ogImageUrl}
						alt={project.title}
						width={1260}
						height={630}
						className="h-full w-full object-cover"
						sizes="(max-width: 768px) 100vw, 50vw"
					/>
				) : (
					<div
						className="from-primary/40 via-secondary to-accent/45 dark:from-primary/55 dark:via-card dark:to-accent/40 aspect-1200/630 w-full bg-linear-to-br"
						aria-hidden="true"
					/>
				)}
			</figure>
			<CardHeader className="content-start items-start">
				<CardTitle className="flex items-center justify-between gap-3">
					{project.title}
					<StatusIndicator status={project.status} />
				</CardTitle>
				<CardDescription>{project.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0 space-y-2">
						<p className="text-muted-foreground text-sm">Proyecto desarrollado con</p>
						<SkillsPills skills={skills} />
					</div>
					<div className="flex shrink-0 items-center gap-4">
						{project.repoUrl && (
							<a
								href={project.repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-primary transition-colors"
								aria-label="View repository on GitHub"
							>
								<FaGithub className="size-5" aria-hidden="true" />
							</a>
						)}
						{project.url && (
							<a
								href={project.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-primary transition-colors"
								aria-label="View live project"
							>
								<FaExternalLinkAlt className="size-4" aria-hidden="true" />
							</a>
						)}
					</div>
				</div>
				<p>
					Estado:{' '}
					<span
						className={cn(
							'font-bold',
							project.status === 'active' && 'text-status-active',
							project.status === 'archived' && 'text-status-archived',
							project.status === 'in-progress' && 'text-status-in-progress',
						)}
					>
						{project.status}
					</span>
				</p>
			</CardContent>
			<CardFooter className="flex flex-col items-start gap-3">
				<span>
					Creado el {project.createdAt.getDate()}/{project.createdAt.getMonth() + 1}/
					{project.createdAt.getFullYear()}
				</span>
				<GridItemShowMoreButton variant="project" />
			</CardFooter>
		</>
	);
}
