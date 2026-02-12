"use client"

import { TermsManager } from "@/lib/services/TermsManager"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function TermsOfService() {
  const terms = TermsManager.getInstance().getCurrentTerms()

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-2xl font-bold text-[#1E1E1E]">{terms.title}</CardTitle>
        <CardDescription className="text-gray-500">
          Version {terms.version} • Last updated {terms.lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-[400px] w-full rounded-md border border-gray-200 p-4 bg-gray-50">
          {terms.sections.map((section, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-[#1E1E1E] mb-2">{section.heading}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}