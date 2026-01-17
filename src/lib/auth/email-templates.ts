/**
 * File: src/lib/auth/email-templates.ts
 * Purpose: Email templates for authentication flow (all in Dutch)
 *
 * Templates:
 * - Registration verification email
 * - PIN reset request email
 * - Registration approved email
 * - Registration rejected email
 *
 * All emails use simple HTML with inline styles for maximum compatibility
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Common email styles
 */
const emailStyles = {
  container: `
    font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #F5F5DC;
    color: #1B4332;
  `,
  header: `
    background-color: #1B4332;
    color: #D4AF37;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `,
  title: `
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    margin: 0;
    color: #D4AF37;
  `,
  content: `
    background-color: #2C1810;
    color: #F5F5DC;
    padding: 30px;
    border-radius: 0 0 8px 8px;
  `,
  button: `
    display: inline-block;
    background-color: #D4AF37;
    color: #1B4332;
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    margin: 20px 0;
  `,
  footer: `
    text-align: center;
    margin-top: 20px;
    color: #1B4332;
    font-size: 14px;
  `,
};

/**
 * Registration verification email
 * @param name - User's name
 * @param verificationToken - Email verification token
 * @returns HTML email content
 */
export function registrationVerificationEmail(name: string, verificationToken: string): string {
  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifieer je email - Bovenkamer Winterproef</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5DC;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <h1 style="${emailStyles.title}">Bovenkamer Winterproef</h1>
      <p style="margin: 10px 0 0 0; color: #F5F5DC;">Nieuwjaars-BBQ 2026</p>
    </div>

    <div style="${emailStyles.content}">
      <h2 style="color: #D4AF37; margin-top: 0;">Hoi ${name}!</h2>

      <p>Welkom bij de Bovenkamer Winterproef! We hebben je registratie ontvangen.</p>

      <p><strong>Volgende stap:</strong> Verifieer je email adres door op de knop hieronder te klikken:</p>

      <div style="text-align: center;">
        <a href="${verificationLink}" style="${emailStyles.button}">
          Verifieer Email
        </a>
      </div>

      <p style="font-size: 14px; color: #D4AF37;">
        Of kopieer deze link in je browser:<br>
        <a href="${verificationLink}" style="color: #D4AF37;">${verificationLink}</a>
      </p>

      <p><strong>Wat gebeurt er nu?</strong></p>
      <ul style="line-height: 1.6;">
        <li>Je email wordt geverifieerd</li>
        <li>Een admin beoordeelt je registratie</li>
        <li>Je ontvangt een email wanneer je bent goedgekeurd</li>
        <li>Daarna kun je inloggen en meedoen!</li>
      </ul>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #D4AF37; font-size: 14px; color: #D4AF37;">
        <strong>Let op:</strong> Deze verificatielink is 48 uur geldig.
      </p>
    </div>

    <div style="${emailStyles.footer}">
      <p>Tot snel bij de Bovenkamer Winterproef!</p>
      <p style="font-size: 12px; color: #666;">
        Vragen? Neem contact op met de organisatie.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * PIN reset request email
 * @param name - User's name
 * @param resetToken - PIN reset token
 * @returns HTML email content
 */
export function pinResetEmail(name: string, resetToken: string): string {
  const resetLink = `${BASE_URL}/reset-pin?token=${resetToken}`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset je PIN - Bovenkamer Winterproef</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5DC;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <h1 style="${emailStyles.title}">Bovenkamer Winterproef</h1>
      <p style="margin: 10px 0 0 0; color: #F5F5DC;">PIN Reset Aanvraag</p>
    </div>

    <div style="${emailStyles.content}">
      <h2 style="color: #D4AF37; margin-top: 0;">Hoi ${name},</h2>

      <p>We hebben een aanvraag ontvangen om je PIN te resetten.</p>

      <p><strong>Klik op de knop hieronder om een nieuwe PIN in te stellen:</strong></p>

      <div style="text-align: center;">
        <a href="${resetLink}" style="${emailStyles.button}">
          Reset PIN
        </a>
      </div>

      <p style="font-size: 14px; color: #D4AF37;">
        Of kopieer deze link in je browser:<br>
        <a href="${resetLink}" style="color: #D4AF37;">${resetLink}</a>
      </p>

      <p style="margin-top: 30px; padding: 20px; background-color: #8B0000; border-radius: 4px; color: #F5F5DC;">
        <strong>Belangrijk:</strong> Als je deze aanvraag niet hebt gedaan, negeer deze email dan.
        Je huidige PIN blijft gewoon werken.
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #D4AF37;">
        <strong>Let op:</strong> Deze resetlink is 1 uur geldig.
      </p>
    </div>

    <div style="${emailStyles.footer}">
      <p>Bovenkamer Winterproef</p>
      <p style="font-size: 12px; color: #666;">
        Deze email werd verstuurd omdat een PIN reset werd aangevraagd.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Registration approved email
 * @param name - User's name
 * @returns HTML email content
 */
export function registrationApprovedEmail(name: string): string {
  const loginLink = `${BASE_URL}/login`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je bent goedgekeurd! - Bovenkamer Winterproef</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5DC;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <h1 style="${emailStyles.title}">Bovenkamer Winterproef</h1>
      <p style="margin: 10px 0 0 0; color: #F5F5DC;">🎉 Je bent erbij!</p>
    </div>

    <div style="${emailStyles.content}">
      <h2 style="color: #D4AF37; margin-top: 0;">Gefeliciteerd ${name}!</h2>

      <p style="font-size: 18px; color: #D4AF37;">
        <strong>Je registratie is goedgekeurd! 🎉</strong>
      </p>

      <p>Je kunt nu inloggen en alle functies gebruiken:</p>

      <ul style="line-height: 1.8;">
        <li>✅ Voorspellingen doen</li>
        <li>✅ Meedoen aan de live quiz</li>
        <li>✅ Boy Boom beoordelen</li>
        <li>✅ Punten verzamelen</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" style="${emailStyles.button}">
          Login Nu
        </a>
      </div>

      <p style="background-color: #2D5A27; padding: 15px; border-radius: 4px; border-left: 4px solid #D4AF37;">
        <strong>Log in met:</strong><br>
        • Je email adres<br>
        • De 4-cijferige PIN die je hebt aangemaakt
      </p>

      <p style="margin-top: 30px; text-align: center; font-size: 18px;">
        We kijken ernaar uit om je te zien bij de Winterproef!
      </p>
    </div>

    <div style="${emailStyles.footer}">
      <p>Tot snel! 🔥🍖</p>
      <p style="font-size: 12px; color: #666;">
        Bovenkamer Winterproef Nieuwjaars-BBQ 2026
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Registration rejected email
 * @param name - User's name
 * @param reason - Rejection reason
 * @returns HTML email content
 */
export function registrationRejectedEmail(name: string, reason: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registratie update - Bovenkamer Winterproef</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5DC;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <h1 style="${emailStyles.title}">Bovenkamer Winterproef</h1>
      <p style="margin: 10px 0 0 0; color: #F5F5DC;">Registratie Update</p>
    </div>

    <div style="${emailStyles.content}">
      <h2 style="color: #D4AF37; margin-top: 0;">Hoi ${name},</h2>

      <p>We hebben je registratie voor de Bovenkamer Winterproef beoordeeld.</p>

      <p style="background-color: #8B0000; padding: 20px; border-radius: 4px; border-left: 4px solid #D4AF37;">
        <strong>Helaas kunnen we je registratie op dit moment niet goedkeuren.</strong>
      </p>

      <p><strong>Reden:</strong></p>
      <p style="padding: 15px; background-color: #1B4332; border-radius: 4px;">
        ${reason}
      </p>

      <p style="margin-top: 30px;">
        Heb je vragen over deze beslissing? Neem dan contact op met de organisatie.
      </p>
    </div>

    <div style="${emailStyles.footer}">
      <p>Bovenkamer Winterproef</p>
      <p style="font-size: 12px; color: #666;">
        Hopelijk tot een volgende keer!
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Resend verification email (shorter version)
 * @param name - User's name
 * @param verificationToken - Email verification token
 * @returns HTML email content
 */
export function resendVerificationEmail(name: string, verificationToken: string): string {
  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verificatie - Bovenkamer Winterproef</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5DC;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <h1 style="${emailStyles.title}">Bovenkamer Winterproef</h1>
      <p style="margin: 10px 0 0 0; color: #F5F5DC;">Email Verificatie</p>
    </div>

    <div style="${emailStyles.content}">
      <h2 style="color: #D4AF37; margin-top: 0;">Hoi ${name},</h2>

      <p>Hier is je nieuwe verificatielink:</p>

      <div style="text-align: center;">
        <a href="${verificationLink}" style="${emailStyles.button}">
          Verifieer Email
        </a>
      </div>

      <p style="font-size: 14px; color: #D4AF37;">
        Of kopieer deze link: <a href="${verificationLink}" style="color: #D4AF37;">${verificationLink}</a>
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #D4AF37;">
        Deze link is 48 uur geldig.
      </p>
    </div>

    <div style="${emailStyles.footer}">
      <p>Bovenkamer Winterproef</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain text fallback for registration verification
 */
export function registrationVerificationPlainText(name: string, verificationToken: string): string {
  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

  return `
Bovenkamer Winterproef - Email Verificatie

Hoi ${name}!

Welkom bij de Bovenkamer Winterproef! We hebben je registratie ontvangen.

Volgende stap: Verifieer je email adres door deze link te bezoeken:
${verificationLink}

Wat gebeurt er nu?
- Je email wordt geverifieerd
- Een admin beoordeelt je registratie
- Je ontvangt een email wanneer je bent goedgekeurd
- Daarna kun je inloggen en meedoen!

Let op: Deze verificatielink is 48 uur geldig.

Tot snel bij de Bovenkamer Winterproef!
  `.trim();
}
