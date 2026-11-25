import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  generateAboutUsEmailHtml,
  generateNewsletterEmailHtml,
  generateOtpEmailHtml,
  generateWelcomeEmailHtml,
  sendAboutUsEmail,
  sendNewsletterEmail,
  sendWelcomeEmail,
} from '../emailService.js';

const sendAboutUsSchema = z.object({
  to: z.string().trim().email().toLowerCase(),
  recipientName: z.string().trim().max(100).optional(),
});

const sendWelcomeSchema = z.object({
  to: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(1).max(100),
  deekshaName: z.string().trim().max(80).optional(),
});

const sendNewsletterSchema = z.object({
  to: z.string().trim().email().toLowerCase(),
  recipientName: z.string().trim().max(100).optional(),
  editionTitle: z.string().trim().min(3).max(140),
  seasonBadge: z.string().trim().max(80).optional(),
  introText: z.string().trim().min(10).max(2000),
  highlights: z.array(z.string().trim().min(2).max(240)).max(10).default([]),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaUrl: z.string().url().optional(),
});

export const emailRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/emails/templates — Returns Resend-ready HTML template previews
   */
  app.get('/v1/emails/templates', async () => {
    return {
      provider: 'resend',
      templates: [
        {
          id: 'welcome',
          name: 'Welcome Email',
          subject: '🙏 స్వాగతం Swami — Welcome to Swamiseva!',
          html: generateWelcomeEmailHtml('Ramesh Swamy', 'Ayyappa'),
        },
        {
          id: 'about_us',
          name: 'About Us Email',
          subject: '🛕 About Swamiseva — Your Sacred Deeksha & Yatra Companion',
          html: generateAboutUsEmailHtml('Ramesh Swamy'),
        },
        {
          id: 'newsletter',
          name: 'Mandala-Makaravilakku Newsletter',
          subject: '🪔 Mandala Season Update — Swamiseva Newsletter',
          html: generateNewsletterEmailHtml({
            recipientName: 'Ramesh Swamy',
            editionTitle: 'Mandala Season Guidelines & Virtual-Q Reminder',
            seasonBadge: 'MANDALA-MAKARAVILAKKU 2026',
            introText:
              'Here are your timely Sabarimala pilgrimage updates, daily sunrise/sunset vrutham alerts, and Sannidhanam group checklists.',
            highlights: [
              'Daily 108-bead Japamala and Pooja Vidhanam reminders',
              'Instant QR Sannidhanam invite & fair group expense splitting',
              'Passwordless Passkey security synced with Apple & Google',
            ],
          }),
        },
        {
          id: 'otp',
          name: 'Verification OTP Email',
          subject: '🔑 Verification Code / ఓటీపీ కోడ్',
          html: generateOtpEmailHtml('123456', 'Ramesh Swamy'),
        },
      ],
    };
  });

  /**
   * POST /v1/emails/about-us — Send the About Us email via Resend
   */
  app.post(
    '/v1/emails/about-us',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (request, reply) => {
      const { to, recipientName } = sendAboutUsSchema.parse(request.body);
      const result = await sendAboutUsEmail(to, recipientName);
      return reply.status(result.sent ? 200 : 502).send({ ok: result.sent, ...result });
    }
  );

  /**
   * POST /v1/emails/welcome — Send the Welcome email via Resend
   */
  app.post(
    '/v1/emails/welcome',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (request, reply) => {
      const { to, name, deekshaName } = sendWelcomeSchema.parse(request.body);
      const result = await sendWelcomeEmail(to, name, deekshaName);
      return reply.status(result.sent ? 200 : 502).send({ ok: result.sent, ...result });
    }
  );

  /**
   * POST /v1/emails/newsletter — Send a Newsletter email via Resend
   */
  app.post(
    '/v1/emails/newsletter',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (request, reply) => {
      const body = sendNewsletterSchema.parse(request.body);
      const result = await sendNewsletterEmail(body.to, {
        recipientName: body.recipientName,
        editionTitle: body.editionTitle,
        seasonBadge: body.seasonBadge,
        introText: body.introText,
        highlights: body.highlights,
        ctaLabel: body.ctaLabel,
        ctaUrl: body.ctaUrl,
      });
      return reply.status(result.sent ? 200 : 502).send({ ok: result.sent, ...result });
    }
  );
};
