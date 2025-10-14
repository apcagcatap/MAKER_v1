/**
 * About Page for Participants
 *
 * This page provides information about the Maker platform,
 * its mission, and how participants can make the most of their learning journey.
 */

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Info, Lightbulb, HelpCircle } from "lucide-react"

export default async function AboutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "participant") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      <div
        className="bg-gradient-to-br from-brand-blue-dark via-brand-blue-dark to-brand-blue-dark relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}
      >
        <div className="absolute inset-0 opacity-100 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/navbarBg.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "3rem",
              borderBottomRightRadius: "3rem",
            }}
          />
        </div>

        <div className="relative z-10">
          <ParticipantNav />
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">About MAKER</h1>
              <p className="text-xl text-on-blue max-w-2xl mx-auto">
                A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="space-y-6">
          {/* Main Description Card */}
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-card-foreground">What is MAKER?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary text-lg leading-relaxed mb-4">
                MAKER is an innovative gamified learning platform designed to transform how you develop new skills through engaging quests and hands-on challenges.
              </p>
              <p className="text-secondary text-lg leading-relaxed">
                Our mission is to make learning interactive, fun, and rewarding for everyone—empowering makers to explore technology, build projects, and unlock their creative potential.
              </p>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-card-foreground">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-secondary text-base">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Choose quests that interest you from various skill categories</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Complete tasks and challenges to earn XP and level up</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Track your progress and unlock new skills as you advance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Connect with other makers in the community forums to share knowledge</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Institution Info */}
          <Card className="shadow-lg border-0 bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Powered by</p>
                <h3 className="font-bold text-card-foreground">Department of Science and Technology</h3>
                <p className="text-secondary">Science and Technology Information Institute</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-3">Contact & Support</h3>
            <p className="text-base text-gray-700">
              Need help? Reach out to our support team at{' '}
              <a href="mailto:support@maker.app" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">support@maker.app</a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
