import { SkillsMultiSelect } from "@/components/skills-multi-select";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { skills } from "@/db/schema/portfolio";
import { createProject } from "@/lib/actions/projects";

export default async function NewProjectDashboardPage() {
    const skillsList = await db
        .select({ id: skills.id, name: skills.name })
        .from(skills);

    return (
        <form action={createProject} className="flex flex-col gap-4 items-start justify-start">
            <h1 className="text-2xl font-bold">Create a new project</h1>
            
            <div className="flex flex-col gap-2">
                <label htmlFor="title">Title:</label>
                <input 
                    type="text" 
                    name="title" 
                    id="title" 
                    placeholder="Project title"
                    className="rounded-md border border-input bg-background px-3 py-2"
                />
            </div>
            
            <div className="flex flex-col gap-2">
                <label htmlFor="description">Description:</label>
                <textarea 
                    name="description" 
                    id="description" 
                    placeholder="Project description"
                    className="rounded-md border border-input bg-background px-3 py-2"
                    rows={4}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="url">URL:</label>
                <input 
                    type="url" 
                    name="url" 
                    id="url" 
                    placeholder="Project URL"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="repoUrl">Repository URL:</label>
                <input 
                    type="url" 
                    name="repoUrl" 
                    id="repoUrl" 
                    placeholder="Repository URL"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label>Skills:</label>
                <SkillsMultiSelect skills={skillsList} name="skillIds" />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="status">Status:</label>
                <select 
                    name="status" 
                    id="status" 
                    className="rounded-md border border-input bg-background px-3 py-2"
                >
                    <option value="in-progress">In Progress</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <Button type="submit" className="w-fit">Create Project</Button>
        </form>
    );
}
