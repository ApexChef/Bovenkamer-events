/**
 * File: src/app/api/auth/verify-email/route.ts
 * Purpose: Email verification endpoint via token link
 *
 * Flow:
 * 1. Extract token from query parameter
 * 2. Find verification record by token
 * 3. Check if already verified
 * 4. Check if token expired
 * 5. Mark email as verified in users table
 * 6. Update verification record with verified_at timestamp
 * 7. Redirect to status page
 *
 * Returns:
 * - 302 redirect on success
 * - HTML error page on failure
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(
      `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ongeldige link - Bovenkamer Winterproef</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1B4332, #2C1810);
      color: #F5F5DC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: #2C1810;
      border-radius: 8px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border: 2px solid #D4AF37;
    }
    h1 {
      color: #D4AF37;
      margin-top: 0;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Ongeldige Link</h1>
    <p>Deze verificatielink is ongeldig of ontbreekt.</p>
    <p>Controleer of je de volledige link hebt gebruikt uit de email.</p>
    <p><a href="/">← Terug naar home</a></p>
  </div>
</body>
</html>
      `,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }

  try {
    const supabase = createServerClient();

    // Find verification record
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('id, user_id, expires_at, verified_at')
      .eq('token', token)
      .single();

    if (!verification || verificationError) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ongeldige link - Bovenkamer Winterproef</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1B4332, #2C1810);
      color: #F5F5DC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: #2C1810;
      border-radius: 8px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border: 2px solid #D4AF37;
    }
    h1 {
      color: #D4AF37;
      margin-top: 0;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Ongeldige Token</h1>
    <p>Deze verificatielink is ongeldig of bestaat niet.</p>
    <p>Mogelijk heb je al een nieuwere verificatie email ontvangen.</p>
    <p><a href="/register">Nieuwe verificatie aanvragen →</a></p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    // Check if already verified
    if (verification.verified_at) {
      return NextResponse.redirect(new URL('/?verified=already', request.url));
    }

    // Check if expired
    const expiresAt = new Date(verification.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link verlopen - Bovenkamer Winterproef</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1B4332, #2C1810);
      color: #F5F5DC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: #2C1810;
      border-radius: 8px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border: 2px solid #D4AF37;
    }
    h1 {
      color: #D4AF37;
      margin-top: 0;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⏱️ Link Verlopen</h1>
    <p>Deze verificatielink is verlopen (geldig tot ${expiresAt.toLocaleDateString('nl-NL')}).</p>
    <p>Vraag een nieuwe verificatie email aan:</p>
    <p><a href="/register">Nieuwe verificatie aanvragen →</a></p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    // Mark email as verified
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        email_verified: true,
      })
      .eq('id', verification.user_id);

    if (updateUserError) {
      console.error('Error updating user email_verified:', updateUserError);
      throw updateUserError;
    }

    // Update verification record
    const { error: updateVerificationError } = await supabase
      .from('email_verifications')
      .update({
        verified_at: now.toISOString(),
      })
      .eq('id', verification.id);

    if (updateVerificationError) {
      console.error('Error updating verification record:', updateVerificationError);
      // Continue anyway - email is verified
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);

    return new NextResponse(
      `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fout - Bovenkamer Winterproef</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1B4332, #2C1810);
      color: #F5F5DC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: #2C1810;
      border-radius: 8px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border: 2px solid #D4AF37;
    }
    h1 {
      color: #D4AF37;
      margin-top: 0;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ Er ging iets mis</h1>
    <p>Er is een fout opgetreden bij het verifiëren van je email.</p>
    <p>Probeer het opnieuw of neem contact op met de organisatie.</p>
    <p><a href="/">← Terug naar home</a></p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
}
