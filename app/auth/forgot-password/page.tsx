// app/auth/forgot-password/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const redirectUrl = new URL("/auth/callback", window.location.origin)
    redirectUrl.searchParams.set("next", "/auth/update-password")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl.toString(),
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">MAKER</h1>
          <p className="text-blue-100 text-lg font-light">Recover your account</p>
        </div>

        <Card className="bg-blue-900 border-blue-800 shadow-2xl shadow-blue-900/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">Forgot Password</CardTitle>
            <CardDescription className="text-blue-200 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!success ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
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

                {error && (
                  <div className="bg-red-950/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isLoading ? "Sending link..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-4 rounded-xl text-sm">
                  Check your email for the password reset link.
                </div>
              </div>
            )}

            <div className="mt-6 text-center space-y-4">
              <div className="text-center">
                <Link href="/auth/login" className="text-blue-300 hover:text-white font-medium hover:underline underline-offset-4 transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
