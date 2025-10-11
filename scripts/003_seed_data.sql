-- Insert sample skills
INSERT INTO public.skills (name, description, icon) VALUES
  ('Web Development', 'Build modern web applications', '💻'),
  ('Design', 'Create beautiful user interfaces', '🎨'),
  ('Data Science', 'Analyze and visualize data', '📊'),
  ('Mobile Development', 'Build iOS and Android apps', '📱'),
  ('DevOps', 'Deploy and manage applications', '🚀'),
  ('AI & Machine Learning', 'Build intelligent systems', '🤖')
ON CONFLICT DO NOTHING;

-- Insert sample quests
INSERT INTO public.quests (title, description, difficulty, xp_reward, skill_id, is_active)
SELECT 
  'Build Your First Website',
  'Create a simple HTML/CSS website and deploy it online',
  'beginner',
  100,
  id,
  true
FROM public.skills WHERE name = 'Web Development'
ON CONFLICT DO NOTHING;

INSERT INTO public.quests (title, description, difficulty, xp_reward, skill_id, is_active)
SELECT 
  'Design a Mobile App UI',
  'Create a complete UI design for a mobile application',
  'intermediate',
  200,
  id,
  true
FROM public.skills WHERE name = 'Design'
ON CONFLICT DO NOTHING;

INSERT INTO public.quests (title, description, difficulty, xp_reward, skill_id, is_active)
SELECT 
  'Data Visualization Dashboard',
  'Build an interactive dashboard to visualize data',
  'advanced',
  300,
  id,
  true
FROM public.skills WHERE name = 'Data Science'
ON CONFLICT DO NOTHING;

-- Insert sample forum
INSERT INTO public.forums (title, description) VALUES
  ('General Discussion', 'Talk about anything related to learning and making'),
  ('Quest Help', 'Get help with your quests from the community'),
  ('Showcase', 'Share your completed projects and achievements')
ON CONFLICT DO NOTHING;
