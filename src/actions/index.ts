import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

// ── Rate limiting (in-memory; upgrade to Cloudflare KV for multi-isolate prod) ──
const rateMap = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000;

function checkRateLimit(ip: string): void {
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < RATE_LIMIT_MS) {
    throw new ActionError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Please wait a few minutes before submitting another request.',
    });
  }
  rateMap.set(ip, now);
  // Evict stale entries to prevent unbounded growth
  if (rateMap.size > 500) {
    const cutoff = now - RATE_LIMIT_MS;
    for (const [k, v] of rateMap) if (v < cutoff) rateMap.delete(k);
  }
}

// ── Email helpers ────────────────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  boxed: 'Box lunches',
  platters: 'Party platters',
  custom: 'Custom event',
};
const FULFILLMENT_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Drop-off / Delivery',
};

function ownerHtml(d: {
  name: string; company?: string; email: string; phone: string;
  eventDate: string; headcount: number; serviceStyle: string;
  fulfillment: string; fulfillmentTime: string; dietary?: string; notes?: string;
}): string {
  const rows = [
    ['Name',           d.name],
    ['Company',        d.company || '—'],
    ['Email',          `<a href="mailto:${d.email}">${d.email}</a>`],
    ['Phone',          `<a href="tel:${d.phone.replace(/\D/g,'')}">${d.phone}</a>`],
    ['Event date',     d.eventDate],
    ['Headcount',      String(d.headcount)],
    ['Service style',  SERVICE_LABELS[d.serviceStyle] ?? d.serviceStyle],
    ['Fulfillment',    FULFILLMENT_LABELS[d.fulfillment] ?? d.fulfillment],
    ['Time',           d.fulfillmentTime],
    ['Dietary notes',  d.dietary || '—'],
    ['Additional info',d.notes || '—'],
  ];

  const tableRows = rows
    .map(([label, value]) => `<tr>
      <td style="padding:6px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#354730;">${label}</td>
      <td style="padding:6px 12px;color:#111210;">${value}</td>
    </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Catering inquiry</title></head>
<body style="font-family:Georgia,serif;background:#f8f6f1;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e1e9d5;padding:32px;">
    <h1 style="font-size:22px;margin:0 0 8px;color:#111210;">New catering inquiry</h1>
    <p style="margin:0 0 24px;color:#567049;font-size:14px;">Submitted via panfayetteville.com</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e1e9d5;">
      <tbody>${tableRows}</tbody>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#3d4039;">
      Reply directly to this email to reach ${d.name}.
    </p>
  </div>
</body>
</html>`;
}

function ownerText(d: Parameters<typeof ownerHtml>[0]): string {
  return [
    'New catering inquiry — panfayetteville.com',
    '',
    `Name:           ${d.name}`,
    `Company:        ${d.company || '—'}`,
    `Email:          ${d.email}`,
    `Phone:          ${d.phone}`,
    `Event date:     ${d.eventDate}`,
    `Headcount:      ${d.headcount}`,
    `Service style:  ${SERVICE_LABELS[d.serviceStyle] ?? d.serviceStyle}`,
    `Fulfillment:    ${FULFILLMENT_LABELS[d.fulfillment] ?? d.fulfillment}`,
    `Time:           ${d.fulfillmentTime}`,
    `Dietary notes:  ${d.dietary || '—'}`,
    `Additional:     ${d.notes || '—'}`,
  ].join('\n');
}

function confirmationHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Catering request received</title></head>
<body style="font-family:Georgia,serif;background:#f8f6f1;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e1e9d5;padding:32px;">
    <h1 style="font-size:22px;margin:0 0 16px;color:#111210;">We got your request, ${name}.</h1>
    <p style="color:#3d4039;line-height:1.6;">
      We'll review your catering inquiry and reply within 1 business day.
      If you need something sooner, call us directly at
      <a href="tel:+19104913105" style="color:#567049;">(910) 491-3105</a>.
    </p>
    <p style="margin-top:24px;color:#3d4039;line-height:1.6;">
      — The PAN team<br>
      <span style="color:#567049;">105 Hay St · Downtown Fayetteville</span>
    </p>
  </div>
</body>
</html>`;
}

// ── Schema ───────────────────────────────────────────────────────────────────
const cateringSchema = z.object({
  name:            z.string().min(1, 'Name is required'),
  company:         z.string().optional(),
  email:           z.string().email('A valid email address is required'),
  phone:           z.string().min(7, 'Phone number is required'),
  eventDate:       z.string().min(1, 'Event date is required'),
  headcount:       z.coerce.number().int().min(1, 'Headcount must be at least 1'),
  serviceStyle:    z.enum(['boxed', 'platters', 'custom'], {
    error: 'Please select a service style',
  }),
  fulfillment:     z.enum(['pickup', 'delivery'], {
    error: 'Please select pickup or delivery',
  }),
  fulfillmentTime: z.string().min(1, 'Pickup or delivery time is required'),
  dietary:         z.string().optional(),
  notes:           z.string().optional(),
  website:         z.string().max(0), // honeypot — silently reject if non-empty
});

// ── Action ───────────────────────────────────────────────────────────────────
export const server = {
  catering: defineAction({
    accept: 'form',
    input: cateringSchema,
    handler: async (input, context) => {
      // Honeypot: filled = bot. Return success so the bot thinks it worked.
      if (input.website) {
        return { success: true };
      }

      // Rate limit by IP
      const ip =
        context.request.headers.get('CF-Connecting-IP') ??
        context.request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ??
        'unknown';
      checkRateLimit(ip);

      // Send emails
      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        // Development: skip email, still succeed
        console.warn('[catering] RESEND_API_KEY not set — email skipped');
        return { success: true };
      }

      const resend = new Resend(apiKey);

      await Promise.all([
        resend.emails.send({
          from: 'PAN Catering Form <form@panfayetteville.com>',
          to: import.meta.env.OWNER_EMAIL ?? 'pan@graybillhospitality.com',
          replyTo: input.email,
          subject: `Catering inquiry — ${input.name}${input.company ? ` (${input.company})` : ''}, ${input.headcount} guests, ${input.eventDate}`,
          html: ownerHtml(input),
          text: ownerText(input),
        }),
        resend.emails.send({
          from: 'PAN Restaurant <hello@panfayetteville.com>',
          to: input.email,
          subject: 'We got your catering request — PAN Restaurant',
          html: confirmationHtml(input.name),
          text: `Hi ${input.name},\n\nThanks for reaching out about catering at PAN. We'll review your request and reply within 1 business day.\n\nIf you need something sooner, call us at (910) 491-3105.\n\n— The PAN team\n105 Hay St · Downtown Fayetteville, NC`,
        }),
      ]);

      return { success: true };
    },
  }),
};
