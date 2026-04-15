'use client';

import Image from 'next/image';
import { ArrowRight, FileDown } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { PORTFOLIO_SECTIONS } from '@/components/public/portfolio-sections';
import { cn } from '@/lib/utils';
import type { Settings } from '@/lib/types';

interface InfoGridItemContentProps {
	infoAboutMe: Omit<Settings, 'id' | 'updatedAt'>;
}

export function InfoGridItemContent({ infoAboutMe }: InfoGridItemContentProps) {
	const [, setSection] = useQueryState('section', parseAsStringLiteral(PORTFOLIO_SECTIONS));

	const isEmployed = infoAboutMe.isEmployed ?? false;

	return (
		<div className="group/card flex size-full items-start gap-5 px-6 py-5">
			{/* Profile image with status indicator */}
			<div className="relative shrink-0">
				<Image
					src="/cv_pic.png"
					width={260}
					height={260}
					alt="Gonzalo Pozo, Full Stack Developer"
					className="size-[130px] rounded-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.03]"
					priority
				/>

				{/* Status badge — reveals label on card hover via CSS */}
				<div className="absolute right-0 -bottom-1">
					<div
						className={cn(
							'border-card bg-secondary flex items-center gap-0 rounded-full border-[3px] px-0 py-0 transition-all duration-300 ease-out',
							'group-hover/card:gap-1.5 group-hover/card:px-2.5 group-hover/card:py-0.5',
						)}
					>
						<span className="relative flex size-3 shrink-0">
							<span
								className={cn(
									'absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping',
									isEmployed ? 'bg-status-active' : 'bg-accent',
								)}
							/>
							<span
								className={cn(
									'relative inline-flex size-3 rounded-full',
									isEmployed ? 'bg-status-active' : 'bg-accent',
								)}
							/>
						</span>
						<span
							className="text-secondary-foreground max-w-0 overflow-hidden text-xs font-medium whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover/card:max-w-32 group-hover/card:opacity-100"
							role="status"
						>
							{isEmployed ? 'Working' : 'Open to Work'}
						</span>
					</div>
				</div>
			</div>

			{/* Content area */}
			<div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
				{/* CV download button — top right */}
				<div className="flex justify-end">
					{infoAboutMe.resumeUrl && (
						<a
							href={infoAboutMe.resumeUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200 ease-out"
							aria-label="Download CV"
						>
							<FileDown className="size-3.5" aria-hidden="true" />
							<span>CV</span>
						</a>
					)}
				</div>

				{/* Intro text with highlighted name */}
				<div className="flex flex-col gap-1.5">
					<p className="text-sm leading-relaxed text-pretty">
						Hey, I&apos;m{' '}
						<span className="text-primary text-base font-bold tracking-tight">
							Gonzalo
						</span>
						, a passionate full stack developer crafting digital experiences from
						Madrid.
					</p>
					{infoAboutMe.statusMessage && (
						<p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
							{infoAboutMe.statusMessage}
						</p>
					)}
				</div>

				{/* Arrow button — label reveals on card hover via CSS */}
				<div className="flex justify-end">
					<button
						onClick={() => setSection('About me')}
						className="text-muted-foreground hover:text-primary flex items-center gap-2 rounded-full transition-colors duration-200 ease-out"
						aria-label="View more about me"
					>
						<span className="max-w-0 overflow-hidden text-xs font-medium whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover/card:max-w-24 group-hover/card:opacity-100">
							About me
						</span>
						<span className="bg-secondary group-hover/card:bg-primary group-hover/card:text-primary-foreground flex size-7 items-center justify-center rounded-full transition-colors duration-200 ease-out">
							<ArrowRight className="size-3.5" aria-hidden="true" />
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
