import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const timestamps = {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
};

export const projects = sqliteTable("projects", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    url: text("url"),
    repoUrl: text("repo_url"),
    status: text("status", { enum: ["active", "archived", "in-progress"] }).notNull().default("in-progress"),
    order: integer("order").notNull().default(0),
    ...timestamps,
})

export const experiences = sqliteTable("experiences", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    role: text("role").notNull(),
    company: text("company").notNull(),
    companyUrl: text("company_url"),
    companyLogo: text("company_logo"),
    description: text("description").notNull(),
    startDate: integer("start_date", { mode: 'timestamp_ms' }),
    endDate: integer("end_date", { mode: 'timestamp_ms' }),
    order: integer("order").notNull().default(0),
    location: text("location"),
    ...timestamps,
})

export const skills = sqliteTable("skills", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type", { enum: ["fullstack", "frontend", "backend", "database", "devops", "practices", "tools", "other"] }).notNull().default("other"),
    icon: text("icon"),
    url: text("url"),
    ...timestamps,
})

export const projectSkills = sqliteTable("project_skills",
    {
        projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
        skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
        ...timestamps,
    },
    (table) => [primaryKey({ columns: [table.projectId, table.skillId] })]
);

export const experienceSkills = sqliteTable("experience_skills",
    {
        experienceId: integer("experience_id").notNull().references(() => experiences.id, { onDelete: "cascade" }),
        skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
        ...timestamps,
    },
    (table) => [primaryKey({ columns: [table.experienceId, table.skillId] })]
)

export const siteSettings = sqliteTable("site_settings", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    isEmployed: integer("is_employed", { mode: 'boolean' }),
    resumeUrl: text("resume_url").notNull(),
    statusMessage: text("status_message"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
})

export const employmentHistory = sqliteTable("employment_history", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    isEmployed: integer("is_employed", { mode: 'boolean' }),
    changedAt: integer("changed_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
})

export const socialLinks = sqliteTable("social_links", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    icon: text("icon"),
    order: integer("order").notNull().default(0),
    ...timestamps,
})

// Projects: has many projectSkills
export const projectsRelations = relations(projects, ({ many }) => ({
    projectSkills: many(projectSkills),
}));

// Experiences: has many experienceSkills
export const experiencesRelations = relations(experiences, ({ many }) => ({
    experienceSkills: many(experienceSkills),
}));

// Skills: connected to BOTH junction tables
export const skillsRelations = relations(skills, ({ many }) => ({
    projectSkills: many(projectSkills),
    experienceSkills: many(experienceSkills),
}));

// ProjectSkills junction: belongs to one project AND one skill
export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
    project: one(projects, {
        fields: [projectSkills.projectId],
        references: [projects.id],
    }),
    skill: one(skills, {
        fields: [projectSkills.skillId],
        references: [skills.id],
    }),
}));

// ExperienceSkills junction: belongs to one experience AND one skill
export const experienceSkillsRelations = relations(experienceSkills, ({ one }) => ({
    experience: one(experiences, {
        fields: [experienceSkills.experienceId],
        references: [experiences.id],
    }),
    skill: one(skills, {
        fields: [experienceSkills.skillId],
        references: [skills.id],
    }),
}));