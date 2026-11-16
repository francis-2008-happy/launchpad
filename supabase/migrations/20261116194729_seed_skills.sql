-- Starter list of skills (issue #37).
--
-- Employers pick from this list when they post a job (#14), job search filters
-- by it (#43), and skill detection maps GitHub repositories onto it (#40).
-- It is a migration, not a local seed file, so every environment gets the same list.
--
-- Signed-in users can still add new skills later (see the skills policies), and
-- "on conflict do nothing" makes this safe if a skill already exists.

insert into public.skills (name, category) values
  -- Languages
  ('JavaScript', 'language'),
  ('TypeScript', 'language'),
  ('Python', 'language'),
  ('Java', 'language'),
  ('C#', 'language'),
  ('C++', 'language'),
  ('C', 'language'),
  ('Go', 'language'),
  ('Rust', 'language'),
  ('PHP', 'language'),
  ('Ruby', 'language'),
  ('Kotlin', 'language'),
  ('Swift', 'language'),
  ('Dart', 'language'),
  ('SQL', 'language'),
  ('HTML', 'language'),
  ('CSS', 'language'),
  ('Shell', 'language'),

  -- Frameworks and libraries
  ('React', 'framework'),
  ('Next.js', 'framework'),
  ('Vue', 'framework'),
  ('Angular', 'framework'),
  ('Svelte', 'framework'),
  ('Node.js', 'framework'),
  ('Express', 'framework'),
  ('NestJS', 'framework'),
  ('Django', 'framework'),
  ('Flask', 'framework'),
  ('FastAPI', 'framework'),
  ('Spring Boot', 'framework'),
  ('.NET', 'framework'),
  ('Laravel', 'framework'),
  ('Ruby on Rails', 'framework'),
  ('React Native', 'framework'),
  ('Flutter', 'framework'),
  ('Tailwind CSS', 'framework'),
  ('TensorFlow', 'framework'),
  ('PyTorch', 'framework'),

  -- Tools and platforms
  ('Git', 'tool'),
  ('GitHub Actions', 'tool'),
  ('Docker', 'tool'),
  ('Kubernetes', 'tool'),
  ('PostgreSQL', 'tool'),
  ('MySQL', 'tool'),
  ('MongoDB', 'tool'),
  ('Redis', 'tool'),
  ('Supabase', 'tool'),
  ('Firebase', 'tool'),
  ('AWS', 'tool'),
  ('Google Cloud', 'tool'),
  ('Azure', 'tool'),
  ('Vercel', 'tool'),
  ('Linux', 'tool'),
  ('GraphQL', 'tool'),
  ('Jest', 'tool'),
  ('Playwright', 'tool'),
  ('Figma', 'tool'),

  -- Practices
  ('Unit testing', 'practice'),
  ('End-to-end testing', 'practice'),
  ('CI/CD', 'practice'),
  ('REST APIs', 'practice'),
  ('Responsive design', 'practice'),
  ('Accessibility', 'practice'),
  ('Authentication', 'practice'),
  ('Database design', 'practice'),
  ('Data analysis', 'practice'),
  ('Machine learning', 'practice'),
  ('Agile', 'practice'),
  ('Code review', 'practice')
on conflict (name) do nothing;
