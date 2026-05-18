import type { CSSProperties, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface SocialLinkGridItemContentProps {
	backgroundColor: string;
	url: string;
	ariaLabel: string;
	children: ReactNode;
}

type SocialLinkGridItemStyle = CSSProperties & {
	'--social-link-bg': string;
};

export function SocialLinkGridItemContent({
	backgroundColor,
	url,
	ariaLabel,
	children,
}: SocialLinkGridItemContentProps) {
	const style: SocialLinkGridItemStyle = {
		'--social-link-bg': backgroundColor,
	};

	return (
		<div
			className="
     group/card relative grid size-full place-items-center bg-(--social-link-bg)
   "
			style={style}
		>
			{children}
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={ariaLabel}
				className="
      absolute bottom-4 left-4 inline-flex size-9 items-center justify-center
      rounded-full border border-white/15 bg-white/5 text-white/85
      shadow-[inset_0_0_0_0_rgb(255_255_255/0)] backdrop-blur-sm
      transition-[border-color,box-shadow] duration-200 ease-out
      group-hover/card:border-white/40
      hover:shadow-[inset_0_0_0_2px_rgb(255_255_255/0.55)]
      focus-visible:ring-2 focus-visible:ring-white/60
      focus-visible:ring-offset-2 focus-visible:ring-offset-(--social-link-bg)
      focus-visible:outline-none
    "
			>
				<ArrowUpRight
					aria-hidden="true"
					className="
       size-4 transition-transform duration-200 ease-out
       group-hover/card:scale-110
     "
				/>
			</a>
		</div>
	);
}
