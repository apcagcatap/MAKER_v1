"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TermsAgreement } from "@/components/auth/terms-agreement"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"

const SUFFIX_OPTIONS = ["Jr.", "Sr.", "II", "III", "IV", "V"]
const SEX_OPTIONS = ["Male", "Female"] as const
const EDUCATION_OPTIONS = [
  "Elementary",
  "High School",
  "Senior High School",
  "Vocational/Technical",
  "College/Bachelor's Degree",
  "Master's Degree",
  "Doctorate/PhD",
]

function SignupContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    sex: "" as "" | "Male" | "Female",
    birthdate: "",
    phone: "",
    region: "",
    province: "",
    cityMunicipality: "",
    barangay: "",
    occupation: "",
    organization: "",
    highestEducation: "",
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const role = (searchParams.get("role") as "participant" | "facilitator") || "participant"

  const today = new Date()
  const maxYear = today.getFullYear() - 12
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const maxDate = `${maxYear}-${month}-${day}`

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!termsAccepted) {
      setError("You must accept the Terms and Conditions to create an account.")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const displayName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
        .filter(Boolean)
        .join(" ")

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: displayName,
            role: role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role,
            display_name: displayName,
            first_name: formData.firstName || null,
            middle_name: formData.middleName || null,
            last_name: formData.lastName || null,
            suffix: formData.suffix || null,
            sex: formData.sex || null,
            birthdate: formData.birthdate || null,
            phone: formData.phone || null,
            region: formData.region || null,
            province: formData.province || null,
            city_municipality: formData.cityMunicipality || null,
            barangay: formData.barangay || null,
            occupation: formData.occupation || null,
            organization: formData.organization || null,
            highest_education: formData.highestEducation || null,
          })
          .eq("id", data.user.id)

        if (profileError) throw profileError

        await new Promise((resolve) => setTimeout(resolve, 200))
        router.refresh()
        router.push(`/${role}`)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("already registered")) {
          setError("This email is already registered. Please sign in instead.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    "h-11 bg-white border-gray-300 text-[#1E1E1E] placeholder:text-gray-400 focus:border-[#004A98] focus:ring-[#004A98]/20 transition-all duration-200 rounded-lg"
  const labelClass = "text-sm font-medium text-[#1E1E1E] ml-0.5"
  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-[#1E1E1E] focus:border-[#004A98] focus:ring-[#004A98]/20 focus:outline-none transition-all duration-200 text-sm"

  return (
    <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">MAKER</h1>
        <p className="text-white/80 text-lg font-light">Create your account</p>
      </div>

      <Card className="bg-white border-gray-200 shadow-2xl rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-4xl font-bold text-[#1E1E1E] text-center">Registration Form</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Account Credentials */}
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold text-[#004A98] border-b border-gray-200 pb-2 mb-3 w-full">
                Account Credentials
              </legend>
              <div className="space-y-2">
                <Label htmlFor="email" className={labelClass}>Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className={labelClass}>Password</Label>
                  <Input id="password" type="password" placeholder="Min 6 characters" value={formData.password} onChange={(e) => updateField("password", e.target.value)} required minLength={6} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={labelClass}>Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required minLength={6} className={inputClass} />
                </div>
              </div>
            </fieldset>

            {/* Personal Information */}
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold text-[#004A98] border-b border-gray-200 pb-2 mb-3 w-full">
                Personal Information
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={labelClass}>First Name</Label>
                  <Input id="firstName" type="text" placeholder="Juan" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName" className={labelClass}>Middle Name</Label>
                  <Input id="middleName" type="text" placeholder="Santos" value={formData.middleName} onChange={(e) => updateField("middleName", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={labelClass}>Last Name</Label>
                  <Input id="lastName" type="text" placeholder="Dela Cruz" value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix" className={labelClass}>Suffix</Label>
                  <select id="suffix" value={formData.suffix} onChange={(e) => updateField("suffix", e.target.value)} className={selectClass}>
                    <option value="">None</option>
                    {SUFFIX_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sex" className={labelClass}>Sex</Label>
                  <select id="sex" value={formData.sex} onChange={(e) => updateField("sex", e.target.value)} required className={selectClass}>
                    <option value="" disabled>Select</option>
                    {SEX_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate" className={labelClass}>Birthdate</Label>
                  <Input id="birthdate" type="date" value={formData.birthdate} onChange={(e) => updateField("birthdate", e.target.value)} required max={maxDate} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className={labelClass}>Phone</Label>
                  <Input id="phone" type="tel" placeholder="+639XXXXXXXXX" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} required className={inputClass} />
                </div>
              </div>
            </fieldset>

            {/* Address */}
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold text-[#004A98] border-b border-gray-200 pb-2 mb-3 w-full">
                Address
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region" className={labelClass}>Region</Label>
                  <Input id="region" type="text" placeholder="e.g., NCR, Region IV-A" value={formData.region} onChange={(e) => updateField("region", e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province" className={labelClass}>Province</Label>
                  <Input id="province" type="text" placeholder="e.g., Laguna" value={formData.province} onChange={(e) => updateField("province", e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cityMunicipality" className={labelClass}>City / Municipality</Label>
                  <Input id="cityMunicipality" type="text" placeholder="e.g., Los Baños" value={formData.cityMunicipality} onChange={(e) => updateField("cityMunicipality", e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay" className={labelClass}>Barangay</Label>
                  <Input id="barangay" type="text" placeholder="e.g., Brgy. Batong Malake" value={formData.barangay} onChange={(e) => updateField("barangay", e.target.value)} required className={inputClass} />
                </div>
              </div>
            </fieldset>

            {/* Professional / Educational */}
            <fieldset className="space-y-4">
              <legend className="text-base font-semibold text-[#004A98] border-b border-gray-200 pb-2 mb-3 w-full">
                Professional / Educational Background
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation" className={labelClass}>Occupation</Label>
                  <Input id="occupation" type="text" placeholder="e.g., Engineer, Student" value={formData.occupation} onChange={(e) => updateField("occupation", e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization" className={labelClass}>Organization / School</Label>
                  <Input id="organization" type="text" placeholder="e.g., DOST-STII" value={formData.organization} onChange={(e) => updateField("organization", e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestEducation" className={labelClass}>Highest Educational Attainment</Label>
                <select id="highestEducation" value={formData.highestEducation} onChange={(e) => updateField("highestEducation", e.target.value)} required className={selectClass}>
                  <option value="">Select</option>
                  {EDUCATION_OPTIONS.map((ed) => (
                    <option key={ed} value={ed}>{ed}</option>
                  ))}
                </select>
              </div>
            </fieldset>

            {/* Terms & Submit */}
            <div className="space-y-4 pt-2">
              <TermsAgreement
                checked={termsAccepted}
                onCheckedChange={setTermsAccepted}
                error={error && error.includes("Terms") ? error : undefined}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">{error}</div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !termsAccepted}
                className="w-full h-12 bg-[#ED262A] hover:bg-[#c41e22] text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ED262A] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/login" className="text-[#004A98] hover:text-[#003670] font-medium hover:underline underline-offset-4 transition-colors">
              Already have an account? Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-8" style={{ backgroundColor: "#004A98" }}>
      <Suspense fallback={<div className="text-white text-lg">Loading form...</div>}>
        <SignupContent />
      </Suspense>
    </div>
  )
}