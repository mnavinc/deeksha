/**
 * emailService.ts — Sends bilingual (Telugu + English) transactional & newsletter emails
 * via Resend (primary) with Nodemailer SMTP fallback and dev console mock.
 */
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from './config.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  sent: boolean;
  provider: 'resend' | 'smtp' | 'console_fallback';
  messageId?: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

// Create Nodemailer transport based on environment variables
export function createSmtpTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: env.NODE_ENV === 'production',
    },
  });
}

export async function sendEmailDetailed(options: EmailOptions): Promise<EmailSendResult> {
  try {
    const resend = getResendClient();
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error(`[EmailService RESEND ERROR] Failed to send to ${options.to}:`, error);
      } else {
        console.log(`[EmailService RESEND] Dispatched to ${options.to}. Id: ${data?.id}`);
        return { sent: true, provider: 'resend', messageId: data?.id };
      }
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`[EmailService SMTP] Dispatched to ${options.to}. MessageId: ${info.messageId}`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    }

    console.log(`[EmailService DEV MOCK] To: ${options.to} | Subject: ${options.subject}`);
    return { sent: true, provider: 'console_fallback' };
  } catch (error) {
    console.error(`[EmailService ERROR] Failed to send email to ${options.to}:`, error);
    return { sent: false, provider: env.RESEND_API_KEY ? 'resend' : 'smtp' };
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const result = await sendEmailDetailed(options);
  return result.sent;
}

