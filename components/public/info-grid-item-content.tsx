'use client';

import Image from 'next/image';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { PORTFOLIO_SECTIONS } from '@/components/public/portfolio-sections';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Settings } from '@/lib/types';

interface InfoGridItemContentProps {
	infoAboutMe: Omit<Settings, 'id' | 'updatedAt'>;
}

export function InfoGridItemContent({ infoAboutMe }: InfoGridItemContentProps) {
	const [, setSection] = useQueryState('section', parseAsStringLiteral(PORTFOLIO_SECTIONS));

	const isEmployed = infoAboutMe.isEmployed ?? false;
	const statusLabel =
		infoAboutMe.statusMessage?.trim() || (isEmployed ? 'Working' : 'Open to Work');

	return (
		<div className="group/card relative grid size-full min-h-0 min-w-0 grid-rows-[minmax(7.5rem,0.75fr)_minmax(0,1.25fr)] overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:grid-rows-1">
			<div className="relative flex min-h-0 min-w-0 items-center justify-center border-b border-border p-3 md:border-r md:border-b-0 md:p-5">
				<div className="relative h-full w-[min(72%,18rem)] overflow-hidden rounded-2xl bg-muted shadow-inner md:aspect-3/4 md:w-auto md:max-w-70">
					<Image
						src="/cv_pic.png"
						width={400}
						height={533}
						alt="Gonzalo Pozo, Full Stack Developer"
						className="size-full object-cover grayscale motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out md:group-hover/card:scale-105 md:group-hover/card:grayscale-0"
						priority
					/>

					<div className="absolute inset-x-0 bottom-0 flex min-w-0 translate-y-0 items-center gap-2 border-t border-border bg-card/90 px-3 py-2 backdrop-blur-md md:translate-y-full md:group-focus-within/card:translate-y-0 md:group-hover/card:translate-y-0 md:motion-safe:transition-transform md:motion-safe:duration-300">
						<span className="relative flex size-2.5 shrink-0">
							<span
								className={cn(
									'absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping',
									isEmployed ? 'bg-status-active' : 'bg-accent',
								)}
							/>
							<span
								className={cn(
									'relative inline-flex size-2.5 rounded-full',
									isEmployed ? 'bg-status-active' : 'bg-accent',
								)}
							/>
						</span>
						<span className="min-w-0 truncate text-xs font-semibold tracking-wide text-foreground uppercase">
							{statusLabel}
						</span>
					</div>
				</div>
			</div>

			<div className="relative grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-4 md:p-5">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<span className="min-w-0 truncate text-xs font-bold tracking-wide text-primary uppercase">
						Full Stack Developer
					</span>

					{infoAboutMe.resumeUrl && (
						<a
							href={infoAboutMe.resumeUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-semibold tracking-wide text-muted-foreground transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
							aria-label="Download CV"
						>
							<span>Download CV</span>
							<ArrowDownToLine aria-hidden="true" className="size-3.5 stroke-[2.5]" />
						</a>
					)}
				</div>

				<div className="flex min-h-0 min-w-0 flex-col justify-center gap-2 overflow-hidden">
					<h1 className="text-xl/tight font-bold tracking-tight text-balance text-foreground md:text-2xl/tight">
						Hey, I&apos;m Gonzalo.
					</h1>

					<p className="line-clamp-3 max-w-md text-sm/relaxed text-pretty text-muted-foreground">
						I love turning ideas into real products people can use. I care about
						thoughtful interfaces, solid backend foundations, and the kind of curious,
						collaborative work that keeps improving the product, the code, and the
						people building it.
					</p>
				</div>

				<div className="flex min-w-0 justify-end">
					<Button
						onClick={() => setSection('About me')}
						type="button"
						size="lg"
						className="group/cta min-h-11 rounded-full shadow-sm shadow-primary/15 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0"
					>
						About Me
						<ArrowRight
							data-icon="inline-end"
							aria-hidden="true"
							className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/cta:translate-x-0.5"
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}
