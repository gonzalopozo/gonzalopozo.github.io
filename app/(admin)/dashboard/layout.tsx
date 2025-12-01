import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard | Portfolio CMS",
  description: "Manage your portfolio content",
}

const mockUser = {
  id: "1",
  name: "Admin User",
  email: "admin@example.com",
  image: null,
}

export default function AdminLayout({ children }: { children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader user={mockUser} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
