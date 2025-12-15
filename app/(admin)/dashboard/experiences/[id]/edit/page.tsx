import { SkillsMultiSelect } from "@/components/skills-multi-select";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { experiences, skills } from "@/db/schema/portfolio";
import { updateExperience } from "@/lib/actions/experiences";
import { ExperienceData } from "@/lib/types";
import { eq } from "drizzle-orm";

export default async function UpdateExperienceDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = Number(params.id);

    const experience: ExperienceData | undefined   = await db.query.experiences.findFirst({
        where: eq(experiences.id, id),
        with: {
            experienceSkills: {
                columns: {},
                with: {
                    skill: {
                        columns: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    });

    if (!experience) return <p>Experience not found!</p>
    
    const experienceSkills = experience.experienceSkills.map(({ skill }) => skill.id);

    const skillsList = await db
        .select({ id: skills.id, name: skills.name })
        .from(skills);
        
    const updateExperienceWithId = updateExperience.bind(null, id);

    return (
        <form action={updateExperienceWithId} className="flex flex-col">
            <h1>Edit the experience {experience.company}!</h1>
            <div>
                <label htmlFor="role">Role:</label>
                <input type="text" name="role" id="role" placeholder="Software Engineer" defaultValue={experience.role} />
            </div>
            <div>
                <label htmlFor="company">Company:</label>
                <input type="text" name="company" id="company" placeholder="Company" defaultValue={experience.company} />
            </div>
            <div>
                <label htmlFor="companyUrl">Company URL:</label>
                <input type="text" name="companyUrl" id="companyUrl" placeholder="Company URL" defaultValue={experience.companyUrl ?? ''} />
            </div>
            <div>
                <label htmlFor="companyLogo">Company Logo:</label>
                <input type="text" name="companyLogo" id="companyLogo" placeholder="Company Logo" defaultValue={experience.companyLogo ?? ''} />
            </div>
            <div>
                <label htmlFor="description">Description:</label>
                <textarea name="description" id="description" placeholder="Description" defaultValue={experience.description} />
            </div>
            <div>
                <label htmlFor="startDate">Start Date:</label>
                <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    placeholder="Start Date"
                    defaultValue={experience.startDate ? experience.startDate.toISOString().slice(0, 10) : ''}
                />
            </div>
            <div>
                <label htmlFor="endDate">End Date:</label>
                <input type="date" name="endDate" id="endDate" placeholder="End Date" defaultValue={experience.endDate ? experience.endDate.toISOString().slice(0, 10) : '' } />
            </div>
            <div>
                <label htmlFor="location">Location:</label>
                <input type="text" name="location" id="location" placeholder="Location" defaultValue={experience.location ?? ''} />
            </div>
            <div className="space-y-2">
                <label htmlFor="skillIds">Skills:</label>
                <SkillsMultiSelect skills={skillsList} defaultValue={experienceSkills} name="skillIds" />
                <p className="text-xs text-muted-foreground">
                    Selecciona las tecnologías y herramientas usadas en la experiencia
                </p>
            </div>

            <Button variant={"default"} type="submit">Create experience!</Button>
        </form>
    )
}