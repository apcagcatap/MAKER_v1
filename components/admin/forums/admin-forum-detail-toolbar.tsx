"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function AdminForumDetailToolbar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const handleArchiveFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams)
    if (filter && filter !== "active") {
      params.set("archived", filter)
    } else {
      params.delete("archived")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const currentFilter = searchParams.get("archived") || "active"

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500">
        Filter posts and replies by status
      </p>

      <div className="flex p-1 bg-gray-100 rounded-lg">
        {[
          { key: "active", label: "Active" },
          { key: "archived", label: "Archived" },
          { key: "all", label: "All" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleArchiveFilter(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentFilter === key
                ? "bg-white text-[#ED262A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
