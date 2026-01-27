import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { Trophy, TrendingUp, Target, Award, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default async function ParticipantDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { id } = await params

  // Fetch participant profile
  const { data: participant } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (!participant) {
    redirect("/facilitator/participants")
  }

  // Fetch participant's quests
  const { data: userQuests } = await supabase
    .from("user_quests")
    .select(`
      *,
      quest:quests(
        *,
        skill:skills(*)
      )
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  // Fetch participant's skills
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("user_id", id)

  const completedQuests = userQuests?.filter((uq) => uq.status === "completed") || []
  const inProgressQuests = userQuests?.filter((uq) => uq.status === "in_progress") || []

  return (
    <div className="min-h-screen">
      <FacilitatorNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/facilitator/participants"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Participants
        </Link>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {participant.display_name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{participant.display_name || "Unknown User"}</h1>
              <p className="text-white/90 mb-3 sm:mb-4 text-sm sm:text-base break-all">{participant.email}</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-base">Level {participant.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-base">{participant.xp} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">In Progress</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{inProgressQuests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Completed</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{completedQuests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Skills</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{userSkills?.length || 0}</p>
          </div>
        </div>

        {/* Quest Progress */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Quest Progress</h2>
          <div className="space-y-4">
            {userQuests?.map((userQuest) => (
              <div key={userQuest.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{userQuest.quest.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{userQuest.quest.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      userQuest.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : userQuest.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {userQuest.status.replace("_", " ")}
                  </span>
                </div>
                {userQuest.status === "in_progress" && (
                  <div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-purple-600">{userQuest.progress}%</span>
                    </div>
                    <Progress value={userQuest.progress} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {userSkills?.map((userSkill) => (
              <div key={userSkill.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl">{userSkill.skill.icon || "🎯"}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{userSkill.skill.name}</h3>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                      <span className="text-gray-600">Level {userSkill.level}</span>
                      <span className="font-semibold text-purple-600">{userSkill.xp} XP</span>
                    </div>
                    <Progress value={(userSkill.xp / (userSkill.level * 100)) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}