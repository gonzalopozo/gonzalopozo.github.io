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

interface SkillIconProps {
	iconFullName: string;
	className?: string;
}

export async function SkillIcon({ iconFullName, className }: SkillIconProps) {
	'use cache';
	cacheLife('max');
	cacheTag('skill-icons');

	const [iconName, packageName] = iconFullName.split('|').map((value) => value.trim());

	if (!iconName || !packageName) {
		return null;
	}

	const loadPack = PACK_LOADERS[packageName as keyof typeof PACK_LOADERS];
	if (!loadPack) {
		return null;
	}

	const packageImported = await loadPack();
	const Icon = (packageImported as Record<string, unknown>)[iconName];
	if (typeof Icon !== 'function') return null;
	const ResolvedIcon = Icon as IconType;

	return <ResolvedIcon className={className} aria-hidden={true} />;
}
