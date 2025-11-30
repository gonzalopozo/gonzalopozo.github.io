import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    url: text("url"),
    repoUrl: text("repo_url").notNull(),
    status: text("status", { enum: ["active", "archived", "in-progress"] }).notNull(),
    order: integer("order").notNull().default(0),
    // TODO: timestamps
})

export const experiences = sqliteTable("experiences", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    role: text("role").notNull(),
    company: text("company").notNull(),
    companyUrl: text("company_url"),
    companyLogo: text("company_logo"),
    description: text("description").notNull(),
    startDate: integer("start_date", { mode: 'timestamp' }),
    endDate: integer("end_date", { mode: 'timestamp' }),
    order: integer("order").notNull().default(0),
    location: text("location"),
    // TODO: timestamps
})

export const skills = sqliteTable("skills", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type").notNull(), // TODO: type is gonna be an enum, define the values that type can have and define a default one.
    icon: text("icon"),
    url: text("url"),
    // TODO: timestamps
})

// TODO: junction tables (tablas intermedias) between projects and skills and between experiences and skills

export const siteSettings = sqliteTable("site_settings", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    isEmployed: integer("is_employed", { mode: 'boolean' }),
    resumeUrl: text("resume_url").notNull(),
    statusMessage: text("status_message"),
    // TODO: timestamps -> updated_at
})

export const employmentHistory = sqliteTable("employment_history", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    isEmployed: integer("is_employed", { mode: 'boolean' }),
    // TODO: timestamps -> changed_at
})

export const socialLinks = sqliteTable("social_links", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    icon: text("icon"),
    order: integer("order").notNull().default(0),
})
