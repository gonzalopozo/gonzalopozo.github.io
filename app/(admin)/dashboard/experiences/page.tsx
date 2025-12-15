import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { deleteExperience } from "@/lib/actions/experiences";
import { ExperienceData } from "@/lib/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export default async function ExperiencesDashboardPage() {

    const experiencesData: ExperienceData[] = await db.query.experiences.findMany({
        with: {
            experienceSkills: {
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
    });

    if (experiencesData.length === 0) return (<>
        <Button variant={"link"}>
            <Link href={"/dashboard/experiences/new"}>Create new experience</Link>
        </Button>
        <p>No experiences found</p>
    </>)

    return (
        <>
            <Button variant={"link"}>
                <Link href={"/dashboard/experiences/new"}>Create new experience</Link>
            </Button>

            <div>
                {experiencesData.map(experience => (
                    <ul key={experience.id}>
                        <li>ID: {experience.id}</li>
                        <li>Description: {experience.description}</li>
                        <li>Order: {experience.order}</li>
                        <li>CreatedAt: {experience.createdAt.toISOString()}</li>
                        <li>UpdatedAt: {experience.updatedAt.toISOString()}</li>
                        <li>Role: {experience.role}</li>
                        <li>Company: {experience.company}</li>
                        <li>CompanyUrl: {experience.companyUrl}</li>
                        <li>CompanyLogo: {experience.companyLogo}</li>
                        <li>StartDate: {experience.startDate?.toISOString()}</li>
                        <li>EndDate: {experience.endDate?.toISOString()}</li>
                        <li>Location: {experience.location}</li>
                        <li>ExperienceSkills: {experience.experienceSkills.map(skill => skill.skill.name).join(", ")}</li>
                        <Button variant={"link"}>
                            <Link href={`/dashboard/experiences/${experience.id}/edit`}>
                                Edit this experience!
                            </Link>
                        </Button>
                        <Button onClick={deleteExperience.bind(null, experience.id)} variant={"destructive"}>
                            <Trash2 />
                            Edit this experience!
                        </Button>
                    </ul>
                ))}
            </div>
        </>
    )

}