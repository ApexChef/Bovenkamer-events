#!/usr/bin/env npx ts-node
/**
 * Reset Script for Bovenkamer Winterproef
 *
 * This script clears all user data from the database for testing purposes.
 * It respects foreign key constraints by deleting in the correct order.
 *
 * Usage:
 *   npx ts-node scripts/reset-app.ts [--confirm] [--keep-admins] [--keep-expected]
 *
 * Options:
 *   --confirm       Skip confirmation prompt
 *   --keep-admins   Keep admin users (useful for development)
 *   --keep-expected Keep expected participants list
 *   --dry-run       Show what would be deleted without actually deleting
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Environment variables are loaded via --env-file flag in npm script

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  confirm: args.includes('--confirm'),
  keepAdmins: args.includes('--keep-admins'),
  keepExpected: args.includes('--keep-expected'),
  dryRun: args.includes('--dry-run'),
};

interface TableCount {
  table: string;
  count: number;
}

async function getTableCounts(): Promise<TableCount[]> {
  const tables = [
    'quiz_answers',
    'quiz_players',
    'quiz_sessions',
    'points_ledger',
    'ratings',
    'game_scores',
    'payment_webhooks',
    'payment_requests',
    'registrations',
    'auth_pins',
    'email_verifications',
    'rate_limits',
    'users',
  ];

  const counts: TableCount[] = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        counts.push({ table, count: count || 0 });
      }
    } catch (e) {
      // Table might not exist
    }
  }

  return counts;
}

async function clearTable(tableName: string): Promise<number> {
  try {
    // First count what we have
    const { count: beforeCount, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      // Table might not exist
      return 0;
    }

    if (options.dryRun) {
      return beforeCount || 0;
    }

    if (!beforeCount || beforeCount === 0) {
      return 0;
    }

    // Try different delete strategies based on table
    // Strategy 1: Delete with 'id' not null (works for all tables with id)
    const { error } = await supabase
      .from(tableName)
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error(`  Error clearing ${tableName}:`, error.message);
      return 0;
    }

    return beforeCount || 0;
  } catch (e) {
    // Table might not exist in schema
    return 0;
  }
}

async function resetExpectedParticipants(): Promise<number> {
  const { count: beforeCount } = await supabase
    .from('expected_participants')
    .select('*', { count: 'exact', head: true })
    .eq('is_registered', true);

  if (options.dryRun) {
    return beforeCount || 0;
  }

  const { error } = await supabase
    .from('expected_participants')
    .update({
      is_registered: false,
      registered_by_user_id: null
    })
    .eq('is_registered', true);

  if (error) {
    console.error('  Error resetting expected_participants:', error.message);
    return 0;
  }

  return beforeCount || 0;
}

async function confirmReset(): Promise<boolean> {
  if (options.confirm) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  Are you sure you want to reset the app? This will DELETE all user data! (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('\n🔄 Bovenkamer Winterproef - Reset Script');
  console.log('=========================================\n');

  if (options.dryRun) {
    console.log('🏃 DRY RUN MODE - No data will be deleted\n');
  }

  // Show current state
  console.log('📊 Current database state:');
  const counts = await getTableCounts();

  for (const { table, count } of counts) {
    if (count > 0) {
      console.log(`   ${table}: ${count} records`);
    }
  }

  const totalRecords = counts.reduce((sum, c) => sum + c.count, 0);

  if (totalRecords === 0) {
    console.log('\n✅ Database is already empty!');
    return;
  }

  console.log(`\n   Total: ${totalRecords} records`);

  // Show options
  console.log('\n⚙️  Options:');
  console.log(`   Keep admins: ${options.keepAdmins ? 'Yes' : 'No'}`);
  console.log(`   Keep expected participants: ${options.keepExpected ? 'Yes' : 'No'}`);

  // Confirm
  if (!await confirmReset()) {
    console.log('\n❌ Reset cancelled.');
    return;
  }

  console.log('\n🗑️  Clearing data...\n');

  // Order matters due to foreign key constraints!
  const deletionOrder = [
    { table: 'quiz_answers', label: 'Quiz answers' },
    { table: 'quiz_players', label: 'Quiz players' },
    { table: 'quiz_sessions', label: 'Quiz sessions' },
    { table: 'points_ledger', label: 'Points ledger' },
    { table: 'ratings', label: 'Ratings' },
    { table: 'game_scores', label: 'Game scores' },
    { table: 'payment_webhooks', label: 'Payment webhooks' },
    { table: 'payment_requests', label: 'Payment requests' },
    { table: 'registrations', label: 'Registrations' },
    { table: 'auth_pins', label: 'Auth PINs' },
    { table: 'email_verifications', label: 'Email verifications' },
    { table: 'rate_limits', label: 'Rate limits' },
  ];

  let totalDeleted = 0;

  for (const { table, label } of deletionOrder) {
    process.stdout.write(`   Clearing ${label}...`);
    const deleted = await clearTable(table);
    totalDeleted += deleted;
    console.log(` ${deleted > 0 ? `✓ (${deleted})` : '✓'}`);
  }

  // Handle expected participants (reset, not delete)
  if (!options.keepExpected) {
    process.stdout.write('   Resetting expected participants...');
    const reset = await resetExpectedParticipants();
    console.log(` ✓ (${reset} reset)`);
  }

  // Delete users last (due to foreign key constraints)
  process.stdout.write('   Clearing users...');
  if (options.keepAdmins) {
    // Count non-admin users first
    const { count: nonAdminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin');

    if (options.dryRun) {
      console.log(` would delete ${nonAdminCount || 0} (admins kept)`);
    } else {
      // Delete only non-admin users
      const { error } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin')
        .not('id', 'is', null);

      if (error) {
        console.log(` ✗ (${error.message})`);
      } else {
        totalDeleted += nonAdminCount || 0;
        console.log(` ✓ (${nonAdminCount || 0}, admins kept)`);
      }
    }
  } else {
    const deleted = await clearTable('users');
    totalDeleted += deleted;
    console.log(` ✓ (${deleted})`);
  }

  console.log('\n=========================================');
  if (options.dryRun) {
    console.log(`📋 Would delete ${totalDeleted} records total`);
  } else {
    console.log(`✅ Reset complete! Deleted ${totalDeleted} records.`);
  }

  console.log('\n💡 Don\'t forget to clear your browser\'s localStorage:');
  console.log('   localStorage.clear()');
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
