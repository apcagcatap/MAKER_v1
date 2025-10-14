import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Database, Mail, Shield } from "lucide-react"
import Image from "next/image"

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div
      className="min-h-screen bg-gradient-page-bg relative flex flex-col"
      style={{
        backgroundImage: `url("/navbarBg.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AdminNav />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-12 text-center">
          <div className="relative flex justify-center mb-8">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Image src="/hismarty.png" alt="Owl" width={200} height={200} className="object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg pt-48">
              System Settings
            </h1>
          </div>
          <p className="text-on-blue text-lg">Configure system-wide settings and preferences</p>
        </div>
      </div>

      <main className="relative z-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-interactive-primary" />
              <h2 className="text-2xl font-bold text-card-foreground">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName" className="text-card-foreground text-base">Site Name</Label>
                <Input id="siteName" defaultValue="MAKER" className="mt-2 bg-white text-gray-900 placeholder:text-gray-400 h-11" />
              </div>
              <div>
                <Label htmlFor="siteDescription" className="text-card-foreground text-base">Site Description</Label>
                <Textarea id="siteDescription" defaultValue="Level up your skills" className="mt-2 bg-white text-gray-900 placeholder:text-gray-400" rows={4} />
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-interactive-primary" />
              <h2 className="text-2xl font-bold text-card-foreground">Database</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground text-base">Database Status</p>
                  <p className="text-base text-muted-foreground">Connected to Supabase</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
              </div>
              <Button variant="outline" className="bg-white text-gray-900 hover:bg-brand-blue hover:text-white border-gray-300 hover:border-brand-blue transition-colors h-11">
                Run Database Migrations
              </Button>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-interactive-primary" />
              <h2 className="text-2xl font-bold text-card-foreground">Email Configuration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailFrom" className="text-card-foreground text-base">From Email</Label>
                <Input id="emailFrom" type="email" placeholder="noreply@maker.app" className="mt-2 bg-white text-gray-900 placeholder:text-gray-400 h-11" />
              </div>
              <div>
                <Label htmlFor="emailReply" className="text-card-foreground text-base">Reply-To Email</Label>
                <Input id="emailReply" type="email" placeholder="support@maker.app" className="mt-2 bg-white text-gray-900 placeholder:text-gray-400 h-11" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-interactive-primary" />
              <h2 className="text-2xl font-bold text-card-foreground">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground text-base">Row Level Security</p>
                  <p className="text-base text-muted-foreground">Database access control enabled</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground text-base">Email Verification</p>
                  <p className="text-base text-muted-foreground">Require email confirmation for new users</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Save Button - Full Width */}
          <div className="lg:col-span-2 flex justify-end">
            <Button className="bg-brand-blue hover:bg-brand-blue-hover text-white h-11 px-8">
              Save Changes
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-on-blue max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="text-sm text-on-blue pt-4 border-t border-brand-blue-hover/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
