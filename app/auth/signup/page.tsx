"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TermsAgreement } from "@/components/auth/terms-agreement"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get role from URL parameter
  const role = (searchParams.get("role") as "participant" | "facilitator" | "admin") || "participant"

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!termsAccepted) {
      setError("You must accept the Terms and Conditions to create an account.")
      setIsLoading(false)
      return
    }

    try {
      // Sign up the user with role in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role: role, // Include role in user metadata
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update profile with selected role (ensure it's set)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role, display_name: displayName })
          .eq("id", data.user.id)

        if (profileError) throw profileError

        // Wait a moment to ensure the update is complete
        await new Promise(resolve => setTimeout(resolve, 200))

        // Force a router refresh to ensure middleware runs
        router.refresh()
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

  // Capitalize role for display
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">MAKER</h1>
          <p className="text-blue-100 text-lg font-light">Create your account</p>
        </div>

        <Card className="bg-blue-900 border-blue-800 shadow-2xl shadow-blue-900/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">Create Account</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-blue-100 ml-1">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-12 bg-blue-950/50 border-blue-700 text-white placeholder:text-blue-400 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-blue-100 ml-1">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-blue-950/50 border-blue-700 text-white placeholder:text-blue-400 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-blue-100 ml-1">
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
                className="h-12 bg-blue-950/50 border-blue-700 text-white placeholder:text-blue-400 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
              />
            </div>

            <TermsAgreement
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              error={error && error.includes("Terms") ? error : undefined}
            />

            {error && (
              <div className="bg-red-950/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !termsAccepted}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="text-center">
              <a href="/auth/login" className="text-blue-300 hover:text-white font-medium hover:underline underline-offset-4 transition-colors">
                Already have an account? Sign in
              </a>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
