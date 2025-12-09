import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The public portfolio is coming soon. For now, you can access the login page to manage your portfolio.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/login">Go to login!</Link>
        </Button>
      </main>
    </div>
  )
}
