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
    status: ProjectStatus;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    projectSkills: { skill: Skill }[];
}

export interface ExperienceData {
    id: number;
    description: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    role: string;
    company: string;
    companyUrl: string | null;
    companyLogo: string | null;
    startDate: Date | null;
    endDate: Date | null;
    location: string | null;
    experienceSkills: { skill: Skill }[];
}

export interface Settings {
    id: number
    isEmployed: boolean | null
    resumeUrl: string
    statusMessage: string | null
    updatedAt: Date
}