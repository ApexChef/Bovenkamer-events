#!/usr/bin/env npx ts-node
/**
 * Test email sending
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bovenkamer-winterproef.nl';

async function testEmail() {
  console.log('Testing email configuration...\n');
  console.log('RESEND_API_KEY:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('FROM_EMAIL:', FROM_EMAIL);
  console.log('');

  if (!RESEND_API_KEY) {
    console.log('❌ No RESEND_API_KEY - emails will only be logged to console');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Bovenkamer Test <${FROM_EMAIL}>`,
        to: ['alwin@apexchef.eu'],
        subject: 'Test Email - Bovenkamer',
        html: '<p>Dit is een test email.</p>',
      }),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('\n✅ Email sent successfully!');
    } else {
      console.log('\n❌ Email failed to send');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();
