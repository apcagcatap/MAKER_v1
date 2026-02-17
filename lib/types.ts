/**
 * TypeScript Type Definitions for Maker App
 *
 * This file contains all the TypeScript interfaces and types used throughout the app.
 * These types match the database schema defined in the SQL scripts.
 *
 * Type Hierarchy:
 * - User Roles: participant, facilitator, admin
 * - Quest System: Quests, UserQuests, Skills, UserSkills
 * - Forum System: Forums, ForumPosts, ForumReplies
 */

// ============================================
// ENUMS - Define allowed values for specific fields
// ============================================

/** User role types - determines dashboard access and permissions */
export type UserRole = "participant" | "facilitator" | "admin"

/** Quest completion status for tracking user progress */
export type Quest_Progress_Status = "not_started" | "in_progress" | "completed"

/** Quest difficulty levels */
export type QuestDifficulty = "beginner" | "intermediate" | "advanced"

// ============================================
// USER & PROFILE TYPES
// ============================================

/** Sex type matching sex_type enum in database */
export type Sex = "Male" | "Female"

/**
 * User Profile
 *
 * Extends the Supabase auth.users table with additional user information.
 * Created automatically when a user signs up via database trigger.
 */
export interface Profile {
  id: string // UUID matching auth.users.id
  email: string // User's email address
  display_name: string | null // User's display name
  role: UserRole // User's role (participant/facilitator/admin)
  xp: number // Total experience points earned
  level: number // Current level (calculated from XP)
  avatar_url: string | null // URL to user's avatar image
  bio: string | null // User biography/description
  created_at: string // Account creation timestamp
  updated_at: string // Last profile update timestamp
  // Registration fields (DOST-STII standard)
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  suffix: string | null // Jr., Sr., III, IV
  sex: Sex | null
  birthdate: string | null // ISO date string
  phone: string | null // Philippine mobile: +639XXXXXXXXX
  region: string | null
  province: string | null
  city_municipality: string | null
  barangay: string | null
  occupation: string | null
  organization: string | null
  highest_education: string | null
}

// ============================================
// SKILLS SYSTEM TYPES
// ============================================

/**
 * Skill Definition
 *
 * Represents a skill that users can learn and level up.
 * Created by facilitators and admins.
 */
export interface Skill {
  id: string // Unique skill identifier
  name: string // Skill name (e.g., "Web Development")
  description: string | null // Detailed skill description
  icon: string | null // Icon identifier or emoji
  created_at: string // Creation timestamp
}

/**
 * User Skill Progress
 *
 * Tracks a user's progress in a specific skill.
 * Junction table between users and skills.
 */
export interface UserSkill {
  id: string // Unique record identifier
  user_id: string // Reference to user profile
  skill_id: string // Reference to skill
  xp: number // Experience points in this skill
  level: number // Current level in this skill
  created_at: string // When user started learning this skill
  skill?: Skill // Optional: populated skill data
}

// ============================================
// QUEST SYSTEM TYPES
// ============================================

/**
 * Quest Definition
 *
 * Represents a quest/challenge that users can complete to earn XP.
 * Created by facilitators and admins.
 */
export type QuestStatus = 'Draft' | 'Published' | 'Archived'

export interface Quest {
  id: string
  title: string
  description: string
  difficulty: string
  scheduled_date: string | null
  badge_image_url: string | null
  certificate_image_url: string | null
  status: QuestStatus 
  materials_needed: string
  general_instructions: string
  levels: Array<{
    title: string
    description: string
    /** When true, participant must get a facilitator code before completing this level */
    requiresVerification?: boolean
  }>
  xp_reward: number
  skill_id: string | null
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * User Quest Progress
 *
 * Tracks a user's progress on a specific quest.
 * Junction table between users and quests.
 */
export interface UserQuest {
  id: string // Unique record identifier
  user_id: string // Reference to user profile
  quest_id: string // Reference to quest
  status: QuestStatus // Current quest status
  progress: number // Progress percentage (0-100)
  started_at: string | null // When user started the quest
  completed_at: string | null // When user completed the quest
  created_at: string // Record creation timestamp
  quest?: Quest // Optional: populated quest data
}

// ============================================
// FORUM SYSTEM TYPES
// ============================================

/**
 * Forum Category
 *
 * Represents a forum category/channel for discussions.
 * Created by facilitators and admins.
 */
export interface Forum {
  id: string // Unique forum identifier
  title: string // Forum title/name
  description: string | null // Forum description
  created_by: string | null // User who created the forum
  created_at: string // Creation timestamp
}

/**
 * Forum Post
 *
 * Represents a post/thread in a forum.
 * Can be created by any authenticated user.
 */
export interface ForumPost {
  id: string // Unique post identifier
  forum_id: string // Reference to parent forum
  user_id: string // Reference to post author
  content: string // Post content/body
  created_at: string // Creation timestamp
  updated_at: string // Last edit timestamp
  profile?: Profile // Optional: populated author profile
}

/**
 * Forum Reply
 *
 * Represents a reply/comment on a forum post.
 * Can be created by any authenticated user.
 */
export interface ForumReply {
  id: string // Unique reply identifier
  post_id: string // Reference to parent post
  user_id: string // Reference to reply author
  content: string // Reply content/body
  created_at: string // Creation timestamp
  profile?: Profile // Optional: populated author profile
}