/**
 * Account Form Component
 *
 * A client-side form component that allows users to update their account information.
 * Handles form submission, validation, and displays success/error messages.
 *
 * Features:
 * - Update display name
 * - View email (read-only)
 * - Change password
 * - Real-time form validation
 * - Success/error feedback
 */

"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface AccountFormProps {
  user: any
  profile: any
}

export function AccountForm({ user, profile }: AccountFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  /**
   * Handle form submission to update user profile
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      // Update display name in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (passwordError) throw passwordError
      }

      setMessage({ type: "success", text: "Account updated successfully!" })
      setNewPassword("")
      setConfirmPassword("")

      // Refresh the page to show updated data
      router.refresh()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update account" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name Field */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          required
        />
      </div>

      {/* Email Field (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={user.email} disabled className="bg-gray-100" />
        <p className="text-sm text-gray-500">Email cannot be changed</p>
      </div>

      {/* Password Change Section */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
