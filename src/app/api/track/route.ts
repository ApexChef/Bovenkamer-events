import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, email, referrer, userAgent, isRegistered } = body;

    // Log to database
    const { error } = await supabase.from('page_visits').insert({
      page,
      user_email: email || null,
      referrer: referrer || null,
      user_agent: userAgent || null,
      is_registered: isRegistered ?? false,
      visited_at: new Date().toISOString(),
    });

    if (error) {
      // Table might not exist yet, just log to console
      console.log(`[PAGE VISIT] ${new Date().toISOString()} | Page: ${page} | User: ${email || 'anonymous'} | Registered: ${isRegistered} | Referrer: ${referrer || 'direct'}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
