'use client';

import { MapPin } from 'lucide-react';

export function ArroyomolinosMarkerPin() {
	return (
		<div className="group relative flex items-center justify-center">
			{/* Outer pulse ring */}
			<span className="absolute size-10 animate-ping rounded-full bg-emerald-400/30 [animation-duration:2.5s]" />
			{/* Middle breathing ring */}
			<span className="absolute size-7 animate-pulse rounded-full bg-emerald-400/20 [animation-duration:3s]" />
			{/* Marker body */}
			<span className="relative flex size-8 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.7)]">
				<MapPin className="size-4 text-white drop-shadow-sm" strokeWidth={2.5} />
			</span>
		</div>
	);
}

export function ArroyomolinosTooltip() {
	return (
		<div className="flex items-center gap-2 px-1">
			<span className="relative flex size-2">
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 [animation-duration:2s]" />
				<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
			</span>
			<span className="text-xs font-medium">Arroyomolinos, el lugar donde he crecido</span>
		</div>
	);
}

export function ArroyomolinosPopup() {
	return (
		<div className="w-64 overflow-hidden">
			{/* Image placeholder */}
			<div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20">
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
					<div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20">
						<MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
						Foto próximamente
					</span>
				</div>
				{/* Decorative corner accent */}
				<div className="absolute top-0 right-0 size-16 bg-gradient-to-bl from-emerald-400/20 to-transparent" />
				<div className="absolute bottom-0 left-0 size-12 bg-gradient-to-tr from-teal-400/15 to-transparent" />
			</div>

			{/* Content */}
			<div className="space-y-2.5 p-3.5">
				<div className="flex items-center gap-2">
					<span className="inline-flex size-1.5 rounded-full bg-emerald-500" />
					<h3 className="text-foreground text-sm font-semibold tracking-tight">
						Arroyomolinos
					</h3>
					<span className="text-muted-foreground text-[10px]">Madrid, España</span>
				</div>

				<p className="text-muted-foreground text-xs leading-relaxed">
					El pueblo del suroeste de Madrid donde crecí. Aquí pasé mi infancia y
					adolescencia, rodeado de naturaleza y a un paso de la ciudad. Arroyomolinos es
					el lugar que me vio crecer y que forma parte de quien soy hoy.
				</p>

				<div className="border-border flex items-center gap-3 border-t pt-2.5">
					<div className="flex flex-col">
						<span className="text-foreground text-xs font-semibold">28939</span>
						<span className="text-muted-foreground text-[10px]">Código postal</span>
					</div>
					<div className="bg-border h-6 w-px" />
					<div className="flex flex-col">
						<span className="text-foreground text-xs font-semibold">~35.000</span>
						<span className="text-muted-foreground text-[10px]">Habitantes</span>
					</div>
					<div className="bg-border h-6 w-px" />
					<div className="flex flex-col">
						<span className="text-foreground text-xs font-semibold">30 km</span>
						<span className="text-muted-foreground text-[10px]">De Madrid</span>
					</div>
				</div>
			</div>
		</div>
	);
}
