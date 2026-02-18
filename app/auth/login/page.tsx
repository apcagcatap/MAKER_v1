"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.refresh()
      router.push("/")
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
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: "#004A98" }}>
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">MAKER</h1>
          <p className="text-white/80 text-lg font-light">Welcome back</p>
        </div>

        <Card className="bg-white border-gray-200 shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1E1E1E] text-center">Sign In</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1E1E1E] ml-1">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white border-gray-300 text-[#1E1E1E] placeholder:text-gray-400 focus:border-[#004A98] focus:ring-[#004A98]/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-[#1E1E1E] ml-1">
                    Password
                  </Label>
                  <Link href="/auth/forgot-password" className="text-xs text-[#004A98] hover:text-[#003670] hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white border-gray-300 text-[#1E1E1E] placeholder:text-gray-400 focus:border-[#004A98] focus:ring-[#004A98]/20 transition-all duration-200"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ED262A] hover:bg-[#c41e22] text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ED262A] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <div className="text-center">
                <a href="/auth/signup" className="text-[#004A98] hover:text-[#003670] font-medium hover:underline underline-offset-4 transition-colors">
                  Don&apos;t have an account? Sign up
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}