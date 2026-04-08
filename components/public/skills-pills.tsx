import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/public/skill-icon";
import type { Skill } from "@/lib/types";

interface SkillsPillsProps {
    skills: Skill[];
}

export function SkillsPills({ skills }: SkillsPillsProps) {
    if (!skills) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {skills.map(({ id, name, icon }) => (
                <Badge variant="secondary" key={`${id}-${name}`} className="gap-1.5">
                    {icon ? <SkillIcon iconFullName={icon} /> : null}
                    {name}
                </Badge>
            ))}
        </div>
    )

}