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
          <p className="text-xs sm:text-sm md:text-base text-white/80">Manage your account settings</p>
        </div>

        {/* Account Information Card */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg md:text-xl">Profile Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base">Update your account settings</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <AccountForm user={user} profile={profile} />
          </CardContent>
        </Card>

      </main>
    </div>
  )
}