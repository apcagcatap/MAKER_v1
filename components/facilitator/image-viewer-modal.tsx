"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import Image from "next/image"

interface ImageViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string | null
  title: string
  altText: string
}

export function ImageViewerModal({
  open,
  onOpenChange,
  imageUrl,
  title,
  altText,
}: ImageViewerModalProps) {
  if (!imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-96">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-contain"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
