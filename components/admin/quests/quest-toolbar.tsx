"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function QuestToolbar() {
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

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status && status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleArchiveFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams)
    if (filter && filter !== "active") {
      params.set("archived", filter)
    } else {
      params.delete("archived")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const currentStatus = searchParams.get("status") || "all"
  const currentArchive = searchParams.get("archived") || "active"

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search quests..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue={searchParams.get("q")?.toString()}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            {[
              { key: "active", label: "Active" },
              { key: "archived", label: "Archived" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleArchiveFilter(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  currentArchive === key
                    ? "bg-white text-[#ED262A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg">
            {["all", "Draft", "Published", "Archived"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                  currentStatus === status
                    ? "bg-white text-[#ED262A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}