"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  const supabase = createClient()
  setIsLoading(true)
  setError(null)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single()

      if (userError || !userData) {
        throw new Error("User not found")
      }

      // Check workshop assignments to determine role/redirect
      const { data: workshops, error: workshopError } = await supabase
        .from("workshop_user")
        .select("role, workshop_id")
        .eq("user_id", data.user.id)

      // Redirect logic based on workshop assignments
      if (workshops && workshops.length > 0) {
        const hasAdmin = workshops.some(w => w.role === 'Admin')
        const hasFacilitator = workshops.some(w => w.role === 'Facilitator')
        
        if (hasAdmin) {
          router.push("/admin")
        } else if (hasFacilitator) {
          router.push("/facilitator")
        } else {
          router.push("/participant")
        }
      } else {
        router.push("/waiting-room")
      }

      router.refresh()
    }
  } catch (error: unknown) {
    // error handling
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">MAKER</h1>
          <p className="text-white/90 text-lg">Level up your skills</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              Don't have an account? Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
