/**
 * Database Schema for Maker App
 * 
 * This script creates all the necessary tables, enums, and security policies
 * for the Maker gamified learning platform.
 * 
 * Tables Created:
 * - profiles: User profiles with role and XP tracking
 * - skills: Available skills users can learn
 * - user_skills: Junction table tracking user progress in skills
 * - quests: Challenges users can complete
 * - user_quests: Junction table tracking user progress in quests
 * - forums: Forum categories for discussions
 * - forum_posts: Posts within forums
 * - forum_replies: Replies to forum posts
 * 
 * Security:
 * - Row Level Security (RLS) enabled on all tables
 * - Policies enforce role-based access control
 * - Participants can view/update their own data
 * - Facilitators and admins have elevated permissions
 */

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS - Define allowed values
-- ============================================

-- User role types: determines dashboard access and permissions
CREATE TYPE user_role AS ENUM ('participant', 'facilitator', 'admin');

-- Quest status: tracks user progress on quests
CREATE TYPE quest_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Quest difficulty levels
CREATE TYPE quest_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- ============================================
-- TABLES
-- ============================================

/**
 * Profiles Table
 * 
 * Stores user profile information and gamification data.
 * Links to Supabase auth.users table via foreign key.
 * Created automatically when user signs up (see trigger in 002_create_profile_trigger.sql)
 */
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth
  email TEXT NOT NULL, -- User's email address
  display_name TEXT, -- User's display name
  role user_role NOT NULL DEFAULT 'participant', -- User role (participant/facilitator/admin)
  xp INTEGER DEFAULT 0, -- Total experience points
  level INTEGER DEFAULT 1, -- Current level
  avatar_url TEXT, -- URL to avatar image
  bio TEXT, -- User biography
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * Skills Table
 * 
 * Defines available skills that users can learn.
 * Created by facilitators and admins.
 */
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Skill name (e.g., "Web Development")
  description TEXT, -- Detailed description
  icon TEXT, -- Icon identifier or emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * User Skills Table
 * 
 * Junction table tracking user progress in each skill.
 * Each user can have multiple skills, each with their own XP and level.
 */
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0, -- XP earned in this skill
  level INTEGER DEFAULT 1, -- Current level in this skill
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id) -- Prevent duplicate skill entries per user
);

/**
 * Quests Table
 * 
 * Defines quests/challenges that users can complete.
 * Created by facilitators and admins.
 */
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, -- Quest title
  description TEXT, -- Detailed quest description
  difficulty quest_difficulty DEFAULT 'beginner', -- Difficulty level
  xp_reward INTEGER DEFAULT 0, -- XP awarded on completion
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL, -- Optional: associated skill
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Quest creator
  is_active BOOLEAN DEFAULT true, -- Whether quest is available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * User Quests Table
 * 
 * Junction table tracking user progress on quests.
 * Records when quests are started, progress percentage, and completion.
 */
CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  status quest_status DEFAULT 'not_started', -- Current status
  progress INTEGER DEFAULT 0, -- Progress percentage (0-100)
  started_at TIMESTAMP WITH TIME ZONE, -- When quest was started
  completed_at TIMESTAMP WITH TIME ZONE, -- When quest was completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id) -- Prevent duplicate quest entries per user
);

/**
 * Forums Table
 * 
 * Defines forum categories for discussions.
 * Created by facilitators and admins.
 */
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, -- Forum title/name
  description TEXT, -- Forum description
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Forum creator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * Forum Posts Table
 * 
 * Stores posts/threads within forums.
 * Can be created by any authenticated user.
 */
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE, -- Parent forum
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Post author
  content TEXT NOT NULL, -- Post content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * Forum Replies Table
 * 
 * Stores replies/comments on forum posts.
 * Can be created by any authenticated user.
 */
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE, -- Parent post
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Reply author
  content TEXT NOT NULL, -- Reply content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables to enforce access control
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY POLICIES
-- ============================================

-- Profiles Policies
-- All users can view profiles, but only update their own
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Skills Policies
-- Everyone can view skills, only facilitators/admins can create
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Facilitators and admins can create skills" ON public.skills FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- User Skills Policies
-- Users can only view and manage their own skill progress
CREATE POLICY "Users can view own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);

-- Quests Policies
-- Everyone can view active quests, only facilitators/admins can create/update
CREATE POLICY "Anyone can view active quests" ON public.quests FOR SELECT USING (is_active = true);
CREATE POLICY "Facilitators and admins can create quests" ON public.quests FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );
CREATE POLICY "Facilitators and admins can update quests" ON public.quests FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- User Quests Policies
-- Users manage their own quest progress, facilitators can view all
CREATE POLICY "Users can view own quest progress" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quest progress" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quest progress" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Facilitators can view all quest progress" ON public.user_quests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Forums Policies
-- Everyone can view forums, only facilitators/admins can create
CREATE POLICY "Anyone can view forums" ON public.forums FOR SELECT USING (true);
CREATE POLICY "Facilitators and admins can create forums" ON public.forums FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Forum Posts Policies
-- Everyone can view posts, users can create and manage their own
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create forum posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

-- Forum Replies Policies
-- Everyone can view replies, users can create and manage their own
CREATE POLICY "Anyone can view forum replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create forum replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.forum_replies FOR DELETE USING (auth.uid() = user_id);