function wrapEmailLayout(title: string, badge: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-top: 5px solid #D97706; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">🛕</div>
      <div style="color: #B45309; font-size: 22px; font-weight: 800; letter-spacing: 0.4px; margin: 4px 0;">Swamiseva • దీక్షా జర్నీ</div>
      <div style="color: #15803D; font-size: 13px; font-weight: 700;">${escapeHtml(badge)}</div>
    </div>
    ${bodyHtml}
    <div style="text-align: center; font-size: 12px; line-height: 1.5; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 18px; margin-top: 24px;">
      © ${new Date().getFullYear()} DeekshaOrg (India). All rights reserved.<br>
      శబరిమల యాత్ర మరియు మండల వ్రత నిష్ఠ కోసం మీ ఆధ్యాత్మిక సహచరుడు.<br>
      <span style="color: #6B7280;">Compliant with IT Act 2000 &amp; DPDP Act 2023 · <a href="https://deeksha-sigma.vercel.app/privacy" style="color: #B45309; text-decoration: none;">Privacy Policy</a> · <a href="https://deeksha-sigma.vercel.app/terms" style="color: #B45309; text-decoration: none;">Terms</a></span>
    </div>
  </div>
</body>
</html>`;
}

export function generateOtpEmailHtml(otpCode: string, name?: string): string {
  const recipientName = escapeHtml(name ?? 'స్వామి (Swami)');
  const safeOtp = escapeHtml(otpCode);
  return wrapEmailLayout(
    'Deeksha Journey Verification Code',
    'స్వామియే శరణం అయ్యప్ప • Swamiye Saranam Ayyappa',
    `
    <div style="font-size: 15px; line-height: 1.65; color: #374151; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0;"><strong style="color: #111827; font-size: 16px;">నమస్కారం ${recipientName},</strong></p>
      <p style="margin: 0 0 8px 0; color: #4B5563;">మీ దీక్షా జర్నీ ఖాతా సైన్ ఇన్ / నమోదు కొరకు మీ వెరిఫికేషన్ ఓటీపీ కోడ్ క్రింద ఇవ్వబడింది:</p>
      <p style="margin: 0; color: #6B7280; font-size: 14px; font-style: italic;">Use the verification OTP code below to complete your sign-in to Swamiseva:</p>
    </div>
    <div style="background-color: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Verification Code / ఓటీపీ కోడ్</div>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #B45309; font-family: monospace, Courier, sans-serif;">${safeOtp}</div>
      <div style="font-size: 12px; color: #78350F; margin-top: 8px; font-weight: 600;">⏱️ Valid for 10 minutes • 10 నిమిషాలు మాత్రమే చెల్లుబాటు అవుతుంది</div>
    </div>
    <div style="font-size: 13px; line-height: 1.5; color: #6B7280; margin: 20px 0 24px 0; background: #F9FAFB; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #9CA3AF;">
      🔒 <strong>Security Tip:</strong> Never share this OTP with anyone. Consider adding a Passkey for instant phishing-resistant biometric login.
    </div>`
  );
}

export function generateWelcomeEmailHtml(name: string, deekshaName: string = 'అయ్యప్ప (Ayyappa)'): string {
  const safeName = escapeHtml(name || 'Swami');
  const safeDeeksha = escapeHtml(deekshaName);
  return wrapEmailLayout(
    'Welcome to Swamiseva — Deeksha Journey',
    'స్వామియే శరణం అయ్యప్ప • Welcome to Swamiseva',
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="color: #B45309; font-size: 23px; font-weight: 800; margin: 4px 0;">స్వాగతం, ${safeName} స్వామి!</div>
      <div style="color: #15803D; font-size: 14px; font-weight: 700;">మీ ${safeDeeksha} దీక్ష జర్నీ ప్రారంభమైంది ✨</div>
    </div>
    <div style="font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 20px;">
      దీక్షా జర్నీ కమ్యూనిటీకి హృదయపూర్వక స్వాగతం! Welcome to Swamiseva — your dedicated companion for disciplined Mandala Vrutham, daily Pooja Vidhanam, and Sabarimala Yatra coordination.
    </div>
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">🌟 యాప్ ముఖ్య అంశాలు (Key Features):</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563; margin-bottom: 8px;">📌 <strong>నిత్య చెక్-ఇన్ &amp; జపమాల:</strong> Track your 41-day vrutham, 108-bead Japamala, and sunrise/sunset niyamas.</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563; margin-bottom: 8px;">🕉️ <strong>పూజా విధానం:</strong> 108 Saranu Gosha, Harivarasanam, and temple timings.</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563; margin-bottom: 8px;">👥 <strong>సన్నిధానం QR గుంపులు:</strong> Join your Guru Swamy group, share yatra locations, and split expenses fairly.</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #4B5563;">🔐 <strong>Passkey &amp; Social Security:</strong> Passwordless biometric Passkeys synced via Apple/Google cloud.</div>
    </div>
    <div style="text-align: center; margin: 24px 0 8px 0;">
      <a href="https://deeksha-sigma.vercel.app" style="display: inline-block; background: #D97706; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">Open Swamiseva Journey 🙏</a>
    </div>`
  );
}

export function generateAboutUsEmailHtml(recipientName: string = 'Swami'): string {
  const safeName = escapeHtml(recipientName);
  return wrapEmailLayout(
    'About Swamiseva — Sincere Pathway',
    'ABOUT US · SWAMISEVA · DEEKSHAORG',
    `
    <div style="font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 18px;">
      <p style="margin: 0 0 10px 0;"><strong>నమస్కారం ${safeName},</strong></p>
      <p style="margin: 0 0 12px 0;">
        <strong>Swamiseva (Deeksha Journey)</strong> is built by DeekshaOrg to help Ayyappa, Bhavani, Govinda, Shiva, and Hanuman devotees observe their sacred Vrutham with clarity, devotion, and community support.
      </p>
    </div>
    <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 18px; margin: 18px 0;">
      <div style="font-size: 14px; font-weight: 800; color: #92400E; margin-bottom: 8px;">🪔 Our Sacred Mission</div>
      <ul style="margin: 0; padding-left: 18px; color: #4B5563; font-size: 13.5px; line-height: 1.7;">
        <li><strong>Authentic Guidance:</strong> Bilingual (Telugu &amp; English) Pooja Vidhanam, Kanni Swamy rules, and 15-stage Yatra trail.</li>
        <li><strong>Sannidhanam Unity:</strong> Instant QR-based group onboarding with transparent expense splitting and Annadanam tracking.</li>
        <li><strong>Privacy First:</strong> Zero spam, DPDP Act 2023 compliant, and modern Passkey + OAuth security.</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 22px 0 6px 0;">
      <a href="https://deeksha-sigma.vercel.app/about" style="display: inline-block; background: #15803D; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">Explore Swamiseva</a>
    </div>`
  );
}

