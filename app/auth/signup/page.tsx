"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TermsAgreement } from "@/components/auth/terms-agreement"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import "../auth.css"

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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-brand">MAKER</h1>
          <p className="auth-tagline">Create your account</p>
        </div>

        <div className="auth-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="auth-card-title">Create Account</h2>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="auth-label">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="auth-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="auth-label">
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
                className="auth-input"
              />
            </div>

            <TermsAgreement
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              error={error && error.includes("Terms") ? error : undefined}
            />

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="auth-footer">
            <div className="text-center">
              <a href="/auth/login" className="auth-link">
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
