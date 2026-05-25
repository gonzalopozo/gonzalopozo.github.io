'use client';

import type { ComponentPropsWithRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';

export type GridItemVariant =
	| 'about'
	| 'project'
	| 'experience'
	| 'contact'
	| 'map'
	| 'music'
	| 'hobby';

interface GridItemProps {
	variant: GridItemVariant;
}

interface GridItemShowMoreButtonProps {
	variant: Exclude<GridItemVariant, 'map' | 'music' | 'hobby'>;
	buttonSize?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
	buttonVariant?: 'default' | 'ghost' | 'outline' | 'secondary';
	className?: string;
	icon?: 'arrow-right';
	iconOnly?: boolean;
	label?: string;
}

type GridItemComponentProps = ComponentPropsWithRef<'div'> & GridItemProps;

const VARIANT_CONFIG: Record<
	Exclude<GridItemVariant, 'map' | 'music' | 'hobby'>,
	{ section: PortfolioSection; label: string }
> = {
	about: { section: 'About me', label: '¡Conoce más de mí!' },
	contact: { section: 'Contact', label: '¡Contáctame!' },
	experience: { section: 'Experience', label: '¡Descubre mi experiencia!' },
	project: { section: 'Projects', label: '¡Descubre mis proyectos!' },
};

const GRID_ITEM_ROOT_CLASS_NAME = [
	'group/grid-item relative isolate overflow-visible cursor-grab active:cursor-grabbing',
	'hover:z-20 focus-within:z-20',
	"before:content-[''] before:pointer-events-none before:absolute before:-inset-2 before:z-0 before:rounded-[2.25rem]",
	'before:bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklch,var(--foreground)_12%,transparent),transparent_62%)]',
	'before:opacity-0 before:blur-lg before:transition-opacity before:duration-500 before:ease-[cubic-bezier(0.16,1,0.3,1)]',
	'hover:before:opacity-60 focus-within:before:opacity-60',
].join(' ');

const GRID_ITEM_CARD_INTERACTION_CLASS_NAME = [
	'relative z-10',
	'shadow-[0_0_0_0_color-mix(in_oklch,var(--foreground)_0%,transparent),0_0_0_0_rgb(2_6_23_/_0),inset_0_0_0_1px_color-mix(in_oklch,var(--border)_0%,transparent)]',
	'transition-shadow duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
	'group-hover/grid-item:shadow-[0_18px_46px_-34px_color-mix(in_oklch,var(--foreground)_22%,transparent),0_10px_24px_-20px_rgb(2_6_23_/_0.24),inset_0_0_0_1px_color-mix(in_oklch,var(--border)_72%,transparent)]',
	'group-focus-within/grid-item:shadow-[0_18px_46px_-34px_color-mix(in_oklch,var(--foreground)_22%,transparent),0_10px_24px_-20px_rgb(2_6_23_/_0.24),inset_0_0_0_1px_color-mix(in_oklch,var(--border)_72%,transparent)]',
].join(' ');

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
		<div ref={ref} className={cn(GRID_ITEM_ROOT_CLASS_NAME, className)} {...props}>
			<Card
				className={cn(
					'size-full min-h-0 min-w-0 overflow-hidden rounded-4xl border-0 bg-card',
					GRID_ITEM_CARD_INTERACTION_CLASS_NAME,
					{
						'bg-card text-card-foreground': variant !== 'map',
						'group/map': variant === 'map',
						'gap-0 p-0 py-0':
							variant === 'map' ||
							variant === 'about' ||
							variant === 'project' ||
							variant === 'contact' ||
							variant === 'music' ||
							variant === 'hobby',
						'@container/project-card @container-[size]': variant === 'project',
						'group/music isolate': variant === 'music',
						'group/hobby @container/hobby-card @container-[size] isolate':
							variant === 'hobby',
					},
				)}
			>
				{children}

				{variant !== 'project' &&
					variant !== 'map' &&
					variant !== 'about' &&
					variant !== 'contact' &&
					variant !== 'music' &&
					variant !== 'hobby' && <GridItemShowMoreButton variant={variant} />}
			</Card>
		</div>
	);
}
