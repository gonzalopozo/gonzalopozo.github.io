import { db } from "./index";
import { users, accounts } from "./schema/better-auth";
import { siteSettings } from "./schema/portfolio";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";


const scryptAsync = promisify(scrypt);

/**
 * Hash password using scrypt (same algorithm Better Auth uses by default)
 * Format: salt:hash (both in hex)
 */
async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

function generateId(): string {
    return randomBytes(16).toString("hex");
}

async function seed() {
    console.log("🌱 Starting seed...");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Admin";

    if (!adminEmail || !adminPassword) {
        console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables");
        console.error("   Add these to your .env file:");
        console.error("   ADMIN_EMAIL=your-email@example.com");
        console.error("   ADMIN_PASSWORD=your-secure-password");
        console.error("   ADMIN_NAME=Your Name");
        process.exit(1);
    }

    // Check if admin user already exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

    if (existingUser.length > 0) {
        console.log("✅ Admin user already exists, skipping user creation...");
    } else {
        // Create user ID
        const userId = generateId();

        // Hash the password
        console.log("🔐 Hashing password...");
        const hashedPassword = await hashPassword(adminPassword);

        // Insert admin user
        await db.insert(users).values({
            id: userId,
            name: adminName,
            email: adminEmail,
            emailVerified: true, // Admin is pre-verified
        });
        console.log("✅ Admin user created");

        // Insert account with password (Better Auth stores passwords in accounts table, not in users table)
        await db.insert(accounts).values({
            id: generateId(),
            userId: userId,
            accountId: userId, // For credential accounts, accountId = userId
            providerId: "credential", // This tells Better Auth it's email/password auth
            password: hashedPassword,
        });
        console.log("✅ Admin credentials created");
    }

    // Initialize site settings if not exists
    const existingSettings = await db.select().from(siteSettings).limit(1);

    if (existingSettings.length === 0) {
        await db.insert(siteSettings).values({
            isEmployed: false,
            resumeUrl: "",
            statusMessage: "Open to opportunities",
        });
        console.log("✅ Site settings initialized");
    } else {
        console.log("✅ Site settings already exist, skipping...");
    }

    console.log("");
    console.log("🎉 Seed completed!");
    console.log("");
    console.log("📧 Admin email:", adminEmail);
    console.log("🔑 Use the password from your ADMIN_PASSWORD env variable to login");
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    });
