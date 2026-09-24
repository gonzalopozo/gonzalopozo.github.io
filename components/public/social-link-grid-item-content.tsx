import type { CSSProperties, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getColorVariants } from '@/lib/social-link-colors';

interface SocialLinkGridItemContentProps {
	backgroundColor: string;
	url: string;
	ariaLabel: string;
	children: ReactNode;
}

type SocialLinkGridItemStyle = CSSProperties & {
	'--social-link-bg-light-theme': string;
	'--social-link-bg-dark-theme': string;
	'--social-link-fg-light-theme': string;
	'--social-link-fg-dark-theme': string;
};

function getContrastForeground(hex: string): '#000000' | '#ffffff' {
	const channels = [1, 3, 5].map((index) => {
		const value = parseInt(hex.slice(index, index + 2), 16) / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
	return luminance > 0.179 ? '#000000' : '#ffffff';
}

export function SocialLinkGridItemContent({
	backgroundColor,
	url,
	ariaLabel,
	children,
}: SocialLinkGridItemContentProps) {
	const { lighter, darker } = getColorVariants(backgroundColor);
	const style: SocialLinkGridItemStyle = {
		'--social-link-bg-light-theme': darker,
		'--social-link-bg-dark-theme': lighter,
		'--social-link-fg-light-theme': getContrastForeground(darker),
		'--social-link-fg-dark-theme': getContrastForeground(lighter),
	};

	return (
		<div
			className="group/card relative grid size-full place-items-center bg-(--social-link-bg-light-theme) text-(--social-link-fg-light-theme) dark:bg-(--social-link-bg-dark-theme) dark:text-(--social-link-fg-dark-theme)"
			style={style}
		>
			{children}
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={ariaLabel}
				className="absolute bottom-4 left-4 inline-flex size-9 items-center justify-center rounded-full border border-current/25 bg-white/5 shadow-[inset_0_0_0_0_currentColor] backdrop-blur-sm transition-[border-color,box-shadow] duration-200 ease-out group-hover/card:border-current/50 hover:shadow-[inset_0_0_0_2px_currentColor] focus-visible:ring-2 focus-visible:ring-current/60 focus-visible:ring-offset-2 focus-visible:ring-offset-(--social-link-bg-light-theme) focus-visible:outline-none dark:focus-visible:ring-offset-(--social-link-bg-dark-theme)"
			>
				<ArrowUpRight
					aria-hidden="true"
					className="size-4 transition-transform duration-200 ease-out group-hover/card:scale-110"
				/>
			</a>
		</div>
	);
}
