'use client';

import type { ComponentPropsWithRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';

export type GridItemVariant = 'about' | 'project' | 'experience' | 'contact' | 'map' | 'music';

interface GridItemProps {
	variant: GridItemVariant;
}

interface GridItemShowMoreButtonProps {
	variant: Exclude<GridItemVariant, 'map' | 'music'>;
	buttonSize?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
	buttonVariant?: 'default' | 'ghost' | 'outline' | 'secondary';
	className?: string;
	icon?: 'arrow-right';
	iconOnly?: boolean;
	label?: string;
}

type GridItemComponentProps = ComponentPropsWithRef<'div'> & GridItemProps;

const VARIANT_CONFIG: Record<
	Exclude<GridItemVariant, 'map' | 'music'>,
	{ section: PortfolioSection; label: string }
> = {
	about: { section: 'About me', label: '¡Conoce más de mí!' },
	contact: { section: 'Contact', label: '¡Contáctame!' },
	experience: { section: 'Experience', label: '¡Descubre mi experiencia!' },
	project: { section: 'Projects', label: '¡Descubre mis proyectos!' },
};

export function GridItemShowMoreButton({
	variant,
	buttonSize,
	buttonVariant,
	className,
	icon,
	iconOnly,
	label,
}: GridItemShowMoreButtonProps) {
	const [section, setSection] = useQueryState(
		'section',
		parseAsStringLiteral(PORTFOLIO_SECTIONS),
	);
	const { section: targetSection, label: defaultLabel } = VARIANT_CONFIG[variant];
	const resolvedLabel = label ?? defaultLabel;
	const Icon = icon === 'arrow-right' ? ArrowRight : null;

	if (section) {
		return null;
	}

	return (
		<Button
			onClick={() => setSection(targetSection)}
			size={buttonSize}
			variant={buttonVariant}
			className={className}
			aria-label={iconOnly ? resolvedLabel : undefined}
		>
			{Icon ? <Icon data-icon="inline-start" aria-hidden="true" /> : null}
			{iconOnly ? <span className="sr-only">{resolvedLabel}</span> : resolvedLabel}
		</Button>
	);
}

export function GridItem({ children, className, variant, ref, ...props }: GridItemComponentProps) {
	return (
		<div ref={ref} className={cn(`
    cursor-grab
    active:cursor-grabbing
  `, className)} {...props}>
			<Card
				className={cn(
					'size-full min-h-0 min-w-0 overflow-hidden rounded-4xl bg-card shadow-none',
					{
						'bg-card text-card-foreground': variant !== 'map',
						'group/map': variant === 'map',
						'gap-0 p-0 py-0':
							variant === 'map' ||
							variant === 'about' ||
							variant === 'project' ||
							variant === 'contact' ||
							variant === 'music',
						'@container/project-card @container-[size]': variant === 'project',
						'group/music isolate': variant === 'music',
					},
				)}
			>
				{children}

				{variant !== 'project' &&
					variant !== 'map' &&
					variant !== 'about' &&
					variant !== 'contact' &&
					variant !== 'music' && <GridItemShowMoreButton variant={variant} />}
			</Card>
		</div>
	);
}
