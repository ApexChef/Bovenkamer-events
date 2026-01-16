import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'participant')
      .order('name');

    if (error) {
      console.error('Error fetching participants:', error);
      // Return fallback list if database not configured
      return NextResponse.json([
        { value: 'alwin', label: 'Alwin' },
        { value: 'boy', label: 'Boy Boom' },
        { value: 'peter', label: 'Peter' },
        { value: 'jan', label: 'Jan' },
        { value: 'marco', label: 'Marco' },
        { value: 'henk', label: 'Henk' },
        { value: 'erik', label: 'Erik' },
        { value: 'bas', label: 'Bas' },
        { value: 'rob', label: 'Rob' },
        { value: 'kees', label: 'Kees' },
        { value: 'wim', label: 'Wim' },
      ]);
    }

    // Transform to dropdown format
    const participants = data.map((user) => ({
      value: user.id,
      label: user.name,
    }));

    // If no participants yet, return fallback
    if (participants.length === 0) {
      return NextResponse.json([
        { value: 'alwin', label: 'Alwin' },
        { value: 'boy', label: 'Boy Boom' },
        { value: 'peter', label: 'Peter' },
        { value: 'jan', label: 'Jan' },
        { value: 'marco', label: 'Marco' },
        { value: 'henk', label: 'Henk' },
        { value: 'erik', label: 'Erik' },
        { value: 'bas', label: 'Bas' },
        { value: 'rob', label: 'Rob' },
        { value: 'kees', label: 'Kees' },
        { value: 'wim', label: 'Wim' },
      ]);
    }

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Participants API error:', error);
    // Return fallback on error
    return NextResponse.json([
      { value: 'alwin', label: 'Alwin' },
      { value: 'boy', label: 'Boy Boom' },
    ]);
  }
}
