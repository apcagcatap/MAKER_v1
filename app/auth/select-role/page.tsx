"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Users, UserCog, Shield } from "lucide-react"

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<"participant" | "facilitator" | "admin" | null>(null)
  const router = useRouter()

  // Handle role selection and redirect to signup with role parameter
  const handleRoleSelect = (role: "participant" | "facilitator" | "admin") => {
    router.push(`/auth/signup?role=${role}`)
  }

  const roles = [
    {
      id: "participant" as const,
      title: "Participant",
      description: "Learn new skills, complete quests, and engage with the community",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "facilitator" as const,
      title: "Facilitator",
      description: "Create and manage quests, monitor participant progress",
      icon: UserCog,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "admin" as const,
      title: "Admin",
      description: "Full system access, manage users, content, and settings",
      icon: Shield,
      color: "from-orange-500 to-red-500",
    },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">MAKER</h1>
          <p className="text-white/90 text-xl">Choose Your Role</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card
                key={role.id}
                className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                  selectedRole === role.id ? "ring-4 ring-white" : ""
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRoleSelect(role.id)
                  }}
                  className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-white`}
                >
                  Select {role.title}
                </Button>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-white hover:text-white/80 font-medium">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
