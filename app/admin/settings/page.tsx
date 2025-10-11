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
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" defaultValue="MAKER" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea id="siteDescription" defaultValue="Level up your skills" className="mt-2" rows={3} />
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Database</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Database Status</p>
                  <p className="text-sm text-gray-600">Connected to Supabase</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
              </div>
              <Button variant="outline" className="bg-transparent">
                Run Database Migrations
              </Button>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Email Configuration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailFrom">From Email</Label>
                <Input id="emailFrom" type="email" placeholder="noreply@maker.app" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="emailReply">Reply-To Email</Label>
                <Input id="emailReply" type="email" placeholder="support@maker.app" className="mt-2" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Row Level Security</p>
                  <p className="text-sm text-gray-600">Database access control enabled</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-600">Require email confirmation for new users</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
