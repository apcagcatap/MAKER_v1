/**
 * Participant Account Settings Page
 *
 * This page allows participants to view and edit their account information including:
 * - Display name
 * - Email address
 * - Profile picture
 * - Password change
 *
 * The page fetches the current user's profile from Supabase and provides
 * a form to update their information.
 */

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountForm } from "@/components/account-form"

export default async function AccountPage() {
  // Get the authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile from database
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Redirect if profile doesn't exist or user is not a participant
  if (!profile || profile.role !== "participant") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParticipantNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and account preferences</p>
        </div>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details and personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm user={user} profile={profile} />
          </CardContent>
        </Card>

        {/* Stats Summary Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Overview of your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{profile.level}</div>
                <div className="text-sm text-gray-600 mt-1">Level</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{profile.xp}</div>
                <div className="text-sm text-gray-600 mt-1">Total XP</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600 mt-1">Quests</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600 mt-1">Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
