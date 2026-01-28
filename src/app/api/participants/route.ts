import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all approved users (they are the participants)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, first_name')
      .eq('registration_status', 'approved')
      .eq('is_active', true)
      .order('name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json([]);
    }

    // Get registrations for partner info
    const { data: registrations } = await supabase
      .from('registrations')
      .select('user_id, has_partner, partner_name, partner_first_name');

    // Create a map of user_id to registration data
    const regMap = new Map<string, { has_partner: boolean; partner_name: string | null; partner_first_name: string | null }>();
    for (const reg of registrations || []) {
      if (reg.user_id) {
        regMap.set(reg.user_id, {
          has_partner: reg.has_partner,
          partner_name: reg.partner_name,
          partner_first_name: reg.partner_first_name,
        });
      }
    }

    // Build participants list
    const participants: { value: string; label: string }[] = [];

    for (const user of users || []) {
      if (!user.name) continue;

      // Use first_name if available, otherwise extract from name
      const firstName = user.first_name || user.name.split(' ')[0];

      // Add the user
      participants.push({
        value: user.id,
        label: firstName,
      });

      // Add partner if exists
      const reg = regMap.get(user.id);
      if (reg?.has_partner && (reg.partner_first_name || reg.partner_name)) {
        const partnerFirstName = reg.partner_first_name || (reg.partner_name?.split(' ')[0] ?? '');
        if (partnerFirstName) {
          participants.push({
            value: `partner-${user.id}`,
            label: `${partnerFirstName} (${firstName})`,
          });
        }
      }
    }

    // Sort alphabetically by label
    participants.sort((a, b) => a.label.localeCompare(b.label, 'nl'));

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Participants API error:', error);
    return NextResponse.json([]);
  }
}
