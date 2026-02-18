import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates user level and progress based on total XP.
 * Formula: Base 1000 XP for level 1, increasing by 500 XP for each subsequent level.
 */
export function calculateLevel(totalXp: number) {
  let level = 1
  let xpForNextLevel = 1000 // XP needed to go from Level 1 -> 2
  let xpAccumulated = 0
  
  // While we have enough XP to exceed the current level cap...
  while (totalXp >= xpAccumulated + xpForNextLevel) {
    xpAccumulated += xpForNextLevel
    level++
    
    // Increase the cost for the NEXT level (Difficulty scaling)
    // Level 1->2: 1000
    // Level 2->3: 1500
    // Level 3->4: 2000
    xpForNextLevel += 500 
  }

  // XP earned TOWARDS the next level (Current XP - XP required for current level)
  const currentLevelProgressXp = totalXp - xpAccumulated
  
  // Percentage progress (0-100)
  const progressPercent = Math.min(100, Math.max(0, (currentLevelProgressXp / xpForNextLevel) * 100))

  return {
    level,
    currentLevelProgressXp, // XP earned in this specific level bracket
    xpForNextLevel,         // Total XP needed to complete this bracket
    progressPercent
  }
}