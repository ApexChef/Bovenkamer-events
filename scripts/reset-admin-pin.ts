#!/usr/bin/env npx ts-node
/**
 * Reset admin PIN script
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPin() {
  const email = 'alwin@apexchef.eu';
  const newPin = 'AB12'; // Format: 2 letters + 2 numbers

  // Get user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('email', email)
    .single();

  if (userError || !user) {
    console.log('User not found:', userError);
    return;
  }

  console.log('User found:', user);

  // Check auth_pins
  const { data: pin } = await supabase
    .from('auth_pins')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('Current PIN record:', pin || 'None');

  // Create new PIN with salt
  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(newPin, salt);

  // Delete existing and insert new
  await supabase.from('auth_pins').delete().eq('user_id', user.id);

  const { error: insertError } = await supabase
    .from('auth_pins')
    .insert({
      user_id: user.id,
      pin_hash: hashedPin,
      pin_salt: salt,
      failed_attempts: 0
    });

  if (insertError) {
    console.log('Error creating PIN:', insertError);
  } else {
    console.log(`\n✅ PIN reset to: ${newPin}`);
  }
}

resetPin();
