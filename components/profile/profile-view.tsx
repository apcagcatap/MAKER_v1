"use client"

import { useState } from "react"
import { FacilitatorGenerateVerification } from "@/components/facilitator/generate-verification"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  User, MapPin, Briefcase, GraduationCap, Phone, Mail, Calendar,
  Pencil, Check, X, Trophy, Award, Star, ImageIcon,
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

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [infoFields, setInfoFields] = useState({
    phone: profile.phone || "",
    sex: profile.sex || "",
    birthdate: profile.birthdate || "",
    occupation: profile.occupation || "",
    organization: profile.organization || "",
    highest_education: profile.highest_education || "",
    barangay: profile.barangay || "",
    city_municipality: profile.city_municipality || "",
    province: profile.province || "",
    region: profile.region || "",
  })

  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null)

  const router = useRouter()

  const handleSaveBio = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ bio }).eq("id", profile.id)
    if (!error) { setIsEditingBio(false); router.refresh() }
    setSaving(false)
  }

  const handleSaveInfo = async () => {
    setSavingInfo(true)
    setInfoError(null)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({
      phone: infoFields.phone || null,
      sex: infoFields.sex || null,
      birthdate: infoFields.birthdate || null,
      occupation: infoFields.occupation || null,
      organization: infoFields.organization || null,
      highest_education: infoFields.highest_education || null,
      barangay: infoFields.barangay || null,
      city_municipality: infoFields.city_municipality || null,
      province: infoFields.province || null,
      region: infoFields.region || null,
    }).eq("id", profile.id)
    if (error) { setInfoError(error.message || "Failed to save changes.") }
    else { setIsEditingInfo(false); router.refresh() }
    setSavingInfo(false)
  }

  const handleCancelInfo = () => {
    setInfoFields({
      phone: profile.phone || "", sex: profile.sex || "", birthdate: profile.birthdate || "",
      occupation: profile.occupation || "", organization: profile.organization || "",
      highest_education: profile.highest_education || "", barangay: profile.barangay || "",
      city_municipality: profile.city_municipality || "", province: profile.province || "",
      region: profile.region || "",
    })
    setInfoError(null)
    setIsEditingInfo(false)
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name, profile.suffix].filter(Boolean).join(" ")
  const location = [profile.barangay, profile.city_municipality, profile.province, profile.region].filter(Boolean).join(", ")

  const roleColors: Record<string, string> = {
    admin: "bg-[#ED262A] text-white",
    facilitator: "bg-[#004A98] text-white",
    participant: "bg-emerald-600 text-white",
  }

  return (
    <div className="space-y-6">
      {viewerRole === "facilitator" && !isOwnProfile && profile.role === "participant" && (
        <div>
          <FacilitatorGenerateVerification participantId={profile.id} activeQuests={activeQuests} />
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1E1E1E]">Achievement Details</h2>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Title & date */}
              <div className="flex items-start gap-4">
                {selectedAchievement.quest?.badge_image_url ? (
                  <img src={selectedAchievement.quest.badge_image_url} alt="Badge" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1E1E1E] text-lg leading-tight">{selectedAchievement.quest?.title || "Quest"}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed{" "}
                    {selectedAchievement.completed_at
                      ? new Date(selectedAchievement.completed_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                  {selectedAchievement.quest?.xp_reward && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" />
                      {selectedAchievement.quest.xp_reward} XP
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedAchievement.quest?.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedAchievement.quest.description}</p>
                </div>
              )}

              {/* Difficulty */}
              {selectedAchievement.quest?.difficulty && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Difficulty</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#004A98]/10 text-[#004A98] font-medium capitalize">
                    {selectedAchievement.quest.difficulty}
                  </span>
                </div>
              )}

              {/* Badge */}
              {selectedAchievement.quest?.badge_image_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Badge</p>
                  <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <img src={selectedAchievement.quest.badge_image_url} alt="Quest Badge" className="max-h-40 object-contain" />
                  </div>
                </div>
              )}

              {/* Certificate */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Certificate</p>
                {selectedAchievement.quest?.certificate_image_url ? (
                  <>
                    <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <img src={selectedAchievement.quest.certificate_image_url} alt="Certificate" className="max-h-64 w-full object-contain rounded-lg" />
                    </div>
                    <a
                      href={selectedAchievement.quest.certificate_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 text-sm text-[#004A98] hover:underline"
                    >
                      <ImageIcon className="w-4 h-4" />
                      View full certificate
                    </a>
                  </>
                ) : (
                  <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200 text-gray-400 text-sm gap-2">
                    <ImageIcon className="w-4 h-4" />
                    No certificate available for this quest
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#004A98] to-[#0066cc]" />
        <CardContent className="relative pt-0 pb-6 px-6">
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
              {fullName && <p className="text-gray-500 text-sm mt-0.5">{fullName}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Card */}
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E]">Bio</CardTitle>
          {isOwnProfile && !isEditingBio && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(true)} className="text-[#004A98] hover:text-[#003670] hover:bg-blue-50">
              <Pencil className="w-4 h-4 mr-1" />Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingBio ? (
            <div className="space-y-3">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." className="min-h-[100px] border-gray-300 focus:border-[#004A98] focus:ring-[#004A98]/20" maxLength={500} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{bio.length}/500</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setBio(profile.bio || ""); setIsEditingBio(false) }}>
                    <X className="w-4 h-4 mr-1" />Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveBio} disabled={saving} className="bg-[#ED262A] hover:bg-[#c41e22] text-white">
                    <Check className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save"}
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
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E1E1E]">Personal Information</CardTitle>
          {isOwnProfile && !isEditingInfo && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)} className="text-[#004A98] hover:text-[#003670] hover:bg-blue-50">
              <Pencil className="w-4 h-4 mr-1" />Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#004A98]" /> Email</Label>
                  <Input value={profile.email || ""} disabled className="bg-gray-100 text-sm" />
                  <p className="text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-phone" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#004A98]" /> Phone</Label>
                  <Input id="edit-phone" value={infoFields.phone} onChange={(e) => setInfoFields(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 09XXXXXXXXX" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-sex" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#004A98]" /> Sex</Label>
                  <select id="edit-sex" value={infoFields.sex} onChange={(e) => setInfoFields(f => ({ ...f, sex: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004A98]/30 focus:border-[#004A98]">
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-birthdate" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#004A98]" /> Birthdate</Label>
                  <Input id="edit-birthdate" type="date" value={infoFields.birthdate} onChange={(e) => setInfoFields(f => ({ ...f, birthdate: e.target.value }))} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-occupation" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#004A98]" /> Occupation</Label>
                  <Input id="edit-occupation" value={infoFields.occupation} onChange={(e) => setInfoFields(f => ({ ...f, occupation: e.target.value }))} placeholder="Your occupation" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-organization" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#004A98]" /> Organization</Label>
                  <Input id="edit-organization" value={infoFields.organization} onChange={(e) => setInfoFields(f => ({ ...f, organization: e.target.value }))} placeholder="Your organization" className="text-sm" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="edit-education" className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#004A98]" /> Highest Education</Label>
                  <Input id="edit-education" value={infoFields.highest_education} onChange={(e) => setInfoFields(f => ({ ...f, highest_education: e.target.value }))} placeholder="e.g. Bachelor's Degree" className="text-sm" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-3"><MapPin className="w-3.5 h-3.5 text-[#004A98]" /> Location</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-barangay" className="text-xs text-gray-400">Barangay</Label>
                    <Input id="edit-barangay" value={infoFields.barangay} onChange={(e) => setInfoFields(f => ({ ...f, barangay: e.target.value }))} placeholder="Barangay" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-city" className="text-xs text-gray-400">City / Municipality</Label>
                    <Input id="edit-city" value={infoFields.city_municipality} onChange={(e) => setInfoFields(f => ({ ...f, city_municipality: e.target.value }))} placeholder="City / Municipality" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-province" className="text-xs text-gray-400">Province</Label>
                    <Input id="edit-province" value={infoFields.province} onChange={(e) => setInfoFields(f => ({ ...f, province: e.target.value }))} placeholder="Province" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-region" className="text-xs text-gray-400">Region</Label>
                    <Input id="edit-region" value={infoFields.region} onChange={(e) => setInfoFields(f => ({ ...f, region: e.target.value }))} placeholder="Region" className="text-sm" />
                  </div>
                </div>
              </div>
              {infoError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{infoError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleCancelInfo} disabled={savingInfo}><X className="w-4 h-4 mr-1" />Cancel</Button>
                <Button size="sm" onClick={handleSaveInfo} disabled={savingInfo} className="bg-[#ED262A] hover:bg-[#c41e22] text-white">
                  <Check className="w-4 h-4 mr-1" />{savingInfo ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.email && <InfoItem icon={Mail} label="Email" value={profile.email} />}
                {profile.phone && <InfoItem icon={Phone} label="Phone" value={profile.phone} />}
                {profile.sex && <InfoItem icon={User} label="Sex" value={profile.sex} />}
                {profile.birthdate && <InfoItem icon={Calendar} label="Birthdate" value={new Date(profile.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} />}
                {location && <InfoItem icon={MapPin} label="Location" value={location} />}
                {profile.occupation && <InfoItem icon={Briefcase} label="Occupation" value={profile.occupation} />}
                {profile.organization && <InfoItem icon={Briefcase} label="Organization" value={profile.organization} />}
                {profile.highest_education && <InfoItem icon={GraduationCap} label="Education" value={profile.highest_education} />}
              </div>
              {!profile.email && !profile.phone && !profile.sex && !profile.birthdate && !location && !profile.occupation && !profile.organization && !profile.highest_education && (
                <p className="text-gray-400 text-sm text-center py-4">
                  {isOwnProfile ? "No personal information yet. Click Edit to add some!" : "No personal information available."}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
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
                <button
                  key={uq.id}
                  onClick={() => setSelectedAchievement(uq)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-left hover:bg-blue-50 hover:border-[#004A98]/20 transition-colors group cursor-pointer"
                >
                  {uq.quest?.badge_image_url ? (
                    <img src={uq.quest.badge_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1E1E1E] text-sm truncate group-hover:text-[#004A98] transition-colors">{uq.quest?.title || "Quest"}</p>
                    <p className="text-xs text-gray-500">
                      Completed {uq.completed_at ? new Date(uq.completed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </p>
                  </div>
                </button>
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
                <div key={us.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
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