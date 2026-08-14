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
      html: options.html,
    });

    console.log(`[EmailService SUCCESS] Email sent to ${options.to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService ERROR] Failed to send email to ${options.to}:`, error);
    return false;
  }
}

export function generateOtpEmailHtml(otpCode: string, name?: string): string {
  const recipientName = name ?? 'స్వామి (Swami)';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0D1117; color: #E6EDF3; margin: 0; padding: 20px; }
    .card { max-width: 560px; margin: 0 auto; background: #161B22; border: 1px solid #30363D; border-radius: 16px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid #30363D; padding-bottom: 20px; margin-bottom: 24px; }
    .title { color: #F0B429; font-size: 24px; font-weight: bold; margin: 8px 0; }
    .saranam { color: #58A6FF; font-size: 14px; font-weight: 600; }
    .otp-box { background: #0D1117; border: 2px dashed #F0B429; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #F0B429; }
    .body-text { font-size: 15px; line-height: 1.6; color: #8B949E; margin-bottom: 16px; }
    .footer { text-align: center; font-size: 12px; color: #6E7681; border-top: 1px solid #30363D; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 40px;">🛕</div>
      <div class="title">DeekshaOrg — దీక్షా జర్నీ</div>
      <div class="saranam">స్వామియే శరణం అయ్యప్ప • Swamiye Saranam Ayyappa</div>
    </div>

    <div class="body-text">
      <strong style="color: #E6EDF3;">నమస్కారం ${recipientName},</strong><br>
      మీ దీక్షా జర్నీ ఖాతా సైన్ ఇన్ / నమోదు కొరకు మీ ఓటీపీ కోడ్ క్రింద ఇవ్వబడింది.
      <br><br>
      <em>Your verification OTP code for signing in to Deeksha Journey:</em>
    </div>

    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
      <div style="font-size: 12px; color: #8B949E; margin-top: 8px;">(ఈ ఓటీపీ 10 నిమిషాల పాటు పనిచేస్తుంది • Valid for 10 minutes)</div>
    </div>

    <div class="body-text">
      మీరు ఈ అభ్యర్థన చేయకపోతే, దయచేసి ఈ ఈమెయిల్‌ను విస్మరించండి.<br>
      <em>If you did not request this code, please ignore this email.</em>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} DeekshaOrg (India). Compliant with IT Act 2000 & DPDP Act 2023.<br>
      శబరిమల యాత్ర మరియు ఆధ్యాత్మిక నిష్ఠ కోసం మీ డిజిటల్ సహచరుడు.
    </div>
  </div>
</body>
</html>
  `;
}

export function generateWelcomeEmailHtml(name: string, deekshaName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0D1117; color: #E6EDF3; margin: 0; padding: 20px; }
    .card { max-width: 560px; margin: 0 auto; background: #161B22; border: 1px solid #30363D; border-radius: 16px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid #30363D; padding-bottom: 20px; margin-bottom: 24px; }
    .title { color: #F0B429; font-size: 24px; font-weight: bold; margin: 8px 0; }
    .saranam { color: #34d399; font-size: 15px; font-weight: 700; }
    .body-text { font-size: 15px; line-height: 1.7; color: #C9D1D9; margin-bottom: 16px; }
    .feature-list { background: #0D1117; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border: 1px solid #30363D; }
    .feature-item { margin-bottom: 10px; font-size: 14px; color: #8B949E; }
    .footer { text-align: center; font-size: 12px; color: #6E7681; border-top: 1px solid #30363D; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 44px;">🙏</div>
      <div class="title">స్వాగతం, ${name} స్వామి!</div>
      <div class="saranam">మీ ${deekshaName} దీక్ష జర్నీ ప్రారంభమైంది ✨</div>
    </div>

    <div class="body-text">
      దీక్షా జర్నీ కమ్యూనిటీకి హృదయపూర్వక స్వాగతం! మీ మండల వ్రతం మరియు శబరిమల ఆధ్యాత్మిక యాత్ర ప్రతిరోజూ క్రమశిక్షణతో మరియు దైవానుగ్రహంతో సాగాలని కోరుకుంటున్నాము.
    </div>

    <div class="feature-list">
      <div class="feature-item">📌 <strong>ఉదయం/సాయంత్రం చెక్-ఇన్:</strong> నిత్య నియమాలు ఒకే క్లిక్‌తో పూర్తి చేయండి.</div>
      <div class="feature-item">🕉️ <strong>పూజా విధానం:</strong> 108 శరణు ఘోష, హరివరాసనం & యూట్యూబ్ భజన పాటలు.</div>
      <div class="feature-item">👥 <strong>గురు స్వామి సమూహాలు:</strong> మీ గురు స్వామి మరియు గురుకుల సభ్యులతో యాత్ర ఖర్చులు విభజించుకోండి.</div>
    </div>

    <div class="body-text" style="text-align: center; font-weight: bold; color: #F0B429;">
      స్వామియే శరణం అయ్యప్ప! 🕉️
    </div>

    <div class="footer">
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
  return sendEmail({
    to: email,
    subject: `🔑 ${otpCode} — Deeksha Journey Verification Code / ఓటీపీ కోడ్`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string, deekshaName: string = 'అయ్యప్ప (Ayyappa)'): Promise<boolean> {
  const html = generateWelcomeEmailHtml(name, deekshaName);
  return sendEmail({
    to: email,
    subject: `🙏 స్వాగతం ${name} స్వామి — Welcome to Deeksha Journey!`,
    html,
  });
}
