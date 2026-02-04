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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <ParticipantNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">Account Settings</h1>
          <p className="text-xs sm:text-sm md:text-base text-white/80">Manage your profile and account preferences</p>
        </div>

        {/* Account Information Card */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl">Profile Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base">Update your account details and personal information</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <AccountForm user={user} profile={profile} />
          </CardContent>
        </Card>

        {/* Stats Summary Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl">Your Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base">Overview of your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{profile.level}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Level</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{profile.xp}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Total XP</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">0</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Quests</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">0</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}