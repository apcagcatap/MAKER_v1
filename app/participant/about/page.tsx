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
    <div className="min-h-screen">
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
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
          {/* Hero Card */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xl">
              <div className="flex-shrink-0">
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Maker Logo" 
                  width={80} 
                  height={80} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow" 
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 drop-shadow-lg">About Maker</h1>
                <p className="text-base sm:text-lg font-medium text-white/80 mb-1">Gamified learning, made for makers.</p>
                <p className="text-sm sm:text-base text-white/70">Discover our story, our mission, and how you can level up your skills!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-7">
          {/* What is Maker */}
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-2">
              <div className="bg-blue-100 text-blue-700 rounded-xl p-3">
                <Info className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold">What is Maker?</CardTitle>
            </CardHeader>
            <CardContent className="sm:pl-16 pt-0 pb-6">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                Maker is a gamified learning platform designed to help you develop new skills through engaging quests and challenges.<br/>
                <span className="block mt-1">Our mission is to make learning fun, interactive, and rewarding for everyone.</span>
              </p>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-2">
              <div className="bg-yellow-100 text-yellow-700 rounded-xl p-3">
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="sm:pl-16 pt-0 pb-6">
              <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  Choose quests that interest you from various skill categories
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  Complete tasks and challenges to earn XP and level up
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  Track your progress and unlock new skills as you advance
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">4.</span>
                  Connect with other learners in the forums to share knowledge
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact & Support */}
          <Card className="shadow-md border-0 bg-white/90">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-2">
              <div className="bg-purple-100 text-purple-700 rounded-xl p-3">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold">Contact & Support</CardTitle>
            </CardHeader>
            <CardContent className="sm:pl-16 pt-0 pb-6">
              <p className="text-gray-700 text-sm sm:text-base">
                Need help? Have questions? Reach out to our support team at{' '}
                <a href="mailto:support@maker.com" className="text-purple-600 font-semibold hover:underline">
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