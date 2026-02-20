'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  
  // Ensure value is a safe number between 0 and 100
  const safeValue = Math.min(100, Math.max(0, value || 0))
  
  // Map the value (0-100) to a Hue color degree (0 = Red, 120 = Green)
  const hue = (safeValue / 100) * 120

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // Removed "bg-primary" so our dynamic inline style takes over
        className="h-full w-full flex-1 transition-all duration-500 ease-out"
        style={{ 
          transform: `translateX(-${100 - safeValue}%)`,
          backgroundColor: `hsl(${hue}, 85%, 45%)` 
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }