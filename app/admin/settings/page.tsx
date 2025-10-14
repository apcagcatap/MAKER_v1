import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Database, Mail, Shield } from "lucide-react"

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-page-bg">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-blue-100">Configure system-wide settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-card-foreground">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName" className="text-card-foreground">Site Name</Label>
                <Input id="siteName" defaultValue="MAKER" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="siteDescription" className="text-card-foreground">Site Description</Label>
                <Textarea id="siteDescription" defaultValue="Level up your skills" className="mt-2" rows={3} />
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-card-foreground">Database</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground">Database Status</p>
                  <p className="text-sm text-muted-foreground">Connected to Supabase</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
              </div>
              <Button variant="outline" className="bg-transparent">
                Run Database Migrations
              </Button>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-card-foreground">Email Configuration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailFrom" className="text-card-foreground">From Email</Label>
                <Input id="emailFrom" type="email" placeholder="noreply@maker.app" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="emailReply" className="text-card-foreground">Reply-To Email</Label>
                <Input id="emailReply" type="email" placeholder="support@maker.app" className="mt-2" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-card-foreground">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground">Row Level Security</p>
                  <p className="text-sm text-muted-foreground">Database access control enabled</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-card-foreground">Email Verification</p>
                  <p className="text-sm text-muted-foreground">Require email confirmation for new users</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-blue-700/30 text-center">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-blue-100 max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex justify-center gap-8 text-sm text-blue-100">
              <a href="/admin/forums" className="hover:text-white transition-colors">Community Forums</a>
              <a href="/admin/settings" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="text-sm text-blue-200 pt-4 border-t border-blue-700/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
