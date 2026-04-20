'use client';

import Image from 'next/image';
import { ArrowRight, FileDown } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_SECTIONS } from '@/components/public/portfolio-sections';
import { cn } from '@/lib/utils';
import type { Settings } from '@/lib/types';

const STATUS_LABEL_CAP_PX = 80;

interface InfoGridItemContentProps {
	infoAboutMe: Omit<Settings, 'id' | 'updatedAt'>;
}

export function InfoGridItemContent({ infoAboutMe }: InfoGridItemContentProps) {
	const [, setSection] = useQueryState('section', parseAsStringLiteral(PORTFOLIO_SECTIONS));

	const isEmployed = infoAboutMe.isEmployed ?? false;
	const statusLabel =
		infoAboutMe.statusMessage?.trim() || (isEmployed ? 'Working' : 'Open to Work');

	const statusTrackRef = useRef<HTMLSpanElement>(null);
	const [isStatusOverflowing, setIsStatusOverflowing] = useState(false);

	useEffect(() => {
		const el = statusTrackRef.current;
		if (!el) return;
		setIsStatusOverflowing(el.scrollWidth > STATUS_LABEL_CAP_PX);
	}, [statusLabel]);

	return (
		<div className="group/card grid size-full grid-cols-[auto_minmax(0,1fr)] grid-rows-1 items-start gap-5 overflow-hidden px-6 py-5">
			{/* Profile image with status indicator */}
			<div className="relative row-span-full shrink-0 place-self-center">
				<Image
					src="/cv_pic.png"
					width={260}
					height={260}
					alt="Gonzalo Pozo, Full Stack Developer"
					className="size-[130px] rounded-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.03]"
					priority
				/>

				{/* Status badge, reveals label on card hover via CSS */}
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
							className={cn(
								'text-secondary-foreground relative max-w-0 overflow-hidden text-xs font-medium opacity-0 transition-all duration-300 ease-out',
								'group-hover/card:max-w-20 group-hover/card:opacity-100',
								isStatusOverflowing &&
									'[mask-image:linear-gradient(to_right,black_calc(100%-0.75rem),transparent)]',
							)}
							role="status"
						>
							<span
								ref={statusTrackRef}
								className={cn(
									'inline-flex whitespace-nowrap',
									isStatusOverflowing &&
										'motion-safe:group-hover/card:animate-status-marquee',
								)}
							>
								<span className={isStatusOverflowing ? 'pr-8' : undefined}>
									{statusLabel}
								</span>
								{isStatusOverflowing && (
									<span aria-hidden="true" className="pr-8">
										{statusLabel}
									</span>
								)}
							</span>
						</span>
					</div>
				</div>
			</div>

			{/* Content area */}
			<div className="grid min-w-0 grid-rows-[15%_65%_20%] justify-between self-stretch">
				{/* CV download button — top right */}
				<div className="justify-self-end">
					{infoAboutMe.resumeUrl && (
						<a
							href={infoAboutMe.resumeUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ease-out"
							aria-label="Download CV"
						>
							<FileDown className="size-3.5" aria-hidden="true" />
							<span>Download CV</span>
						</a>
					)}
				</div>

				{/* Intro text with highlighted name */}
				<div className="self-center">
					<p className="text-sm leading-relaxed text-pretty">
						Hey, I&apos;m{' '}
						<span className="text-primary text-base font-bold tracking-tight">
							Gonzalo
						</span>
						, a full-stack developer from Madrid who loves turning ideas into real
						products people can use. I care about thoughtful interfaces, solid backend
						foundations, and the kind of curious, collaborative work that keeps
						improving the product, the code, and the people building it.
					</p>
				</div>

				{/* Arrow button, label reveals on card hover via CSS */}
				<div className="flex justify-end">
					<button
						onClick={() => setSection('About me')}
						className="group/cta hover:bg-secondary/60 flex items-center gap-2 rounded-full pl-0 transition-[padding,background-color] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:pl-3"
						aria-label="View more about me"
					>
						<span className="grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:grid-cols-[1fr]">
							<span className="min-w-0 text-xs font-medium whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out group-hover/card:opacity-100">
								About me
							</span>
						</span>
						<span className="bg-secondary group-hover/card:bg-primary group-hover/card:text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-out">
							<ArrowRight
								className="size-3.5 transition-transform duration-300 ease-out"
								aria-hidden="true"
							/>
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
