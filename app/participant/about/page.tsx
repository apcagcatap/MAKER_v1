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
    <div className="min-h-screen bg-gray-50">
      <ParticipantNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">About Maker</h1>
          <p className="text-gray-600">Learn more about our platform and mission</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What is Maker?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Maker is a gamified learning platform designed to help you develop new skills through engaging quests
                and challenges. Our mission is to make learning fun, interactive, and rewarding for everyone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Choose quests that interest you from various skill categories</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Complete tasks and challenges to earn XP and level up</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Track your progress and unlock new skills as you advance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Connect with other learners in the forums to share knowledge</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Need help? Have questions? Reach out to our support team at{" "}
                <a href="mailto:support@maker.com" className="text-purple-600 hover:underline">
                  support@maker.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
