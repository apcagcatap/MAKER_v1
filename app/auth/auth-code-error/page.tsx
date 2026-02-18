"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react" //
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// 1. ISOLATE THE LOGIC INTO A SEPARATE COMPONENT
function ErrorContent() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState("Something went wrong")
  const [errorDescription, setErrorDescription] = useState("Please try again later.")

  useEffect(() => {
    // Try to get error from query params
    const error = searchParams.get("error")
    const description = searchParams.get("error_description")
    const code = searchParams.get("error_code")

    if (error || code) {
      setErrorMessage(code || error || "Error")
      if (description) setErrorDescription(description)
    } else {
      // Fallback: Try to parse hash if query params are missing
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const hashError = params.get("error")
      const hashCode = params.get("error_code")
      const hashDesc = params.get("error_description")

      if (hashError || hashCode) {
        setErrorMessage(hashCode || hashError || "Error")
        if (hashDesc) setErrorDescription(hashDesc.replace(/\+/g, " "))
      }
    }
  }, [searchParams])

  const isExpired = errorMessage === "otp_expired"

  return (
    <Card className="bg-white border-gray-200 shadow-2xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#1E1E1E] text-center">
          {isExpired ? "Link Expired" : "Access Denied"}
        </CardTitle>
        <CardDescription className="text-gray-500 text-center">
          {errorDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-sm text-center">
          {isExpired 
            ? "This link has already been used or has expired. Please request a new password reset link."
            : "We could not verify your request. Please try again."}
        </div>

        <Button
          asChild
          className="w-full h-12 bg-[#ED262A] hover:bg-[#c41e22] text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <Link href="/auth/forgot-password">
            Request New Link
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// 2. MAIN PAGE COMPONENT (WRAPS THE LOGIC IN SUSPENSE)
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: "#004A98" }}>
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">MAKER</h1>
          <p className="text-white/80 text-lg font-light">Authentication Error</p>
        </div>

        {/* This Suspense boundary fixes the build error */}
        <Suspense fallback={<div className="text-white text-center">Loading error details...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  )
}