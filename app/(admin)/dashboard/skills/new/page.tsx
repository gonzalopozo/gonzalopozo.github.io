import { createSkill } from "@/lib/actions/skills";

export default async function NewSkillDashboardPage() {
    return (
        <form action={createSkill} className="flex flex-col">
            <h1>Create new skill</h1>
            <div>
                <label htmlFor="name">Name:</label>
                <input type="text" name="name" id="name" placeholder="name" />
            </div>
            <div>
                <label htmlFor="type">Type:</label>
                <select name="type" id="type">
                    <option value="fullstack">Full Stack</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="database">Database</option>
                    <option value="devops">DevOps</option>
                    <option value="practices">Practices</option>
                    <option value="tools">Tools</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label htmlFor="icon">Icon:</label>
                <input type="text" name="icon" id="icon" placeholder="icon" />
            </div>
            <div>
                <label htmlFor="url">URL:</label>
                <input type="text" name="url" id="url" placeholder="url" />
            </div>
            <button type="submit">Create skill! </button>
        </form>
    )
}