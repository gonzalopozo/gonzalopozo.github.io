import { cacheLife, cacheTag } from "next/cache";

interface SkillIconProps {
    iconFullName: string;
    className?: string;
}

export async function SkillIcon({ iconFullName, className }: SkillIconProps ) {
    "use cache"
    cacheLife('max');
    cacheTag('skill-icons');

    const iconName = iconFullName.split("|")[0].trim();
    const packageName = iconFullName.split("|")[1].trim();

    const packageImported = await import(`react-icons/${packageName}`);

    const Icon = packageImported[iconName];
    if (!Icon) return null;

    return <Icon className={className} aria-hidden={true} />

}