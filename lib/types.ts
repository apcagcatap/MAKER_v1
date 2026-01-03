/**
 * TypeScript Type Definitions for Maker App
 *
 * This file contains all the TypeScript interfaces and types used throughout the app.
 * These types match the database schema defined in the SQL scripts.
 *
 * Type Hierarchy:
 * - User Roles: participant, facilitator, admin (via workshop_user)
 * - Users: public.users table
 * - Workshops: workshop, workshop_user, workshop_quest tables
 * - Quest System: Quests, UserQuests, Skills, UserSkills
 * - Forum System: Forums, ForumPosts, ForumReplies
 */

// ============================================
// ENUMS - Define allowed values for specific fields
// ============================================

/** Workshop role types - determines permissions within a workshop (excludes admin) */
export type WorkshopRole = "participant" | "facilitator"

/** @deprecated Use WorkshopRole instead. Kept for backwards compatibility */
export type UserRole = "participant" | "facilitator" | "admin"

/** Quest completion status for tracking user progress */
export type QuestStatus = "not_started" | "in_progress" | "completed"

/** Quest difficulty levels */
export type QuestDifficulty = "beginner" | "intermediate" | "advanced"

// ============================================
// USER TYPES (new schema)
// ============================================

/**
 * User
 *
 * Represents a user in the public.users table.
 * Created automatically when a user signs up via database trigger.
 */
export interface User {
  id: string // UUID matching auth.users.id
  email: string // User's email address
  display_name: string | null // User's display name
  bio: string | null // User biography/description
  is_admin: boolean // Global admin flag
  created_at: string // Account creation timestamp
  updated_at: string // Last profile update timestamp
}

// ============================================
// WORKSHOP SYSTEM TYPES (new schema)
// ============================================

/**
 * Workshop
 *
 * Represents a workshop/event in the system.
 */
export interface Workshop {
  id: string // UUID primary key
  name: string // Workshop name
  event_date: string // Date of the workshop event
  created_at: string // Creation timestamp
}

/**
 * Workshop User Assignment
 *
 * Junction table linking users to workshops with their role.
 */
export interface WorkshopUser {
  workshop_id: string // Reference to workshop
  user_id: string // Reference to user
  role: WorkshopRole // User's role in this workshop (participant or facilitator)
  assigned_at: string // When user was assigned
  // Joined data
  user?: User // Optional: populated user data
  workshop?: Workshop // Optional: populated workshop data
}

/**
 * Workshop Quest Assignment
 *
 * Junction table linking quests to workshops.
 */
export interface WorkshopQuest {
  workshop_id: string // Reference to workshop
  quest_id: string // Reference to quest
  // Joined data
  quest?: Quest // Optional: populated quest data
  workshop?: Workshop // Optional: populated workshop data
}

// ============================================
// LEGACY PROFILE TYPE (for backwards compatibility)
// ============================================

/**
 * @deprecated Use User type instead. This is kept for backwards compatibility.
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
 * Quest Definition (new schema)
 *
 * Represents a quest/challenge that users can complete.
 */
export interface Quest {
  id: string // UUID primary key
  title: string // Quest title
  description: string | null // Detailed quest description
  created_at: string // Creation timestamp
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
