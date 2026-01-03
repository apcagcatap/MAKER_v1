// app/waiting-room/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function WaitingRoomPage() {
  const [displayName, setDisplayName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: userData } = await supabase
        .from("user")
        .select("display_name")
        .eq("id", user.id)
        .single()

      if (userData) {
        setDisplayName(userData.display_name || "User")
      }

      // Check if user has any workshop assignments
      const { data: workshops } = await supabase
        .from("workshop_user")
        .select("role")
        .eq("user_id", user.id)

      if (workshops && workshops.length > 0) {
        // User has assignments, redirect
        const hasAdmin = workshops.some(w => w.role === 'Admin')
        const hasFacilitator = workshops.some(w => w.role === 'Facilitator')
        
        if (hasAdmin) router.push("/admin")
        else if (hasFacilitator) router.push("/facilitator")
        else router.push("/participant")
      } else {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router, supabase])

  if (isLoading) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {displayName}
            </h1>
            <p className="text-gray-600">
              You're not assigned to any workshops yet.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              An administrator will assign you to a workshop soon. You'll receive access once assigned.
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push("/auth/login")
            }}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}