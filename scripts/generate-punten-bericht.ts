import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ProfileSection {
  key: string;
  label: string;
  points: number;
  descriptions: string[];
}

const PROFILE_SECTIONS: ProfileSection[] = [
  { key: 'basic', label: 'Basis profiel', points: 10, descriptions: ['profile_basic', 'Registratie voltooid'] },
  { key: 'personal', label: 'Persoonlijke gegevens', points: 50, descriptions: ['profile_personal'] },
  { key: 'skills', label: 'Vaardigheden', points: 40, descriptions: ['profile_skills'] },
  { key: 'music', label: 'Muziekvoorkeur', points: 20, descriptions: ['profile_music'] },
  { key: 'jkvHistorie', label: 'JKV Historie', points: 30, descriptions: ['profile_jkvHistorie'] },
  { key: 'borrelStats', label: 'Borrel statistieken', points: 30, descriptions: ['profile_borrelStats'] },
  { key: 'quiz', label: 'Leuke vragen', points: 80, descriptions: ['profile_quiz'] },
  { key: 'food_drink', label: 'Eten & drinken', points: 40, descriptions: ['food_drink_preferences'] },
];

const MAX_PROFILE_POINTS = PROFILE_SECTIONS.reduce((sum, s) => sum + s.points, 0);

async function main() {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, total_points, registration_points')
    .eq('registration_status', 'approved')
    .order('name');

  if (usersError || !users) {
    console.error('Fout bij ophalen gebruikers:', usersError);
    process.exit(1);
  }

  const { data: ledgerEntries, error: ledgerError } = await supabase
    .from('points_ledger')
    .select('user_id, description')
    .eq('source', 'registration');

  if (ledgerError) {
    console.error('Fout bij ophalen puntenboek:', ledgerError);
    process.exit(1);
  }

  // Build lookup: user_id → set of descriptions
  const userDescriptions: Record<string, Set<string>> = {};
  for (const entry of ledgerEntries || []) {
    if (!userDescriptions[entry.user_id]) {
      userDescriptions[entry.user_id] = new Set();
    }
    userDescriptions[entry.user_id].add(entry.description);
  }

  const lines: string[] = [];
  lines.push('# Persoonlijk puntenoverzicht per deelnemer');
  lines.push('');
  lines.push(`> Gegenereerd op ${new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const user of users) {
    const firstName = user.name?.split(' ')[0] || 'Deelnemer';
    const descriptions = userDescriptions[user.id] || new Set<string>();

    const completed: ProfileSection[] = [];
    const missing: ProfileSection[] = [];

    for (const section of PROFILE_SECTIONS) {
      const isCompleted = section.descriptions.some(d => descriptions.has(d));
      if (isCompleted) {
        completed.push(section);
      } else {
        missing.push(section);
      }
    }

    const earnedProfilePoints = completed.reduce((sum, s) => sum + s.points, 0);
    const missedProfilePoints = missing.reduce((sum, s) => sum + s.points, 0);
    const isProfileComplete = missing.length === 0;

    lines.push(`## ${user.name}`);
    lines.push('');

    if (isProfileComplete) {
      lines.push(`Hoi ${firstName}! Je profiel is helemaal compleet, goed bezig! Je hebt alle **${MAX_PROFILE_POINTS} profielpunten** verdiend.`);
      lines.push('');
      lines.push(`Je staat nu op **${user.total_points} punten** totaal. Wil je nog hoger op het leaderboard komen? Speel dan het **Burger Stack spel** op je dashboard en verdien extra game-punten!`);
    } else {
      lines.push(`Hoi ${firstName}! Je hebt al **${earnedProfilePoints}** van de ${MAX_PROFILE_POINTS} profielpunten verdiend. Er liggen nog **${missedProfilePoints} punten** voor het oprapen!`);
      lines.push('');
      lines.push('**Wat je nog kunt invullen:**');
      lines.push('');
      for (const section of missing) {
        lines.push(`- ${section.label} — **+${section.points} punten**`);
      }
      lines.push('');
      lines.push(`Ga naar je [dashboard](https://bovenkamer.netlify.app/dashboard) en vul je profiel verder aan om deze punten te verdienen.`);
      lines.push('');
      lines.push(`Daarnaast kun je ook het **Burger Stack spel** spelen om nog meer punten te scoren. Er zit geen limiet op game-punten, dus hoe beter je scoort, hoe hoger je komt op het leaderboard!`);
    }

    lines.push('');

    lines.push('| Sectie | Punten | Status |');
    lines.push('|--------|--------|--------|');
    for (const section of PROFILE_SECTIONS) {
      const done = completed.includes(section);
      lines.push(`| ${section.label} | ${section.points} | ${done ? 'Voltooid' : '**Open**'} |`);
    }
    lines.push(`| **Totaal profiel** | **${earnedProfilePoints}/${MAX_PROFILE_POINTS}** | |`);
    lines.push(`| **Totaal alle punten** | **${user.total_points}** | |`);

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const outputPath = path.resolve(__dirname, '../docs/punten-overzicht-deelnemers.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`Markdown gegenereerd: ${outputPath}`);
  console.log(`${users.length} deelnemers verwerkt`);
}

main().catch(err => {
  console.error('Script fout:', err);
  process.exit(1);
});
