import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/public/skill-icon";

interface Skill {
    id: number;
    name: string;
    iconFullName: string;
}

interface SkillsPillsProps {
    skills: Skill[];
}

export function SkillsPills({ skills }: SkillsPillsProps) {
    if (!skills) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {skills.map(({ id, name, iconFullName }) => ( <Badge variant="secondary" key={`${id}-${name}`}>{iconFullName ? <SkillIcon iconFullName={iconFullName} /> : null }{name}</Badge> ))}
        </div>
    )

}