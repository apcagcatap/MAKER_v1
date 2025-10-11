"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get role from URL parameter
  const role = searchParams.get("role") as "participant" | "facilitator" | "admin" | null

  // Redirect to role selection if no role is provided
  useEffect(() => {
    if (!role) {
      router.push("/auth/select-role")
    }
  }, [role, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Update profile with selected role
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role, display_name: displayName })
          .eq("id", data.user.id)

        if (profileError) throw profileError

        // Redirect to appropriate dashboard
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

  if (!role) {
    return null // Will redirect in useEffect
  }

  // Capitalize role for display
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">MAKER</h1>
          <p className="text-white/90 text-lg">Create your {roleDisplay} account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {roleDisplay}
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-700">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-12"
              />
            </div>

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
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push("/auth/select-role")}
              className="w-full text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Change role selection
            </button>
            <div className="text-center">
              <a href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
