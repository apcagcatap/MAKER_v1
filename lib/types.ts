/**
 * TypeScript Type Definitions for Maker App
 *
 * This file contains all the TypeScript interfaces and types used throughout the app.
 * These types match the database schema defined in the SQL scripts.
 *
 * Type Hierarchy:
 * - User Roles: participant, facilitator, admin (via workshop_user)
 * - Users: public.users table
 * - Templates: quest_template, task_template (reusable building blocks)
 * - Workshops: workshop, workshop_user, workshop_quest, workshop_task
 * - Progress: user_task_progress
 * - Forum System: Forums, ForumPosts, ForumReplies
 */

// ============================================
// ENUMS - Define allowed values for specific fields
// ============================================

/** Workshop role types - determines permissions within a workshop (excludes admin) */
export type WorkshopRole = "participant" | "facilitator"

/** @deprecated Use WorkshopRole instead. Kept for backwards compatibility */
export type UserRole = "participant" | "facilitator" | "admin"

/** Workshop status */
export type WorkshopStatus = "draft" | "scheduled" | "active" | "completed" | "cancelled"

/** Workshop Quest/Task status */
export type WorkshopItemStatus = "locked" | "open" | "in_progress" | "completed" | "skipped"

/** User task progress status */
export type TaskProgressStatus = "not_started" | "in_progress" | "completed" | "skipped"

/** Quest completion status for tracking user progress */
export type QuestStatus = "not_started" | "in_progress" | "completed"

/** Quest difficulty levels */
export type QuestDifficulty = "beginner" | "intermediate" | "advanced"

/** Task types */
export type TaskType = "individual" | "group" | "presentation" | "discussion" | "hands_on"

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
// TEMPLATE SYSTEM TYPES (Reusable Building Blocks)
// ============================================

/**
 * Quest Template
 *
 * Reusable quest template that can be instantiated in workshops.
 * Renamed from 'quest' table.
 */
export interface QuestTemplate {
  id: string // UUID primary key
  title: string // Quest title
  description: string | null // Detailed quest description
  estimated_duration_minutes: number | null // Suggested duration
  created_at: string // Creation timestamp
  updated_at: string // Last update timestamp
  created_by: string | null // User who created the template
  is_archived: boolean // Soft delete flag
}

/** @deprecated Use QuestTemplate instead */
export interface Quest {
  id: string
  title: string
  description: string | null
  created_at: string
}

/**
 * Task Template
 *
 * Reusable task template - building blocks for quests.
 */
export interface TaskTemplate {
  id: string // UUID primary key
  title: string // Task title
  description: string | null // Task description
  instructions: string | null // Detailed instructions for participants
  task_type: TaskType | null // Type of task
  estimated_duration_minutes: number | null // Suggested duration
  created_at: string // Creation timestamp
  updated_at: string // Last update timestamp
  created_by: string | null // User who created the template
  is_archived: boolean // Soft delete flag
}

/**
 * Quest Template Task
 *
 * Links task templates to quest templates (default composition).
 */
export interface QuestTemplateTask {
  id: string // UUID primary key
  quest_template_id: string // Reference to quest template
  task_template_id: string // Reference to task template
  sequence_order: number // Default ordering
  // Joined data
  quest_template?: QuestTemplate
  task_template?: TaskTemplate
}

// ============================================
// WORKSHOP SYSTEM TYPES (Event-Specific Instances)
// ============================================

/**
 * Workshop
 *
 * Represents a workshop/event in the system.
 */
export interface Workshop {
  id: string // UUID primary key
  name: string // Workshop name
  description: string | null // Workshop description
  event_date: string // Date of the workshop event
  start_time: string | null // Workshop start time
  end_time: string | null // Workshop end time
  location: string | null // Event location
  status: WorkshopStatus // Workshop status
  created_at: string // Creation timestamp
  updated_at: string | null // Last update timestamp
  created_by: string | null // User who created the workshop
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
 * Workshop Quest
 *
 * Instance of a quest template for a specific workshop.
 * Allows customization and scheduling.
 */
export interface WorkshopQuest {
  id: string // UUID primary key
  workshop_id: string // Reference to workshop
  quest_template_id: string // Reference to quest template
  custom_title: string | null // Override template title
  custom_description: string | null // Override template description
  sequence_order: number // Order within workshop
  status: WorkshopItemStatus // Quest status
  scheduled_start: string | null // When quest should start
  scheduled_end: string | null // When quest should end
  actual_start: string | null // When quest actually started
  actual_end: string | null // When quest actually ended
  created_at: string // Creation timestamp
  // Joined data
  quest_template?: QuestTemplate // Optional: populated quest template
  workshop?: Workshop // Optional: populated workshop data
  tasks?: WorkshopTask[] // Optional: tasks in this quest
}

/**
 * Workshop Task
 *
 * Instance of a task for a specific workshop quest.
 * Allows customization and precise scheduling.
 */
export interface WorkshopTask {
  id: string // UUID primary key
  workshop_quest_id: string // Reference to workshop quest
  task_template_id: string // Reference to task template
  custom_title: string | null // Override template title
  custom_description: string | null // Override template description
  custom_instructions: string | null // Override template instructions
  sequence_order: number // Order within quest
  status: WorkshopItemStatus // Task status
  scheduled_start: string | null // Exact time task opens
  scheduled_end: string | null // Exact time task closes
  duration_minutes: number | null // Override template duration
  actual_start: string | null // When task actually started
  actual_end: string | null // When task actually ended
  auto_unlock: boolean // Unlock automatically at scheduled_start
  unlock_on_previous_complete: boolean // Unlock when previous task completes
  created_at: string // Creation timestamp
  // Joined data
  task_template?: TaskTemplate // Optional: populated task template
  workshop_quest?: WorkshopQuest // Optional: populated workshop quest
}

/**
 * Workshop Task Dependency
 *
 * Complex unlock dependencies between tasks.
 */
export interface WorkshopTaskDependency {
  task_id: string // Task that has the dependency
  depends_on_task_id: string // Task that must be completed first
  dependency_type: "completion" | "start" | "time_elapsed"
}

/**
 * User Task Progress
 *
 * Tracks individual user progress on workshop tasks.
 */
export interface UserTaskProgress {
  id: string // UUID primary key
  user_id: string // Reference to user
  workshop_task_id: string // Reference to workshop task
  status: TaskProgressStatus // Progress status
  started_at: string | null // When user started
  completed_at: string | null // When user completed
  notes: string | null // Notes or responses
  created_at: string // Creation timestamp
  updated_at: string // Last update timestamp
  // Joined data
  user?: User // Optional: populated user data
  workshop_task?: WorkshopTask // Optional: populated task data
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
// LEGACY QUEST TYPES (for backwards compatibility)
// ============================================

/**
 * User Quest Progress
 *
 * Tracks a user's progress on a specific quest.
 * @deprecated Consider using UserTaskProgress for new implementations
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
