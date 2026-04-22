import { Badge } from '@/components/ui/badge';
import { SkillIcon } from '@/components/public/skill-icon';
import type { Skill } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SkillsPillsProps {
	skills: Skill[];
	limit?: number;
	className?: string;
}

export function SkillsPills({ skills, limit, className }: SkillsPillsProps) {
	if (!skills.length) return null;

	const visibleSkills = typeof limit === 'number' ? skills.slice(0, limit) : skills;
	const hiddenSkillsCount = skills.length - visibleSkills.length;

	return (
		<div className={cn('flex flex-wrap gap-1.5', className)}>
			{visibleSkills.map(({ id, name, icon }) => (
				<Badge variant="secondary" key={`${id}-${name}`} className="gap-1.5">
					{icon ? <SkillIcon iconFullName={icon} /> : null}
					{name}
				</Badge>
			))}
			{hiddenSkillsCount > 0 ? (
				<Badge variant="secondary" className="gap-1.5 font-mono">
					+{hiddenSkillsCount}
				</Badge>
			) : null}
		</div>
	);
}
