"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Listens for Supabase PASSWORD_RECOVERY auth events and redirects
 * to the update-password page. This is the most reliable way to handle
 * password reset redirects because it works regardless of what URL
 * Supabase initially lands the user on.
 */
export function AuthStateListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/update-password")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
