import { SkillsMultiSelect } from "@/components/skills-multi-select";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { projects, skills } from "@/db/schema/portfolio";
import { updateProject } from "@/lib/actions/projects";
import { ProjectInfo } from "@/lib/types";
import { eq } from "drizzle-orm";

export default async function UpdateProjectDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = Number(params.id);

    const project: ProjectInfo | undefined = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: {
            projectSkills: {
                columns: {},
                with: {
                    skill: {
                        columns: {
                            id: true,
                            name: true
                        },
                    }
                }
            }
        }
    })

    if (!project) return <p>Project not found</p>

    const projectSkill = project.projectSkills.map(({ skill }) => skill.id);

    const skillsList = await db
        .select({ id: skills.id, name: skills.name })
        .from(skills);

    const updateProjectWithId = updateProject.bind(null, id);

    return (
        <form action={updateProjectWithId} className="flex flex-col gap-4 items-start justify-start">
            <h1 className="text-2xl font-bold">Edit the project {project.title}</h1>

            <div className="flex flex-col gap-2">
                <label htmlFor="title">Title:</label>
                <input
                    type="text"
                    name="title"
                    id="title"
                    placeholder="Project title"
                    className="rounded-md border border-input bg-background px-3 py-2"
                    defaultValue={project.title}
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
                    defaultValue={project.description}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="url">URL:</label>
                <input
                    type="url"
                    name="url"
                    id="url"
                    placeholder="Project URL"
                    defaultValue={project.url ?? ''}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="repoUrl">Repository URL:</label>
                <input
                    type="url"
                    name="repoUrl"
                    id="repoUrl"
                    placeholder="Repository URL"
                    defaultValue={project.repoUrl ?? ''}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label>Skills:</label>
                <SkillsMultiSelect skills={skillsList} defaultValue={projectSkill} name="skillIds" />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="status">Status:</label>
                <select
                    name="status"
                    id="status"
                    className="rounded-md border border-input bg-background px-3 py-2"
                    defaultValue={project.status}
                >
                    <option value="in-progress">In Progress</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <Button type="submit" className="w-fit">Update Project</Button>
        </form>
    );
}