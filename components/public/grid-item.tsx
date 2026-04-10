'use client';

import type { ComponentPropsWithRef } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';

export type GridItemVariant = 'about' | 'project' | 'experience' | 'contact' | 'map';

interface GridItemProps {
	variant: GridItemVariant;
}

interface GridItemShowMoreButtonProps {
	variant: Exclude<GridItemVariant, 'map'>;
}

type GridItemComponentProps = ComponentPropsWithRef<'div'> & GridItemProps;

const VARIANT_CONFIG: Record<
	Exclude<GridItemVariant, 'map'>,
	{ section: PortfolioSection; label: string }
> = {
	about: { section: 'About me', label: '¡Conoce más de mí!' },
	contact: { section: 'Contact', label: '¡Contáctame!' },
	experience: { section: 'Experience', label: '¡Descubre mi experiencia!' },
	project: { section: 'Projects', label: '¡Descubre mis proyectos!' },
};

export function GridItemShowMoreButton({ variant }: GridItemShowMoreButtonProps) {
	const [section, setSection] = useQueryState(
		'section',
		parseAsStringLiteral(PORTFOLIO_SECTIONS),
	);
	const { section: targetSection, label } = VARIANT_CONFIG[variant];

	if (section) {
		return null;
	}

	return <Button onClick={() => setSection(targetSection)}>{label}</Button>;
}

export function GridItem({ children, className, variant, ref, ...props }: GridItemComponentProps) {
	return (
		<div ref={ref} {...props}>
			<Card
				className={cn(
					'bg-card size-full min-h-0 min-w-0 overflow-hidden rounded-4xl',
					className,
					{
						'text-card-foreground bg-card': variant !== 'map',
						'gap-0 p-0 py-0': variant === 'map',
						'grid-rows-[auto repeat(3, 1fr)] grid grid-cols-1 pt-0':
							variant === 'project',
					},
				)}
			>
				{children}

				{variant !== 'project' && variant !== 'map' && (
					<GridItemShowMoreButton variant={variant} />
				)}
			</Card>
		</div>
	);
}
