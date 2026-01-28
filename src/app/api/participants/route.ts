import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get registrations with user info - only users who registered (are coming)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, has_partner, partner_name, users!inner(id, name)')
      .order('users(name)');

    if (regError) {
      console.error('Error fetching registrations:', regError);
      return NextResponse.json([]);
    }

    // Build participants list
    const participants: { value: string; label: string }[] = [];

    for (const reg of registrations || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = reg.users as any;
      if (!user?.name) continue;
      const firstName = user.name.split(' ')[0];

      // Add the registered user
      participants.push({
        value: user.id,
        label: firstName,
      });

      // Add partner if exists: "Tamar (Alwin)"
      if (reg.has_partner && reg.partner_name) {
        const partnerFirstName = reg.partner_name.split(' ')[0];
        participants.push({
          value: `partner-${user.id}`,
          label: `${partnerFirstName} (${firstName})`,
        });
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
