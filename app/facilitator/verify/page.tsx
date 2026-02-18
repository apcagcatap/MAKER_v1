import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { FacilitatorVerification } from "@/components/facilitator/facilitator-verification"
import { ShieldCheck } from "lucide-react"

export default async function FacilitatorVerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "facilitator") redirect("/auth/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900">
        <FacilitatorNav />
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Manual Verification
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Enter the code from a participant&apos;s screen to unlock their level.
            </p>
          </div>
        </div>

        {/* Verification card */}
        <FacilitatorVerification facilitatorId={user.id} />

        {/* How it works */}
        <div className="mt-4 sm:mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">How it works</h2>
          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">1</span>
              <p className="text-xs sm:text-sm text-gray-600">
                Participant clicks <strong>Get Verification Code</strong> on their level page.
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">2</span>
              <p className="text-xs sm:text-sm text-gray-600">
                They show you the 6-character code on their screen.
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">3</span>
              <p className="text-xs sm:text-sm text-gray-600">
                Type it above and tap <strong>Verify</strong>.
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">✓</span>
              <p className="text-xs sm:text-sm text-gray-600">
                Their <strong>Complete Level</strong> button unlocks automatically within seconds.
              </p>
            </li>
          </ol>
        </div>
      </main>
    </div>
  )
}