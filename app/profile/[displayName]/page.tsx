import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/profile/profile-view"
import { UserSearchSidebar } from "@/components/profile/user-search-sidebar"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { AdminNav } from "@/components/layout/admin-nav"

interface ProfilePageProps {
  params: Promise<{ displayName: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { displayName } = await params
  const decodedName = decodeURIComponent(displayName)

  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!currentProfile) {
    redirect("/auth/login")
  }

  // Get the viewed profile by display_name
  const { data: viewedProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("display_name", decodedName)
    .single()

  if (!viewedProfile) {
    notFound()
  }

  const isOwnProfile = viewedProfile.id === user.id

  // Get user's completed quests with badge info
  const { data: userQuests } = await supabase
    .from("user_quests")
    .select(`
      *,
      quest:quests(*)
    `)
    .eq("user_id", viewedProfile.id)
    .eq("status", "completed")

  // fetch active / in-progress quests so facilitators can generate verification codes
  const { data: activeQuests } = await supabase
    .from("user_quests")
    .select(`
      id,
      current_level,
      status,
      quest:quests(id, title, levels)
    `)
    .eq("user_id", viewedProfile.id)
    .eq("status", "in_progress")

  // Get user's skills
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("user_id", viewedProfile.id)

  // Get all users for sidebar search
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("archived", false)
    .order("display_name", { ascending: true })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#004A98" }}>
      {/* Role-based Navigation */}
      <div className="bg-[#004A98]">
        {currentProfile.role === "participant" && <ParticipantNav />}
        {currentProfile.role === "facilitator" && <FacilitatorNav />}
        {currentProfile.role === "admin" && <AdminNav />}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Profile Content */}
          <div className="flex-1 min-w-0">
            <ProfileView
              profile={viewedProfile}
              isOwnProfile={isOwnProfile}
              completedQuests={userQuests || []}
              userSkills={userSkills || []}
              viewerRole={currentProfile.role}
              activeQuests={activeQuests || []}
            />
          </div>

          {/* User Search Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <UserSearchSidebar
              users={allUsers || []}
              currentProfileId={viewedProfile.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
