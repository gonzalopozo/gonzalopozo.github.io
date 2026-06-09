'use client';

import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Hobby {
	id: string;
	name: string;
	icon: string;
	description: string;
	image: string;
}

type PopupPlacement = 'top' | 'bottom';

const hobbies: Hobby[] = [
	{
		id: 'NBA',
		name: 'NBA',
		icon: '🏀',
		description: 'NBA NBA NBA NBA',
		image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop',
	},
	{
		id: 'Cars',
		name: 'Cars',
		icon: '🚗',
		description: 'CARS CARS CARS CARS',
		image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop',
	},
	{
		id: 'Watches',
		name: 'Watches',
		icon: '⌚',
		description: 'WATCHES WATCHES WATCHES WATCHES',
		image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=200&fit=crop',
	},
	{
		id: 'Startups',
		name: 'Startups',
		icon: '🚀',
		description: 'Startups Startups Startups Startups',
		image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
	},
	{
		id: 'Training',
		name: 'Training',
		icon: '🏋🏻',
		description: 'Training Training Training Training',
		image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop',
	},
	{
		id: 'cooking',
		name: 'Cooking',
		icon: '🍳',
		description: 'Crafting flavors and culinary experiments',
		image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
	},
];

export function HobbiesGridItemContent() {
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [triggerEl, setTriggerEl] = useState<HTMLDivElement | null>(null);

	const hoveredHobby = hoveredId ? hobbies.find((hobby) => hobby.id === hoveredId) : null;
	const hoveredIndex = hoveredId ? hobbies.findIndex((hobby) => hobby.id === hoveredId) : -1;
	const popupPlacement: PopupPlacement = hoveredIndex >= 3 ? 'bottom' : 'top';

	return (
		<section
			aria-label="Hobbies"
			className="grid size-full min-h-0 grid-rows-[auto_1fr] gap-3 overflow-hidden px-5 py-4"
		>
			<h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Hobbies
			</h3>
			<div className="grid grid-cols-3 grid-rows-2 gap-2">
				{hobbies.map((hobby) => (
					<div
						key={hobby.id}
						className="relative"
						onMouseEnter={(event) => {
							setHoveredId(hobby.id);
							setTriggerEl(event.currentTarget);
						}}
						onMouseLeave={() => {
							setHoveredId(null);
							setTriggerEl(null);
						}}
						onFocus={(event) => {
							setHoveredId(hobby.id);
							setTriggerEl(event.currentTarget);
						}}
						onBlur={() => {
							setHoveredId(null);
							setTriggerEl(null);
						}}
					>
						<div
							aria-describedby={
								hoveredId === hobby.id ? `hobby-popup-${hobby.id}` : undefined
							}
							aria-label={`${hobby.name}: ${hobby.description}`}
							className={cn(
								'relative size-full min-h-0 overflow-hidden rounded-lg border border-border/50 bg-secondary/50',
								'flex items-center justify-center outline-none',
								'transition-[background-color,border-color] duration-300 ease-out',
								hoveredId === hobby.id
									? 'border-border/70 bg-secondary/70'
									: 'hover:border-muted-foreground/30',
							)}
							role="img"
							tabIndex={0}
						>
							<span
								className={cn(
									'relative z-10 text-2xl transition-all duration-300',
									hoveredId === hobby.id
										? 'scale-110 drop-shadow-lg'
										: 'grayscale-30',
								)}
							>
								{hobby.icon}
							</span>

							<div
								className={cn(
									'pointer-events-none absolute inset-px rounded-[calc(var(--radius-lg)-1px)] border border-primary/50 bg-primary/5 transition-opacity duration-300',
									hoveredId === hobby.id ? 'opacity-100' : 'opacity-0',
								)}
							/>
						</div>
					</div>
				))}
			</div>

			{typeof document !== 'undefined' && hoveredHobby && triggerEl
				? createPortal(
						<HobbyPopup
							hobby={hoveredHobby}
							placement={popupPlacement}
							triggerEl={triggerEl}
						/>,
						document.body,
					)
				: null}
		</section>
	);
}

function HobbyPopup({
	hobby,
	placement,
	triggerEl,
}: {
	hobby: Hobby;
	placement: PopupPlacement;
	triggerEl: HTMLDivElement;
}) {
	const popupRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{
		left: number;
		top: number;
		placement: PopupPlacement;
	} | null>(null);

	useLayoutEffect(() => {
		const updatePosition = () => {
			if (!popupRef.current) return;

			const triggerRect = triggerEl.getBoundingClientRect();
			const popupRect = popupRef.current.getBoundingClientRect();
			const viewportPadding = 12;
			const popupOffset = 10;
			const centeredLeft = triggerRect.left + (triggerRect.width - popupRect.width) / 2;
			const maxLeft = window.innerWidth - popupRect.width - viewportPadding;
			const clampedLeft = Math.min(Math.max(centeredLeft, viewportPadding), maxLeft);
			const topPosition = triggerRect.top - popupRect.height - popupOffset;
			const bottomPosition = triggerRect.bottom + popupOffset;
			const hasTopRoom = topPosition >= viewportPadding;
			const hasBottomRoom =
				bottomPosition + popupRect.height <= window.innerHeight - viewportPadding;
			const resolvedPlacement =
				placement === 'top'
					? hasTopRoom || !hasBottomRoom
						? 'top'
						: 'bottom'
					: hasBottomRoom || !hasTopRoom
						? 'bottom'
						: 'top';

			setPosition({
				left: clampedLeft,
				top: resolvedPlacement === 'top' ? topPosition : bottomPosition,
				placement: resolvedPlacement,
			});
		};

		updatePosition();
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('scroll', updatePosition, true);
		};
	}, [placement, triggerEl]);

	return (
		<div
			id={`hobby-popup-${hobby.id}`}
			ref={popupRef}
			className={cn(
				'pointer-events-none fixed z-9999 w-40 rounded-lg border border-border/80 bg-popover/95 p-2.5 text-popover-foreground shadow-[0_18px_48px_-28px_rgb(2_6_23/0.38),0_8px_20px_-16px_rgb(2_6_23/0.3)] backdrop-blur-md',
				'transition-[opacity,transform] duration-200 ease-out',
				position?.placement === 'bottom' ? 'origin-top' : 'origin-bottom',
				position ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
			)}
			role="tooltip"
			style={{
				left: position?.left ?? 0,
				top: position?.top ?? 0,
				visibility: position ? 'visible' : 'hidden',
			}}
		>
			<div className="mb-2 grid aspect-16/10 w-full place-items-center overflow-hidden rounded-md bg-secondary">
				<Image
					src={hobby.image}
					alt=""
					width={160}
					height={100}
					className="size-full object-cover"
				/>
			</div>
			<div className="flex items-start gap-2">
				<span className="mt-0.5 text-base leading-none" aria-hidden="true">
					{hobby.icon}
				</span>
				<div className="min-w-0">
					<p className="truncate text-xs font-semibold text-foreground">{hobby.name}</p>
					<p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
						{hobby.description}
					</p>
				</div>
			</div>
		</div>
	);
}
