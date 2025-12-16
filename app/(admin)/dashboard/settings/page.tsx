// import { SiteSettingsForm } from "@/components/admin/settings/site-settings-form";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { updateSiteSettings } from "@/lib/actions/settings";
import { Settings } from "@/lib/types";

export default async function SettingsDasboardPage() {

    const settings: Settings | undefined = await db.query.siteSettings.findFirst();

    if (!settings) return <p>No settings found</p>

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
                <p className="text-muted-foreground">Manage your portfolio settings and employment status</p>
            </div>

            <form action={updateSiteSettings} className="flex flex-col">
                <div>
                    <label htmlFor="isEmployed">Is employed?</label>
                    <input type="checkbox" name="isEmployed" id="isEmployed" defaultChecked={settings.isEmployed ?? undefined} />
                </div>
                <div>
                    <label htmlFor="resumeUrl">Resume url:</label>
                    <input type="url" name="resumeUrl" id="resumeUrl" placeholder="https://drive.google.com/..." defaultValue={settings.resumeUrl} />
                </div>
                <div>
                    <label htmlFor="statusMessage">Status message:</label>
                    <input type="text" name="statusMessage" id="statusMessage" placeholder="I am open to..." defaultValue={settings.statusMessage ?? ''} />
                </div>

                <Button type="submit">Update site settings!</Button>
            </form>

            {/* <SiteSettingsForm settings={settings} /> */}
        </div>
    )
}