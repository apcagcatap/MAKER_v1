import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Handle Authorization Code (PKCE Flow) - Standard for password resets
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
      return NextResponse.redirect(new URL(next, siteUrl))
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // redirect user to specified redirect URL or root of app
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
      return NextResponse.redirect(new URL(next, siteUrl))
    }
  }

  // return the user to an error page with some instructions
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  return NextResponse.redirect(new URL("/auth/auth-code-error", siteUrl))
}