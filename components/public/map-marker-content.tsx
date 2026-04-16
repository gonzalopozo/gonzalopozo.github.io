'use client';

import { TbHandClick, TbHandFinger } from 'react-icons/tb';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ArroyomolinosMarkerPinProps {
	shouldJiggle?: boolean;
}

export function ArroyomolinosMarkerPin({ shouldJiggle = false }: ArroyomolinosMarkerPinProps) {
	return (
		<div className="group relative flex items-center justify-center">
			{/* Outer pulse ring */}
			<span className="absolute size-14 animate-ping rounded-full bg-emerald-400/30 [animation-duration:2.5s]" />
			{/* Middle breathing ring */}
			<span className="absolute size-11 animate-pulse rounded-full bg-emerald-400/20 [animation-duration:3s]" />
			{/* Marker body */}
			<span className="relative flex size-11 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.7)]">
				<span
					className={cn(
						'relative flex size-4 items-center justify-center text-white drop-shadow-sm',
						shouldJiggle && 'motion-safe:group-hover/map:animate-map-marker-jiggle',
					)}
				>
					<TbHandFinger
						aria-hidden="true"
						className="absolute size-5 transition-all duration-200 group-hover/map:scale-75 group-hover/map:opacity-0"
					/>
					<TbHandClick
						aria-hidden="true"
						className="absolute size-5 scale-75 opacity-0 transition-all duration-200 group-hover/map:scale-100 group-hover/map:opacity-100"
					/>
				</span>
			</span>
		</div>
	);
}

export function ArroyomolinosTooltip() {
	return (
		<div className="flex items-center gap-1.5">
			<span className="relative flex size-1.5">
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 [animation-duration:2s]" />
				<span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
			</span>
			<span className="text-[10px] leading-none font-medium">
				Arroyomolinos, el lugar donde he crecido
			</span>
		</div>
	);
}

export function ArroyomolinosPopup() {
	return (
		<div className="bg-card border-border/70 w-44 overflow-hidden rounded-4xl border">
			<figure className="relative h-16 w-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20">
				<Image
					src="/arroyomolinos.jpg"
					alt="Vista de Arroyomolinos, Madrid"
					fill
					sizes="11rem"
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
				<figcaption className="absolute inset-x-0 bottom-0 space-y-0.5 px-3 pb-2.5">
					<p className="text-[8px] font-semibold tracking-[0.18em] text-white/85 uppercase">
						Mi hogar
					</p>
					<h3 className="text-[11px] leading-none font-semibold tracking-tight text-white">
						Arroyomolinos, Madrid
					</h3>
				</figcaption>
			</figure>

			<div className="px-3 py-2.5">
				<p className="text-[9px] leading-[1.45] text-pretty">
					<span className="text-foreground font-medium">
						Nací en Alcorcón, pero a los 4 años me mudé a Arroyomolinos y aquí crecí.
					</span>{' '}
					<span className="text-muted-foreground">
						Me encanta su calma de pueblo, sus zonas verdes y tener Madrid siempre
						cerca.
					</span>
				</p>
			</div>
		</div>
	);
}
