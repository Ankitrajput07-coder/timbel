-- This script assigns all legacy data (where campus_id is currently NULL)
-- to P. P. Savani University (PPSU).

DO $$
DECLARE
  v_ppsu_id UUID;
BEGIN
  -- Get the campus ID for PPSU
  SELECT id INTO v_ppsu_id FROM campuses WHERE short_name = 'PPSU' LIMIT 1;

  IF v_ppsu_id IS NOT NULL THEN
    -- Update timetable_slots
    UPDATE timetable_slots SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
    
    -- Update timetable_meta
    UPDATE timetable_meta SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
    
    -- Update timetable_issues
    UPDATE timetable_issues SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
    
    -- Update sendiyou_posts
    UPDATE sendiyou_posts SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
    
    -- Update push_subscriptions
    UPDATE push_subscriptions SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
    
    -- Update any users who don't have a campus_id yet and are PPSU students
    UPDATE users SET campus_id = v_ppsu_id WHERE campus_id IS NULL;
  END IF;
END $$;