export interface NewsletterTemplateInput {
  recipientName?: string;
  editionTitle: string;
  seasonBadge?: string;
  introText: string;
  highlights: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export function generateNewsletterEmailHtml(input: NewsletterTemplateInput): string {
  const safeName = escapeHtml(input.recipientName ?? 'Swami');
  const safeTitle = escapeHtml(input.editionTitle);
  const safeBadge = escapeHtml(input.seasonBadge ?? 'MANDALA-MAKARAVILAKKU NEWSLETTER');
  const safeIntro = escapeHtml(input.introText);
  const safeCtaLabel = escapeHtml(input.ctaLabel ?? 'Open App & Check In');
  const safeCtaUrl = escapeHtml(input.ctaUrl ?? 'https://deeksha-sigma.vercel.app');

  const highlightsHtml = input.highlights
    .map(
      (item) =>
        `<li style="margin-bottom: 8px; color: #374151; font-size: 14px; line-height: 1.6;">✨ ${escapeHtml(item)}</li>`
    )
    .join('');

  return wrapEmailLayout(
    input.editionTitle,
    safeBadge,
    `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 8px;">${safeTitle}</div>
      <div style="font-size: 14px; color: #4B5563; line-height: 1.65;">నమస్కారం ${safeName},<br><br>${safeIntro}</div>
    </div>
    ${
      highlightsHtml
        ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
             <div style="font-size: 13px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">This Edition Highlights</div>
             <ul style="margin: 0; padding-left: 18px;">${highlightsHtml}</ul>
           </div>`
        : ''
    }
    <div style="text-align: center; margin: 22px 0 8px 0;">
      <a href="${safeCtaUrl}" style="display: inline-block; background: #D97706; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">${safeCtaLabel}</a>
    </div>`
  );
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

export async function sendWelcomeEmail(
  email: string,
  name: string,
  deekshaName: string = 'అయ్యప్ప (Ayyappa)'
): Promise<EmailSendResult> {
  const html = generateWelcomeEmailHtml(name, deekshaName);
  const text = `స్వాగతం ${name} స్వామి!\n\nమీ ${deekshaName} దీక్ష జర్నీ ప్రారంభమైంది.\n\nస్వామియే శరణం అయ్యప్ప!`;
  return sendEmailDetailed({
    to: email,
    subject: `🙏 స్వాగతం ${name} స్వామి — Welcome to Swamiseva!`,
    text,
    html,
  });
}

export async function sendAboutUsEmail(
  email: string,
  recipientName?: string
): Promise<EmailSendResult> {
  const html = generateAboutUsEmailHtml(recipientName);
  const text = `Swamiye Saranam Ayyappa!\n\nSwamiseva (Deeksha Journey) is your bilingual spiritual companion for Mandala Vrutham, Pooja Vidhanam, and Sannidhanam group yatra coordination.\n\nVisit: https://deeksha-sigma.vercel.app/about`;
  return sendEmailDetailed({
    to: email,
    subject: '🛕 About Swamiseva — Your Sacred Deeksha & Yatra Companion',
    text,
    html,
  });
}

export async function sendNewsletterEmail(
  email: string,
  input: NewsletterTemplateInput
): Promise<EmailSendResult> {
  const html = generateNewsletterEmailHtml(input);
  const text = `${input.editionTitle}\n\n${input.introText}\n\nHighlights:\n${input.highlights.map((h) => `- ${h}`).join('\n')}\n\nSwamiye Saranam Ayyappa!`;
  return sendEmailDetailed({
    to: email,
    subject: `🪔 ${input.editionTitle} — Swamiseva Newsletter`,
    text,
    html,
  });
}
