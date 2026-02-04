// Quick script to fetch a registration from Supabase and test the assignment API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch registrations with user data
// Note: gender & self_confidence are not stored in DB, only in client-side Zustand store
const { data: registrations, error } = await supabase
  .from('registrations')
  .select(`
    id, birth_year, has_partner, partner_name,
    dietary_requirements, skills, additional_skills,
    music_decade, music_genre,
    jkv_join_year, jkv_exit_year,
    borrel_count_2025, borrel_planning_2026,
    quiz_answers, ai_assignment, first_name, last_name,
    users ( id, name, email )
  `)
  .not('skills', 'is', null)
  .limit(5);

if (error) {
  console.error('DB error:', error.message);
  process.exit(1);
}

if (!registrations?.length) {
  console.error('No registrations found with skills data');
  process.exit(1);
}

console.log(`Found ${registrations.length} registrations:\n`);
for (const reg of registrations) {
  const userName = reg.users?.name || `${reg.first_name} ${reg.last_name}`;
  console.log(`- ${userName} (reg id: ${reg.id})`);
}

// Pick the first one
const reg = registrations[0];
const name = reg.users?.name || `${reg.first_name} ${reg.last_name}`;

console.log(`\n=== Testing with: ${name} ===\n`);

const body = {
  name,
  skills: reg.skills,
  additionalSkills: reg.additional_skills || '',
  musicDecade: reg.music_decade || '90s',
  musicGenre: reg.music_genre || 'pop',
  birthYear: reg.birth_year || 1983,
  // gender & selfConfidence are not in DB — only in client-side formData
  gender: 'man',
  selfConfidence: 7,
  hasPartner: reg.has_partner || false,
  partnerName: reg.partner_name || '',
  dietaryRequirements: reg.dietary_requirements || '',
  jkvJoinYear: reg.jkv_join_year || null,
  jkvExitYear: reg.jkv_exit_year || null,
  borrelCount2025: reg.borrel_count_2025 || 0,
  borrelPlanning2026: reg.borrel_planning_2026 || 0,
  quizAnswers: reg.quiz_answers || {},
};

console.log('Input data:');
console.log(JSON.stringify(body, null, 2));
console.log('\n--- Calling /api/assignment ---\n');

const response = await fetch('http://localhost:3000/api/assignment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const result = await response.json();
console.log('NIEUWE assignment:');
console.log(JSON.stringify(result, null, 2));

if (reg.ai_assignment) {
  console.log('\n--- Bestaande assignment in DB ---');
  console.log(JSON.stringify(reg.ai_assignment, null, 2));
}
