/**
 * Additional Forum Policies
 * 
 * This script adds additional RLS policies for forums to allow:
 * - Facilitators and admins to delete any forum
 * - Facilitators and admins to delete any post
 * - Facilitators and admins to delete any reply
 */

-- Allow facilitators and admins to delete any forum
CREATE POLICY "Facilitators and admins can delete forums" ON public.forums FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Allow facilitators and admins to delete any forum post
CREATE POLICY "Facilitators and admins can delete any post" ON public.forum_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Allow facilitators and admins to delete any forum reply
CREATE POLICY "Facilitators and admins can delete any reply" ON public.forum_replies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );
