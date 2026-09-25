import type { CSSProperties, ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { cacheLife, cacheTag } from 'next/cache';

const PACK_LOADERS = {
	fa: () => import('react-icons/fa'),
	fa6: () => import('react-icons/fa6'),
	io5: () => import('react-icons/io5'),
	di: () => import('react-icons/di'),
	ri: () => import('react-icons/ri'),
	gr: () => import('react-icons/gr'),
	si: () => import('react-icons/si'),
	bi: () => import('react-icons/bi'),
	tb: () => import('react-icons/tb'),
	lia: () => import('react-icons/lia'),
};

interface DynamicIconProps {
	iconFullName: string | null;
	className?: string;
	fallback?: ReactNode;
	useColor?: boolean;
	customColor?: string | null;
}

export async function DynamicIcon({
	iconFullName,
	className,
	fallback = null,
	useColor = false,
	customColor,
}: DynamicIconProps) {
	'use cache';
	cacheLife('max');
	cacheTag('dynamic-icons');

	const parts = iconFullName?.split('|').map((value) => value.trim()) ?? [];
	const [iconName, packageName] = parts;

	if (
		parts.length !== 2 ||
		!iconName ||
		!packageName ||
		!Object.hasOwn(PACK_LOADERS, packageName)
	) {
		return fallback;
	}

	const loadPack = PACK_LOADERS[packageName as keyof typeof PACK_LOADERS];
	if (typeof loadPack !== 'function') {
		return fallback;
	}

	const packageImported = await loadPack();
	if (!Object.hasOwn(packageImported, iconName)) return fallback;
	const Icon = (packageImported as Record<string, unknown>)[iconName];
	if (typeof Icon !== 'function') return fallback;
	const ResolvedIcon = Icon as IconType;

	const colorStyle: CSSProperties | undefined =
		useColor && customColor && /^#[0-9a-f]{6}$/i.test(customColor)
			? ({ '--icon-color': customColor } as CSSProperties)
			: undefined;

	return <ResolvedIcon className={className} style={colorStyle} aria-hidden={true} />;
}
