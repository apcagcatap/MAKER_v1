import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { Trophy, TrendingUp, Target, Award, ArrowLeft, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { ParticipantProgressCard } from "@/components/facilitator/participant-progress-card"

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  // Fetch ALL quests to see which ones participant hasn't started
  const { data: allQuests } = await supabase
    .from("quests")
    .select("*")
    .eq("status", "Published")
    .eq("is_active", true)

  // Fetch participant's quest progress
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
  
  // Find not started quests
  const startedQuestIds = userQuests?.map(uq => uq.quest_id) || []
  const notStartedQuests = allQuests?.filter(q => !startedQuestIds.includes(q.id)) || []

  // Calculate risk indicators
  const atRiskQuests = inProgressQuests.filter(uq => uq.progress < 30)
  const stalledQuests = inProgressQuests.filter(uq => {
    const lastUpdate = new Date(uq.updated_at)
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceUpdate > 7 && uq.progress < 100
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add background wrapper for navbar */}
      <div className="bg-blue-900">
        <FacilitatorNav />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/facilitator/participants"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Participants
        </Link>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {participant.display_name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{participant.display_name || "Unknown User"}</h1>
              <p className="text-white/90 mb-4">{participant.email}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Level {participant.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span className="font-semibold">{participant.xp} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(atRiskQuests.length > 0 || stalledQuests.length > 0) && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">Attention Needed</h3>
                {atRiskQuests.length > 0 && (
                  <p className="text-sm text-red-800 mb-1">
                    • {atRiskQuests.length} quest{atRiskQuests.length !== 1 ? 's' : ''} with low progress (under 30%)
                  </p>
                )}
                {stalledQuests.length > 0 && (
                  <p className="text-sm text-red-800">
                    • {stalledQuests.length} quest{stalledQuests.length !== 1 ? 's' : ''} with no activity in 7+ days
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">In Progress</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{inProgressQuests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedQuests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Skills</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{userSkills?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Not Started</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{notStartedQuests.length}</p>
          </div>
        </div>

        {/* Quest Progress Sections */}
        <div className="space-y-8">
          {/* In Progress Quests */}
          {inProgressQuests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                In Progress ({inProgressQuests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressQuests.map((userQuest) => (
                  <ParticipantProgressCard key={userQuest.id} userQuest={userQuest} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-green-500" />
                Completed ({completedQuests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedQuests.map((userQuest) => (
                  <ParticipantProgressCard key={userQuest.id} userQuest={userQuest} />
                ))}
              </div>
            </div>
          )}

          {/* Not Started Quests */}
          {notStartedQuests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                Not Started ({notStartedQuests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notStartedQuests.map((quest) => (
                  <div key={quest.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-1">{quest.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{quest.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Participant hasn't started this quest yet</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {userSkills && userSkills.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSkills.map((userSkill) => (
                  <div key={userSkill.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{userSkill.skill.icon || "🎯"}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{userSkill.skill.name}</h3>
                        <div className="flex items-center justify-between text-sm mb-2">
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
          )}
        </div>
      </main>
    </div>
  )
}