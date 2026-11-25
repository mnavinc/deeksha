import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAboutUsEmailHtml,
  generateNewsletterEmailHtml,
  generateOtpEmailHtml,
  generateWelcomeEmailHtml,
} from '../src/emailService.js';
import { buildApp } from '../src/app.js';

describe('Resend Email Templates & Passkey/OAuth Routes', () => {
  it('renders HTML-escaped Welcome, About Us, Newsletter, and OTP email templates', () => {
    const welcome = generateWelcomeEmailHtml('<script>Swami</script>', 'Ayyappa');
    assert.ok(!welcome.includes('<script>Swami</script>'));
    assert.ok(welcome.includes('&lt;script&gt;Swami&lt;/script&gt;'));
    assert.ok(welcome.includes('Swamiseva'));

    const aboutUs = generateAboutUsEmailHtml('Ramesh Swamy');
    assert.ok(aboutUs.includes('Our Sacred Mission'));
    assert.ok(aboutUs.includes('Ramesh Swamy'));

    const newsletter = generateNewsletterEmailHtml({
      recipientName: 'Ramesh Swamy',
      editionTitle: 'Mandala 2026',
      introText: 'Stay disciplined in your 41-day vrutham.',
      highlights: ['108 Japamala', 'Passkey Security'],
    });
    assert.ok(newsletter.includes('Mandala 2026'));
    assert.ok(newsletter.includes('108 Japamala'));

    const otp = generateOtpEmailHtml('654321', 'Ramesh');
    assert.ok(otp.includes('654321'));
  });

  it('serves Resend email templates preview via GET /v1/emails/templates', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/emails/templates',
      });
      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.provider, 'resend');
      assert.equal(body.templates.length, 4);
      assert.deepEqual(
        body.templates.map((t: { id: string }) => t.id),
        ['welcome', 'about_us', 'newsletter', 'otp']
      );
    } finally {
      await app.close();
    }
  });

  it('requires authentication on POST /v1/emails/about-us and /v1/emails/newsletter', async () => {
    const app = await buildApp();
    try {
      const res1 = await app.inject({
        method: 'POST',
        url: '/v1/emails/about-us',
        payload: { to: 'swami@example.com' },
      });
      assert.equal(res1.statusCode, 401);

      const res2 = await app.inject({
        method: 'POST',
        url: '/v1/emails/newsletter',
        payload: {
          to: 'swami@example.com',
          editionTitle: 'Test',
          introText: 'Hello Swamis, here is the update.',
        },
      });
      assert.equal(res2.statusCode, 401);
    } finally {
      await app.close();
    }
  });
});
