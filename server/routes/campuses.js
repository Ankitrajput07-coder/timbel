const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

// GET /api/campuses - list all campuses
router.get('/', async (req, res) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('campuses')
      .select('id, name, short_name, email_domains')
      .order('name');
    
    if (error) throw error;
    res.json({ campuses: data || [] });
  } catch (err) {
    console.error('Error fetching campuses:', err);
    res.status(500).json({ error: 'Failed to fetch campuses' });
  }
});

module.exports = router;
