import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { FacilitatorVerification } from "@/components/facilitator/facilitator-verification"
import { ShieldCheck } from "lucide-react"

export default async function FacilitatorVerifyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "facilitator") redirect("/auth/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <FacilitatorNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Manual Verification
            </h1>
          </div>
          <p className="text-gray-500 ml-14">
            Enter the 6-character code shown on a participant&apos;s screen to
            confirm they&apos;ve completed a level.
          </p>
        </div>

        {/* Verification card */}
        <div className="flex justify-center">
          <FacilitatorVerification />
        </div>

        {/* How it works */}
        <div className="mt-10 max-w-md mx-auto bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
              The participant reaches a level that requires manual verification.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
              They click <strong>Get Verification Code</strong> and show you the displayed code.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
              You type the code above and click <strong>Verify</strong>.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">✓</span>
              The participant&apos;s screen instantly unlocks the <strong>Complete Level</strong> button.
            </li>
          </ol>
        </div>
      </main>
    </div>
  )
}