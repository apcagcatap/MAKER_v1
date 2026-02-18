"use client"

import { useState } from "react"
import { FacilitatorGenerateVerification } from "@/components/facilitator/generate-verification"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Pencil,
  Check,
  X,
  Trophy,
  Award,
  Star,
} from "lucide-react"

interface ProfileViewProps {
  profile: any
  isOwnProfile: boolean
  completedQuests: any[]
  userSkills: any[]
  viewerRole: string
  activeQuests: any[]
}

export function ProfileView({ profile, isOwnProfile, completedQuests, userSkills, viewerRole, activeQuests }: ProfileViewProps) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState(profile.bio || "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSaveBio = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", profile.id)

    if (!error) {
      setIsEditingBio(false)
      router.refresh()
    }
    setSaving(false)
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
    .filter(Boolean)
    .join(" ")

  const location = [profile.barangay, profile.city_municipality, profile.province, profile.region]
    .filter(Boolean)
    .join(", ")

  const roleColors: Record<string, string> = {
    admin: "bg-[#ED262A] text-white",
    facilitator: "bg-[#004A98] text-white",
    participant: "bg-emerald-600 text-white",
  }

  return (
    <div className="space-y-6">
      {/* facilitator-only manual verification helper */}
      {viewerRole === "facilitator" && !isOwnProfile && profile.role === "participant" && (
        <div>
          <FacilitatorGenerateVerification
            participantId={profile.id}
            activeQuests={activeQuests}
          />
        </div>
      )}
      {/* Profile Header Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#004A98] to-[#0066cc]" />

        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.display_name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1E1E1E]">{profile.display_name}</h1>
                <Badge className={`${roleColors[profile.role] || "bg-gray-500 text-white"} text-xs`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
              </div>
              {fullName && (
                <p className="text-gray-500 text-sm mt-0.5">{fullName}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E]">Bio</CardTitle>
          {isOwnProfile && !isEditingBio && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingBio(true)}
              className="text-[#004A98] hover:text-[#003670] hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingBio ? (
            <div className="space-y-3">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="min-h-[100px] border-gray-300 focus:border-[#004A98] focus:ring-[#004A98]/20"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{bio.length}/500</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setBio(profile.bio || ""); setIsEditingBio(false) }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={saving}
                    className="bg-[#ED262A] hover:bg-[#c41e22] text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed">
              {profile.bio || (isOwnProfile ? "You haven't added a bio yet. Click Edit to add one!" : "No bio yet.")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E]">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.email && (
              <InfoItem icon={Mail} label="Email" value={profile.email} />
            )}
            {profile.phone && (
              <InfoItem icon={Phone} label="Phone" value={profile.phone} />
            )}
            {profile.sex && (
              <InfoItem icon={User} label="Sex" value={profile.sex} />
            )}
            {profile.birthdate && (
              <InfoItem icon={Calendar} label="Birthdate" value={new Date(profile.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} />
            )}
            {location && (
              <InfoItem icon={MapPin} label="Location" value={location} />
            )}
            {profile.occupation && (
              <InfoItem icon={Briefcase} label="Occupation" value={profile.occupation} />
            )}
            {profile.organization && (
              <InfoItem icon={Briefcase} label="Organization" value={profile.organization} />
            )}
            {profile.highest_education && (
              <InfoItem icon={GraduationCap} label="Education" value={profile.highest_education} />
            )}
          </div>
          {!profile.email && !profile.phone && !profile.sex && !profile.birthdate && !location && !profile.occupation && !profile.organization && !profile.highest_education && (
            <p className="text-gray-400 text-sm text-center py-4">No personal information available.</p>
          )}
        </CardContent>
      </Card>

      {/* Achievements / Completed Quests */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ED262A]" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedQuests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedQuests.map((uq) => (
                <div
                  key={uq.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  {uq.quest?.badge_image_url ? (
                    <img
                      src={uq.quest.badge_image_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[#1E1E1E] text-sm truncate">{uq.quest?.title || "Quest"}</p>
                    <p className="text-xs text-gray-500">
                      Completed {uq.completed_at ? new Date(uq.completed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No achievements yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E] flex items-center gap-2">
            <Star className="w-5 h-5 text-[#004A98]" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userSkills.map((us) => (
                <div
                  key={us.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100"
                >
                  <span className="text-sm">{us.skill?.icon || "⭐"}</span>
                  <div>
                    <p className="font-medium text-[#1E1E1E] text-sm">{us.skill?.name || "Skill"}</p>
                    <p className="text-xs text-[#004A98]">Level {us.level} · {us.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No skills earned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <Icon className="w-4 h-4 text-[#004A98] mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-[#1E1E1E] truncate">{value}</p>
      </div>
    </div>
  )
}
