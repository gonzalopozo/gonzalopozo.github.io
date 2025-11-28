import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    desription: text("description").notNull(),
    url: text("url").notNull(),
    repoUrl: text("repo_url").notNull(),
    status: text("status").notNull(), // TODO: status is gonna be an enum, define the values that status can have and define a default one.
    // order: integer().notNull(). // TODO: order should be an automatically auto-increment number but it shouldn't be a fixed value, I mean every insert should automatically set the max value in this column plus one to this field.  
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
    // order: integer().notNull(). // TODO: order should be an automatically auto-increment number but it shouldn't be a fixed value, I mean every insert should automatically set the max value in this column plus one to this field.  
    location: integer("text"),
    // TODO: timestamps
})

export const skills= sqliteTable("skills", {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type").notNull(), // TODO: type is gonna be an enum, define the values that type can have and define a default one.
    icon: text("icon"),
    url: text("url").notNull(),
    // TODO: timestamps
})

// TODO: junction tables (tablas intermedias) between projects and skills and between experiences and skills
// TODO: site_setting table
// TODO: employment_history table
// TODO: social_links table