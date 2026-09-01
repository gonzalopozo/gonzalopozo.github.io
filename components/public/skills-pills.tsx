import { Badge } from '@/components/ui/badge';
import { SkillIcon } from '@/components/public/skill-icon';
import type { Skill } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SkillsPillsProps {
	skills: Skill[];
	limit?: number;
	className?: string;
}

const MAX_COMBINED_SKILL_NAME_LENGTH = 18;

function groupSkillsByNameLength(skills: Skill[]) {
	const rows: Skill[][] = [];
	let currentRow: Skill[] = [];
	let currentRowLength = 0;

	for (const skill of skills) {
		const exceedsRowLimit =
			currentRow.length > 0 &&
			currentRowLength + skill.name.length > MAX_COMBINED_SKILL_NAME_LENGTH;

		if (exceedsRowLimit) {
			rows.push(currentRow);
			currentRow = [];
			currentRowLength = 0;
		}

		currentRow.push(skill);
		currentRowLength += skill.name.length;
	}

	if (currentRow.length > 0) {
		rows.push(currentRow);
	}

	return rows;
}

export function SkillsPills({ skills, limit, className }: SkillsPillsProps) {
	if (!skills.length) return null;

	const visibleSkills = typeof limit === 'number' ? skills.slice(0, limit) : skills;
	const hiddenSkillsCount = skills.length - visibleSkills.length;
	const skillRows = groupSkillsByNameLength(visibleSkills);

	if (skillRows.length === 0 && hiddenSkillsCount > 0) {
		skillRows.push([]);
	}

	const lastRowIndex = skillRows.length - 1;

	return (
		<div className={cn('flex flex-col gap-1.5', className)}>
			{skillRows.map((row, rowIndex) => (
				<div
					className="flex flex-wrap gap-[inherit]"
					key={row[0]?.id ?? 'hidden-skills-count'}
				>
					{row.map(({ id, name, icon }) => (
						<Badge variant="secondary" key={`${id}-${name}`} className="gap-1.5">
							{icon ? <SkillIcon iconFullName={icon} /> : null}
							{name}
						</Badge>
					))}
					{rowIndex === lastRowIndex && hiddenSkillsCount > 0 ? (
						<Badge variant="secondary" className="gap-1.5">
							+{hiddenSkillsCount}
						</Badge>
					) : null}
				</div>
			))}
		</div>
	);
}
