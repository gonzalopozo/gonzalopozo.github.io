export type SkillType = "fullstack" | "frontend" | "backend" | "database" | "devops" | "practices" | "tools" | "other";

export type ProjectStatus = "active" | "archived" | "in-progress";

export interface Skill {
    name: string;
    id: number;
}
export interface ProjectInfo {
    id: number;
    title: string;
    description: string;
    url: string | null;
    repoUrl: string | null;
    status: "active" | "archived" | "in-progress";
    order: number;
    createdAt: Date;
    updatedAt: Date;
    projectSkills: { skill: Skill }[];
}