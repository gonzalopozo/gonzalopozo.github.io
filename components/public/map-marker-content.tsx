'use client';

import { TbHandClick, TbHandFinger } from 'react-icons/tb';
import { cn } from '@/lib/utils';

interface ArroyomolinosMarkerPinProps {
	shouldJiggle?: boolean;
}

export function ArroyomolinosMarkerPin({ shouldJiggle = false }: ArroyomolinosMarkerPinProps) {
	return (
		<div className="group relative flex items-center justify-center">
			{/* Outer pulse ring */}
			<span className="absolute size-10 animate-ping rounded-full bg-emerald-400/30 [animation-duration:2.5s]" />
			{/* Middle breathing ring */}
			<span className="absolute size-7 animate-pulse rounded-full bg-emerald-400/20 [animation-duration:3s]" />
			{/* Marker body */}
			<span className="relative flex size-8 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.7)]">
				<span
					className={cn(
						'relative flex size-4 items-center justify-center text-white drop-shadow-sm',
						shouldJiggle && 'motion-safe:group-hover/map:animate-map-marker-jiggle',
					)}
				>
					<TbHandFinger
						aria-hidden="true"
						className="absolute size-4 transition-all duration-200 group-hover/map:scale-75 group-hover/map:opacity-0"
					/>
					<TbHandClick
						aria-hidden="true"
						className="absolute size-4 scale-75 opacity-0 transition-all duration-200 group-hover/map:scale-100 group-hover/map:opacity-100"
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
		<div className="w-44 overflow-hidden rounded-4xl">
			<div className="relative h-16 w-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20">
				<div className="absolute inset-0 flex items-center justify-center gap-1.5">
					<div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20">
						<TbHandFinger className="size-3 text-emerald-600 dark:text-emerald-400" />
					</div>
					<span className="text-muted-foreground text-[8px] font-medium tracking-wide uppercase">
						Foto próximamente
					</span>
				</div>
				<div className="absolute top-0 right-0 size-8 bg-gradient-to-bl from-emerald-400/20 to-transparent" />
			</div>

			{/* Content */}
			<div className="space-y-1.5 px-3 pt-2 pb-3">
				<div className="flex items-baseline gap-1.5">
					<span className="inline-flex size-1 rounded-full bg-emerald-500" />
					<h3 className="text-foreground text-[11px] leading-none font-semibold">
						Arroyomolinos
					</h3>
					<span className="text-muted-foreground text-[8px]">Madrid</span>
				</div>

				<p className="text-muted-foreground text-[9px] leading-snug">
					El pueblo del suroeste de Madrid donde crecí, rodeado de naturaleza y a un paso
					de la ciudad.
				</p>

				<div className="border-border flex items-center gap-2 border-t pt-1.5">
					<div className="flex flex-col">
						<span className="text-foreground text-[9px] font-semibold">28939</span>
						<span className="text-muted-foreground text-[7px]">C.P.</span>
					</div>
					<div className="bg-border h-4 w-px" />
					<div className="flex flex-col">
						<span className="text-foreground text-[9px] font-semibold">~35k</span>
						<span className="text-muted-foreground text-[7px]">Hab.</span>
					</div>
					<div className="bg-border h-4 w-px" />
					<div className="flex flex-col">
						<span className="text-foreground text-[9px] font-semibold">30 km</span>
						<span className="text-muted-foreground text-[7px]">De Madrid</span>
					</div>
				</div>
			</div>
		</div>
	);
}
