/**
 * emailService.ts — Sends bilingual (Telugu + English) OTP & Welcome Emails via Nodemailer + Gmail / Custom SMTP.
 * Configured using environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */
import nodemailer from 'nodemailer';
import { env } from './config.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create Nodemailer transport based on environment variables
export function createSmtpTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('[EmailService] SMTP_USER or SMTP_PASS not configured. Emails will be logged to console in dev mode.');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for port 465, false for 587
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createSmtpTransporter();
    if (!transporter) {
      console.log(`[EmailService DEV MOCK] To: ${options.to} | Subject: ${options.subject}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`[EmailService SUCCESS] Email dispatched to ${options.to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService ERROR] Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * 100% Light Theme OTP Email Template
 * Clean white card, golden saffron & forest green accents, dark charcoal typography.
 */
export function generateOtpEmailHtml(otpCode: string, name?: string): string {
  const recipientName = name ?? 'స్వామి (Swami)';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deeksha Journey Verification Code</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-top: 5px solid #D97706; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);">
    
    <!-- Sacred Header -->
    <div style="text-align: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">🛕</div>
      <div style="color: #B45309; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin: 4px 0;">Deeksha Journey • దీక్షా జర్నీ</div>
      <div style="color: #15803D; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">స్వామియే శరణం అయ్యప్ప • Swamiye Saranam Ayyappa</div>
    </div>

    <!-- Greeting & Message -->
    <div style="font-size: 15px; line-height: 1.65; color: #374151; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0;"><strong style="color: #111827; font-size: 16px;">నమస్కారం ${recipientName},</strong></p>
      <p style="margin: 0 0 8px 0; color: #4B5563;">మీ దీక్షా జర్నీ ఖాతా సైన్ ఇన్ / నమోదు కొరకు మీ వెరిఫికేషన్ ఓటీపీ కోడ్ క్రింద ఇవ్వబడింది:</p>
      <p style="margin: 0; color: #6B7280; font-size: 14px; font-style: italic;">Use the verification OTP code below to complete your sign-in to Deeksha Journey:</p>
    </div>

    <!-- High-Contrast Light Theme OTP Box -->
    <div style="background-color: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Verification Code / ఓటీపీ కోడ్</div>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #B45309; font-family: monospace, Courier, sans-serif;">${otpCode}</div>
      <div style="font-size: 12px; color: #78350F; margin-top: 8px; font-weight: 600;">⏱️ Valid for 10 minutes • 10 నిమిషాలు మాత్రమే చెల్లుబాటు అవుతుంది</div>
    </div>

    <!-- Security Advisory -->
    <div style="font-size: 13px; line-height: 1.5; color: #6B7280; margin: 20px 0 24px 0; background: #F9FAFB; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #9CA3AF;">
      🔒 <strong>Security Tip:</strong> Never share this OTP with anyone. If you did not request this login, you can safely ignore this email.
    </div>

    <!-- Clean Footer -->
    <div style="text-align: center; font-size: 12px; line-height: 1.5; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 18px; margin-top: 24px;">
      © ${new Date().getFullYear()} DeekshaOrg (India). All rights reserved.<br>
      శబరిమల యాత్ర మరియు మండల వ్రత నిష్ఠ కోసం మీ ఆధ్యాత్మిక సహచరుడు.<br>
      <span style="color: #6B7280;">Compliant with IT Act 2000 & DPDP Act 2023.</span>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * 100% Light Theme Welcome Email Template
 */
export function generateWelcomeEmailHtml(name: string, deekshaName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Deeksha Journey</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-top: 5px solid #D97706; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);">
    
    <div style="text-align: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="font-size: 42px; margin-bottom: 8px;">🙏</div>
      <div style="color: #B45309; font-size: 24px; font-weight: 800; margin: 4px 0;">స్వాగతం, ${name} స్వామి!</div>
      <div style="color: #15803D; font-size: 14px; font-weight: 700;">మీ ${deekshaName} దీక్ష జర్నీ ప్రారంభమైంది ✨</div>
    </div>

    <div style="font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 20px;">
      దీక్షా జర్నీ కమ్యూనిటీకి హృదయపూర్వక స్వాగతం! మీ మండల వ్రతం మరియు ఆధ్యాత్మిక యాత్ర ప్రతిరోజూ క్రమశిక్షణతో, ఆనందంగా మరియు దైవానుగ్రహంతో సాగాలని కోరుకుంటున్నాము.
    </div>

    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">🌟 యాప్ ముఖ్య అంశాలు (Key Features):</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563; margin-bottom: 8px;">📌 <strong>నిత్య చెక్-ఇన్:</strong> ఉదయం & సాయంత్రం దీక్షా నియమాలు పూర్తి చేసి పాయింట్లు పొందండి.</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563; margin-bottom: 8px;">🕉️ <strong>పూజా విధానం:</strong> 108 శరణు ఘోష, హరివరాసనం & భక్తి గీతాలు.</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563;">👥 <strong>సన్నిధానం (గుంపులు):</strong> మీ గురు స్వామితో యాత్ర ఖర్చులు మరియు సందేశాలు పంచుకోండి.</div>
    </div>

    <div style="text-align: center; margin: 24px 0 16px 0;">
      <div style="font-size: 16px; font-weight: 800; color: #B45309;">స్వామియే శరణం అయ్యప్ప! 🕉️</div>
    </div>

    <div style="text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 18px; margin-top: 24px;">
      © ${new Date().getFullYear()} DeekshaOrg (India). All rights reserved.<br>
      Deeksha Journey App • deeksha.app
    </div>

  </div>
</body>
</html>
  `;
}

export async function sendOtpEmail(email: string, otpCode: string, name?: string): Promise<boolean> {
  const html = generateOtpEmailHtml(otpCode, name);
  const text = `నమస్కారం ${name ?? 'స్వామి'},\n\nమీ దీక్షా జర్నీ లాగిన్ ఓటీపీ కోడ్: ${otpCode}\n\nYour Deeksha Journey login verification code is: ${otpCode}\n\n(Valid for 10 minutes. Please do not share this code with anyone.)\n\nస్వామియే శరణం అయ్యప్ప!`;
  return sendEmail({
    to: email,
    subject: `🔑 ${otpCode} — Deeksha Journey Verification Code / ఓటీపీ కోడ్`,
    text,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string, deekshaName: string = 'అయ్యప్ప (Ayyappa)'): Promise<boolean> {
  const html = generateWelcomeEmailHtml(name, deekshaName);
  const text = `స్వాగతం ${name} స్వామి!\n\nమీ ${deekshaName} దీక్ష జర్నీ ప్రారంభమైంది.\n\nస్వామియే శరణం అయ్యప్ప!`;
  return sendEmail({
    to: email,
    subject: `🙏 స్వాగతం ${name} స్వామి — Welcome to Deeksha Journey!`,
    text,
    html,
  });
}

