-- 1. Create campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  email_domains TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS to allow the frontend to read it
ALTER TABLE campuses DISABLE ROW LEVEL SECURITY;

-- 2. Insert campuses
INSERT INTO campuses (name, short_name, email_domains) VALUES
  ('Parul University', 'Parul', '{paruluniversity.ac.in}'),
  ('Gujarat University', 'GU', '{gujaratuniversity.ac.in}'),
  ('Veer Narmad South Gujarat University', 'VNSGU', '{vnsgu.ac.in}'),
  ('Gujarat Technological University', 'GTU', '{gtu.ac.in}'),
  ('SVNIT Surat', 'SVNIT', '{svnit.ac.in}'),
  ('Uka Tarsadia University', 'UTU', '{utu.ac.in}'),
  ('Sarvajanik University', 'Sarvajanik', '{sarvajanikuniversity.ac.in}'),
  ('Pandit Deendayal Energy University', 'PDEU', '{pdeu.ac.in,pdpu.ac.in}'),
  ('CHARUSAT', 'CHARUSAT', '{charusat.ac.in}'),
  ('Ganpat University', 'Ganpat', '{ganpatuniversity.ac.in}'),
  ('Marwadi University', 'Marwadi', '{marwadiuniversity.ac.in}'),
  ('Nirma University', 'Nirma', '{nirmauni.ac.in}'),
  ('P. P. Savani University', 'PPSU', '{ppsu.ac.in}'),
  ('MS University Baroda', 'MSU', '{msubaroda.ac.in}'),
  ('Ahmedabad University', 'AU', '{ahduni.edu.in}'),
  ('Navrachana University', 'NUV', '{nuv.ac.in}'),
  ('GLS University', 'GLS', '{glsuniversity.ac.in}'),
  ('AURO University', 'AURO', '{aurouniversity.edu.in}'),
  ('Bhagwan Mahavir University', 'BMU', '{bmusurat.ac.in}'),
  ('Silver Oak University', 'Silver Oak', '{silveroakuni.ac.in}')
ON CONFLICT (name) DO NOTHING;

-- 3. Add campus_id UUID column to tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE timetable_meta ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE timetable_issues ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE sendiyou_posts ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);

-- 4. Add bio and social_links to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB;

-- 5. Create index on campus_id
CREATE INDEX IF NOT EXISTS idx_users_campus_id ON users(campus_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_campus_id ON timetable_slots(campus_id);
CREATE INDEX IF NOT EXISTS idx_timetable_meta_campus_id ON timetable_meta(campus_id);
CREATE INDEX IF NOT EXISTS idx_timetable_issues_campus_id ON timetable_issues(campus_id);
CREATE INDEX IF NOT EXISTS idx_sendiyou_posts_campus_id ON sendiyou_posts(campus_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_campus_id ON push_subscriptions(campus_id);

-- 6. Set existing users' campus_id based on email domain
UPDATE users u SET campus_id = c.id
FROM campuses c
WHERE u.campus_id IS NULL
AND u.email IS NOT NULL
AND EXISTS (
  SELECT 1 FROM unnest(c.email_domains) d
  WHERE u.email LIKE '%@' || d
);
