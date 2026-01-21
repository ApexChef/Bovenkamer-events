#!/usr/bin/env npx ts-node
/**
 * Seed Test Users Script for Bovenkamer Winterproef
 *
 * Creates test user accounts with complete profiles for testing purposes.
 *
 * Usage:
 *   npm run seed:users
 *   node --env-file=.env.local --import=tsx scripts/seed-test-users.ts
 *
 * Options:
 *   --dry-run    Show what would be created without actually creating
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
};

// Test users to create based on the member list screenshots
const testUsers = [
  { name: 'Bart Vossen', pin: 'BV01' },
  { name: 'Gerard den Teuling', pin: 'GT02' },
  { name: 'Laura Borst', pin: 'LB03' },
  { name: 'Loes Rouwette', pin: 'LR04' },
  { name: 'Luuk Jansen', pin: 'LJ05' },
  { name: 'Margot van Kreij', pin: 'MK06' },
  { name: 'Marlies Janssen-Herraets', pin: 'MJ07' },
  { name: 'Marlou van Zwamen', pin: 'MZ08' },
  { name: 'Niek Spronken', pin: 'NS09' },
  { name: 'Renate van Van Kempen', pin: 'RK10' },
  { name: 'Boy Boom', pin: 'BB11' },
];

// Generate email from name
function generateEmail(name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/van /g, '')
    .replace(/den /g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '.');
  return `${cleanName}@test.bovenkamer.nl`;
}

// Generate random birth year between 1970 and 2000
function randomBirthYear(): number {
  return Math.floor(Math.random() * 30) + 1970;
}

// Random selection from array
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Hash PIN using bcrypt
async function hashPIN(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pin.toUpperCase(), salt);
  return { hash, salt };
}

// Profile data options for random selection
const skillCategories = [
  'GRILL_MASTER', 'FIRE_KEEPER', 'SALAD_SPECIALIST', 'DRINK_MIXER',
  'ENTERTAINMENT', 'LOGISTICS', 'CLEANUP_CREW', 'SOCIAL_BUTTERFLY'
];

const musicDecades = ['80s', '90s', '00s', '10s'];

const musicGenres = [
  'Rock', 'Pop', 'Dance', 'Hip-hop', 'Jazz', 'Classical', 'Metal', 'Country'
];

const dietaryOptions = [
  '', 'Vegetarisch', 'Veganistisch', 'Glutenvrij', 'Lactose-intolerant', ''
];

async function createTestUser(userData: { name: string; pin: string }) {
  const email = generateEmail(userData.name);
  const pinData = await hashPIN(userData.pin);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log(`   ⏭️  ${userData.name} already exists, skipping...`);
    return { skipped: true, email, pin: userData.pin };
  }

  if (options.dryRun) {
    console.log(`   📝 Would create: ${userData.name} (${email})`);
    return { created: true, email, pin: userData.pin };
  }

  // Create user (only use columns that exist in the actual schema)
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      name: userData.name,
      role: 'participant',
      email_verified: true,
      registration_status: 'approved',
      profile_completion: 100,
    })
    .select('id')
    .single();

  if (userError || !newUser) {
    console.error(`   ❌ Failed to create user ${userData.name}:`, userError?.message);
    return { error: true, email, pin: userData.pin };
  }

  // Create auth_pins entry
  const { error: pinError } = await supabase
    .from('auth_pins')
    .insert({
      user_id: newUser.id,
      pin_hash: pinData.hash,
      pin_salt: pinData.salt,
      failed_attempts: 0,
    });

  if (pinError) {
    console.error(`   ❌ Failed to create PIN for ${userData.name}:`, pinError.message);
    // Rollback user
    await supabase.from('users').delete().eq('id', newUser.id);
    return { error: true, email, pin: userData.pin };
  }

  // Create registration with profile data
  const hasPartner = Math.random() > 0.6;
  const { error: regError } = await supabase
    .from('registrations')
    .insert({
      user_id: newUser.id,
      name: userData.name,
      email,
      birth_year: randomBirthYear(),
      has_partner: hasPartner,
      partner_name: hasPartner ? `Partner van ${userData.name.split(' ')[0]}` : null,
      dietary_requirements: randomChoice(dietaryOptions),
      primary_skill: randomChoice(skillCategories),
      additional_skills: `${randomChoice(skillCategories)}, ${randomChoice(skillCategories)}`,
      music_decade: randomChoice(musicDecades),
      music_genre: randomChoice(musicGenres),
      quiz_answers: {
        bbqExperience: Math.floor(Math.random() * 5) + 1,
        favoriteFood: randomChoice(['Biefstuk', 'Spareribs', 'Vis', 'Groenten', 'Kip']),
        partyAnimal: Math.random() > 0.5,
      },
      predictions: {
        wineBottles: Math.floor(Math.random() * 20) + 5,
        beerCrates: Math.floor(Math.random() * 10) + 3,
        meatKilos: Math.floor(Math.random() * 30) + 10,
        somethingBurned: Math.random() > 0.3,
        firstSleeper: randomChoice(testUsers.map(u => u.name)),
        loudestLaugher: randomChoice(testUsers.map(u => u.name)),
      },
      is_complete: true,
      current_step: 5,
      status: 'approved',
    });

  if (regError) {
    console.error(`   ⚠️  Failed to create registration for ${userData.name}:`, regError.message);
    // User still exists, just no registration data
  }

  // Add points ledger entry for registration
  await supabase
    .from('points_ledger')
    .insert({
      user_id: newUser.id,
      source: 'registration',
      points: 10,
      description: 'Registratie voltooid',
    });

  console.log(`   ✅ Created: ${userData.name} (${email})`);
  return { created: true, email, pin: userData.pin };
}

async function main() {
  console.log('\n🌱 Bovenkamer Winterproef - Seed Test Users');
  console.log('==========================================\n');

  if (options.dryRun) {
    console.log('🏃 DRY RUN MODE - No data will be created\n');
  }

  console.log('👥 Creating test users...\n');

  const results: Array<{ name: string; email: string; pin: string; status: string }> = [];

  for (const user of testUsers) {
    const result = await createTestUser(user);
    results.push({
      name: user.name,
      email: result.email,
      pin: result.pin,
      status: result.skipped ? 'skipped' : result.error ? 'error' : 'created',
    });
  }

  console.log('\n==========================================');
  console.log('📋 CREDENTIALS LIST\n');
  console.log('| Naam                        | Email                                    | PIN  |');
  console.log('|-----------------------------|------------------------------------------|------|');

  for (const r of results) {
    const namePad = r.name.padEnd(27);
    const emailPad = r.email.padEnd(40);
    console.log(`| ${namePad} | ${emailPad} | ${r.pin} |`);
  }

  console.log('\n==========================================');

  const created = results.filter(r => r.status === 'created').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors = results.filter(r => r.status === 'error').length;

  if (options.dryRun) {
    console.log(`📋 Would create ${created} users`);
  } else {
    console.log(`✅ Created: ${created} | ⏭️ Skipped: ${skipped} | ❌ Errors: ${errors}`);
  }

  console.log('\n💡 All users have PIN format: XX## (2 letters + 2 digits)');
  console.log('   Example: BV01 for Bart Vossen\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});