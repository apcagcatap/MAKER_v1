/**
 * Template System Migration
 * 
 * This migration adds the template/instance pattern for modular workshops:
 * - quest_template: Reusable quest templates
 * - task_template: Reusable task templates
 * - quest_template_task: Links tasks to quest templates (default composition)
 * - Updates workshop_quest to reference templates with customization
 * - workshop_task: Task instances within workshop quests
 * 
 * Run after existing tables are created.
 */

-- ============================================
-- NEW ENUMS
-- ============================================

-- Workshop status
DO $$ BEGIN
  CREATE TYPE workshop_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Workshop item status (for quests and tasks within a workshop)
DO $$ BEGIN
  CREATE TYPE workshop_item_status AS ENUM ('locked', 'open', 'in_progress', 'completed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Task types
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM ('individual', 'group', 'presentation', 'discussion', 'hands_on');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Task progress status
DO $$ BEGIN
  CREATE TYPE task_progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TEMPLATE TABLES
-- ============================================

/**
 * Quest Template
 * Reusable quest definitions that can be instantiated in workshops.
 */
CREATE TABLE IF NOT EXISTS public.quest_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

/**
 * Task Template
 * Reusable task definitions - building blocks for quests.
 */
CREATE TABLE IF NOT EXISTS public.task_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  task_type task_type,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

/**
 * Quest Template Task
 * Links task templates to quest templates (defines default task sequence).
 */
CREATE TABLE IF NOT EXISTS public.quest_template_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_template_id UUID NOT NULL REFERENCES public.quest_template(id) ON DELETE CASCADE,
  task_template_id UUID NOT NULL REFERENCES public.task_template(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(quest_template_id, task_template_id)
);

-- ============================================
-- WORKSHOP TABLE UPDATES
-- ============================================

-- Add new columns to workshop table
ALTER TABLE public.workshop 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status workshop_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================
-- WORKSHOP QUEST (Updated Schema)
-- ============================================

-- First, check if the old workshop_quest uses composite key and migrate
-- We need to handle this carefully to not break existing data

-- Create new workshop_quest table if the structure is different
DO $$
BEGIN
  -- Check if workshop_quest has an 'id' column (new schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workshop_quest' AND column_name = 'id'
  ) THEN
    -- Drop the old table and recreate (or you could migrate data)
    DROP TABLE IF EXISTS public.workshop_quest CASCADE;
    
    CREATE TABLE public.workshop_quest (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workshop_id UUID NOT NULL REFERENCES public.workshop(id) ON DELETE CASCADE,
      quest_template_id UUID NOT NULL REFERENCES public.quest_template(id) ON DELETE CASCADE,
      custom_title TEXT,
      custom_description TEXT,
      sequence_order INTEGER NOT NULL DEFAULT 0,
      status workshop_item_status NOT NULL DEFAULT 'locked',
      scheduled_start TIMESTAMP WITH TIME ZONE,
      scheduled_end TIMESTAMP WITH TIME ZONE,
      actual_start TIMESTAMP WITH TIME ZONE,
      actual_end TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(workshop_id, quest_template_id)
    );
  END IF;
END $$;

-- ============================================
-- WORKSHOP TASK TABLE
-- ============================================

/**
 * Workshop Task
 * Instance of a task for a specific workshop quest.
 */
CREATE TABLE IF NOT EXISTS public.workshop_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_quest_id UUID NOT NULL REFERENCES public.workshop_quest(id) ON DELETE CASCADE,
  task_template_id UUID NOT NULL REFERENCES public.task_template(id) ON DELETE CASCADE,
  custom_title TEXT,
  custom_description TEXT,
  custom_instructions TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  status workshop_item_status NOT NULL DEFAULT 'locked',
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  auto_unlock BOOLEAN NOT NULL DEFAULT false,
  unlock_on_previous_complete BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workshop_quest_id, task_template_id)
);

-- ============================================
-- USER TASK PROGRESS TABLE
-- ============================================

/**
 * User Task Progress
 * Tracks individual user progress on workshop tasks.
 */
CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workshop_task_id UUID NOT NULL REFERENCES public.workshop_task(id) ON DELETE CASCADE,
  status task_progress_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workshop_task_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.quest_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_template_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY POLICIES
-- ============================================

-- Quest Template Policies
CREATE POLICY "Anyone can view quest templates" ON public.quest_template FOR SELECT USING (true);
CREATE POLICY "Admins can manage quest templates" ON public.quest_template FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Task Template Policies  
CREATE POLICY "Anyone can view task templates" ON public.task_template FOR SELECT USING (true);
CREATE POLICY "Admins can manage task templates" ON public.task_template FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Quest Template Task Policies
CREATE POLICY "Anyone can view quest template tasks" ON public.quest_template_task FOR SELECT USING (true);
CREATE POLICY "Admins can manage quest template tasks" ON public.quest_template_task FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Workshop Task Policies
CREATE POLICY "Users can view tasks in their workshops" ON public.workshop_task FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (
      SELECT 1 FROM public.workshop_quest wq
      JOIN public.workshop_user wu ON wu.workshop_id = wq.workshop_id
      WHERE wq.id = workshop_quest_id AND wu.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage workshop tasks" ON public.workshop_task FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- User Task Progress Policies
CREATE POLICY "Users can view own progress" ON public.user_task_progress FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_task_progress FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_task_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_task_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Facilitators can view workshop progress" ON public.user_task_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workshop_task wt
      JOIN public.workshop_quest wq ON wq.id = wt.workshop_quest_id
      JOIN public.workshop_user wu ON wu.workshop_id = wq.workshop_id
      WHERE wt.id = workshop_task_id AND wu.user_id = auth.uid() AND wu.role = 'facilitator'
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quest_template_archived ON public.quest_template(is_archived);
CREATE INDEX IF NOT EXISTS idx_task_template_archived ON public.task_template(is_archived);
CREATE INDEX IF NOT EXISTS idx_quest_template_task_quest ON public.quest_template_task(quest_template_id);
CREATE INDEX IF NOT EXISTS idx_quest_template_task_task ON public.quest_template_task(task_template_id);
CREATE INDEX IF NOT EXISTS idx_workshop_quest_workshop ON public.workshop_quest(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_quest_template ON public.workshop_quest(quest_template_id);
CREATE INDEX IF NOT EXISTS idx_workshop_task_quest ON public.workshop_task(workshop_quest_id);
CREATE INDEX IF NOT EXISTS idx_workshop_task_template ON public.workshop_task(task_template_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user ON public.user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task ON public.user_task_progress(workshop_task_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_quest_template_updated_at ON public.quest_template;
CREATE TRIGGER update_quest_template_updated_at
  BEFORE UPDATE ON public.quest_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_template_updated_at ON public.task_template;
CREATE TRIGGER update_task_template_updated_at
  BEFORE UPDATE ON public.task_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workshop_updated_at ON public.workshop;
CREATE TRIGGER update_workshop_updated_at
  BEFORE UPDATE ON public.workshop
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_task_progress_updated_at ON public.user_task_progress;
CREATE TRIGGER update_user_task_progress_updated_at
  BEFORE UPDATE ON public.user_task_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
