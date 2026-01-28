import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get users with their registration data (including partner names)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'participant')
      .order('name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json([]);
    }

    // Get registrations with partner info
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, name, has_partner, partner_name');

    if (regError) {
      console.error('Error fetching registrations:', regError);
    }

    // Build participants list
    const participants: { value: string; label: string }[] = [];

    // Add registered users
    for (const user of users || []) {
      // Get first name only for cleaner display
      const firstName = user.name.split(' ')[0];
      participants.push({
        value: user.id,
        label: firstName,
      });

      // Check if user has a partner
      const registration = registrations?.find((r) => r.user_id === user.id);
      if (registration?.has_partner && registration?.partner_name) {
        const partnerFirstName = registration.partner_name.split(' ')[0];
        participants.push({
          value: `partner-${user.id}`,
          label: `${partnerFirstName} (partner)`,
        });
      }
    }

    // Sort alphabetically by label
    participants.sort((a, b) => a.label.localeCompare(b.label, 'nl'));

    // If no participants yet, return empty (no fallback dummy data)
    if (participants.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Participants API error:', error);
    return NextResponse.json([]);
  }
}
