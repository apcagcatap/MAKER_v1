/**
 * Database Schema for Maker App
 * 
 * This script creates all the necessary tables, enums, and security policies
 * for the Maker gamified learning platform.
 * 
 * Tables Created:
 * - users: User profiles linked to Supabase auth
 * - quest: Challenges/quests available in the system
 * - workshop: Workshop events
 * - workshop_user: Junction table linking users to workshops with roles
 * - workshop_quest: Junction table linking quests to workshops
 * 
 * Security:
 * - Row Level Security (RLS) enabled on all tables
 * - Policies enforce role-based access control
 * - Participants can view/update their own data
 * - Facilitators and admins have elevated permissions within their workshops
 */

-- ============================================
-- ENUMS - Define allowed values
-- ============================================

-- Workshop role types: determines permissions within a workshop (participant or facilitator)
CREATE TYPE workshop_role AS ENUM ('participant', 'facilitator');

-- ============================================
-- TABLES
-- ============================================

/**
 * Users Table
 * 
 * Stores user profile information.
 * Links to Supabase auth.users table via foreign key.
 * Created automatically when user signs up (see trigger in 002_create_profile_trigger.sql)
 */
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NULL,
  bio TEXT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

/**
 * Quest Table
 * 
 * Defines quests/challenges that can be assigned to workshops.
 * Created by facilitators and admins.
 */
CREATE TABLE IF NOT EXISTS public.quest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * Workshop Table
 * 
 * Represents workshop events where users participate.
 */
CREATE TABLE IF NOT EXISTS public.workshop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/**
 * Workshop User Table
 * 
 * Junction table linking users to workshops with their assigned role.
 * Users can have different roles in different workshops.
 */
CREATE TABLE IF NOT EXISTS public.workshop_user (
  workshop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role workshop_role NOT NULL DEFAULT 'participant',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (workshop_id, user_id),
  FOREIGN KEY (workshop_id) REFERENCES public.workshop(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

/**
 * Workshop Quest Table
 * 
 * Junction table linking quests to workshops.
 * Allows the same quest to be used in multiple workshops.
 */
CREATE TABLE IF NOT EXISTS public.workshop_quest (
  workshop_id UUID NOT NULL,
  quest_id UUID NOT NULL,
  PRIMARY KEY (workshop_id, quest_id),
  FOREIGN KEY (workshop_id) REFERENCES public.workshop(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES public.quest(id) ON DELETE CASCADE
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables to enforce access control
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_quest ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY POLICIES
-- ============================================

-- Users Policies
-- All authenticated users can view users, but only update their own (or admins can update any)
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any user" ON public.users FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Quest Policies
-- Everyone can view quests, only facilitators or global admins can create/update/delete
CREATE POLICY "Anyone can view quests" ON public.quest FOR SELECT USING (true);
CREATE POLICY "Facilitators and admins can create quests" ON public.quest FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM public.workshop_user WHERE user_id = auth.uid() AND role = 'facilitator')
  );
CREATE POLICY "Facilitators and admins can update quests" ON public.quest FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM public.workshop_user WHERE user_id = auth.uid() AND role = 'facilitator')
  );
CREATE POLICY "Facilitators and admins can delete quests" ON public.quest FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM public.workshop_user WHERE user_id = auth.uid() AND role = 'facilitator')
  );

-- Workshop Policies
-- Users can view workshops they are assigned to (or admins can view all), admins can manage all
CREATE POLICY "Users can view their workshops" ON public.workshop FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM public.workshop_user WHERE workshop_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can create workshops" ON public.workshop FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update workshops" ON public.workshop FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can delete workshops" ON public.workshop FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Workshop User Policies
-- Users can view their own assignments, facilitators can view their workshop assignments, admins can manage all
CREATE POLICY "Users can view own workshop assignments" ON public.workshop_user FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all workshop assignments" ON public.workshop_user FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Facilitators can view workshop assignments" ON public.workshop_user FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workshop_user wu
      WHERE wu.workshop_id = workshop_id AND wu.user_id = auth.uid() AND wu.role = 'facilitator'
    )
  );
CREATE POLICY "Admins can manage workshop assignments" ON public.workshop_user FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update workshop assignments" ON public.workshop_user FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can delete workshop assignments" ON public.workshop_user FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Workshop Quest Policies
-- Users can view quests in their workshops, facilitators or global admins can manage
CREATE POLICY "Users can view workshop quests" ON public.workshop_quest FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.workshop_user 
      WHERE workshop_id = workshop_quest.workshop_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Facilitators can manage workshop quests" ON public.workshop_quest FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.workshop_user 
      WHERE workshop_id = workshop_quest.workshop_id AND user_id = auth.uid() AND role = 'facilitator'
    )
  );
CREATE POLICY "Facilitators can update workshop quests" ON public.workshop_quest FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.workshop_user 
      WHERE workshop_id = workshop_quest.workshop_id AND user_id = auth.uid() AND role = 'facilitator'
    )
  );
CREATE POLICY "Facilitators can delete workshop quests" ON public.workshop_quest FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.workshop_user 
      WHERE workshop_id = workshop_quest.workshop_id AND user_id = auth.uid() AND role = 'facilitator'
    )
  );
