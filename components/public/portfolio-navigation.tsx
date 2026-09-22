'use client';

import Image from 'next/image';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Briefcase, History, LayoutGrid, UserRound, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortfolioSection } from '@/components/public/portfolio-sections';
import { cn } from '@/lib/utils';

const sections: { url: string; v: PortfolioSection | null; Icon: LucideIcon }[] = [
	{ url: 'All', v: null, Icon: LayoutGrid },
	{ url: 'About me', v: 'About me', Icon: UserRound },
	{ url: 'Projects', v: 'Projects', Icon: Briefcase },
	{ url: 'Experience', v: 'Experience', Icon: History },
];

interface PortfolioNavigationProps {
	section: PortfolioSection | null;
	onSectionChange: (section: PortfolioSection | null) => void;
}

export function PortfolioNavigation({ section, onSectionChange }: PortfolioNavigationProps) {
	const activeUrl = section ?? 'All';
	const shouldReduceMotion = useReducedMotion();
	const navIndicatorTransition = shouldReduceMotion
		? { duration: 0.01, ease: 'linear' as const }
		: { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.9 };
	const navIndicatorInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 };
	const navIndicatorAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 };
	const navLabelInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 };
	const navLabelAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 };
	const navLabelExit = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 };
	const navLabelTransition = {
		duration: shouldReduceMotion ? 0.01 : 0.16,
		ease: 'easeOut' as const,
	};

	return (
		<nav
			aria-label="Portfolio sections"
			className="mb-12 grid grid-cols-1 items-center justify-items-center gap-4 px-7 pt-7 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
		>
			<Image
				alt="Gonzalo Pozo"
				className="h-auto w-[clamp(10rem,20vw,15rem)] shrink-0 md:justify-self-start"
				height={682}
				priority
				src="/gonzalopozo-logo.png"
				width={2048}
			/>

			<ul className="flex h-10 max-w-[calc(100vw-1rem)] items-center gap-1 rounded-full border border-border/70 bg-card/90 px-1 py-0.5 shadow-2xl shadow-foreground/10 backdrop-blur-xl md:col-start-2 md:row-start-1 md:justify-self-center">
				{sections.map(({ url, v, Icon }) => {
					const isActive = activeUrl === url;

					return (
						<li className="shrink-0" key={url}>
							<button
								aria-current={isActive ? 'page' : undefined}
								aria-label={isActive ? undefined : `Show ${url} section`}
								className={cn(
									`group/nav relative isolate flex h-8 touch-manipulation items-center overflow-hidden rounded-full transition-[background-color,box-shadow,color,transform,width] duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]`,
									isActive
										? `w-[clamp(7rem,36vw,8rem)] justify-start pr-2.5 pl-0.5 text-primary-foreground sm:w-auto sm:min-w-32 sm:pr-3`
										: `size-8 justify-center text-muted-foreground hover:text-foreground`,
								)}
								onClick={() => onSectionChange(v)}
								type="button"
							>
								{isActive && (
									<m.span
										className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/25"
										initial={navIndicatorInitial}
										animate={navIndicatorAnimate}
										transition={navIndicatorTransition}
									/>
								)}

								<span
									className={cn(
										`relative z-10 grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-200 ease-out`,
										isActive
											? 'bg-primary-foreground/15 text-primary-foreground'
											: `bg-secondary text-muted-foreground group-hover/nav:bg-secondary/80 group-hover/nav:text-foreground`,
									)}
								>
									<Icon aria-hidden="true" className="size-4" />
								</span>

								<AnimatePresence initial={false}>
									{isActive && (
										<m.span
											animate={navLabelAnimate}
											className="relative z-10 min-w-0 truncate pl-2 text-sm font-semibold"
											exit={navLabelExit}
											initial={navLabelInitial}
											transition={navLabelTransition}
										>
											{url}
										</m.span>
									)}
								</AnimatePresence>
							</button>
						</li>
					);
				})}
			</ul>

			<Button
				className="h-10 rounded-full px-5 md:col-start-3 md:row-start-1 md:justify-self-end"
				asChild
			>
				<a href="mailto:pozosanchezgonzalo@gmail.com">Contact</a>
			</Button>
		</nav>
	);
}
