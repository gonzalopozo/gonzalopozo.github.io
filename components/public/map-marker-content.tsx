'use client';

import { X } from 'lucide-react';
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
				Arroyomolinos, donde realmente crecí
			</span>
		</div>
	);
}

interface ArroyomolinosPopupProps {
	className?: string;
	onClose?: () => void;
}

export function ArroyomolinosPopup({ className, onClose }: ArroyomolinosPopupProps) {
	return (
		<article
			className={cn(
				'bg-card text-card-foreground border-border/70 relative flex max-h-full w-full flex-col overflow-hidden rounded-[1.5rem] border shadow-lg',
				className,
			)}
			data-arroyomolinos-panel
		>
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					className="border-border/60 bg-background/85 text-foreground hover:bg-background absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full border backdrop-blur-sm transition-colors focus:outline-none"
					aria-label="Cerrar historia de Arroyomolinos"
				>
					<X className="size-3.5" aria-hidden="true" />
				</button>
			)}

			<figure className="relative aspect-[16/8.5] w-full shrink-0 overflow-hidden bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20">
				<Image
					src="/arroyomolinos.jpg"
					alt="Vista de Arroyomolinos, Madrid"
					fill
					sizes="(max-width: 768px) 16rem, 15rem"
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
			</figure>

			<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-4">
				<div className="flex flex-col gap-1">
					<p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
						Mis raíces
					</p>
					<h3 className="text-sm leading-tight font-semibold tracking-tight">
						Arroyomolinos, Madrid
					</h3>
				</div>

				<div className="flex flex-col gap-2.5">
					<p className="text-[11px] leading-relaxed text-pretty">
						<span className="text-foreground font-medium">
							Nací en Alcorcón, pero me mudé a Arroyomolinos con 4 años.
						</span>{' '}
						Desde entonces, es el lugar que más asocio con mi infancia, con mi familia y
						con la etapa en la que realmente crecí.
					</p>
					<p className="text-muted-foreground text-[11px] leading-relaxed text-pretty">
						Arroyomolinos tiene esa mezcla de calma residencial, zonas verdes y cercanía
						con Madrid que hace fácil sentirse en casa. Allí construí una parte
						importante de mi historia y de la persona que soy hoy.
					</p>
				</div>
			</div>
		</article>
	);
}
