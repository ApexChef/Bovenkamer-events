import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both new publishable key and legacy anon key
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase credentials not configured. Using mock mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key'
);

// Server-side client with secret key (for API routes)
export const createServerClient = () => {
  // Support both new secret key and legacy service role key
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    console.warn('Secret key not configured');
    return supabase;
  }
  return createClient(supabaseUrl, secretKey);
};
