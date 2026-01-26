// components/admin/users/user-toolbar.tsx
"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function UserToolbar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleRoleChange = (role: string) => {
    const params = new URLSearchParams(searchParams)
    if (role && role !== "all") {
      params.set("role", role)
    } else {
      params.delete("role")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const currentRole = searchParams.get("role") || "all"

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg">
        {["all", "facilitator", "participant", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => handleRoleChange(role)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
              currentRole === role
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  )
}
