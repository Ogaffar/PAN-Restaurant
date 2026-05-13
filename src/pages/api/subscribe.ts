export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro:schema';
import { Resend } from 'resend';

// ── Rate limit (in-memory; 1 per IP per minute) ──────────────────────────────
const rateMap = new Map<string, number>();
const RATE_MS = 60_000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < RATE_MS) return false;
  rateMap.set(ip, now);
  if (rateMap.size > 1000) {
    const cut = now - RATE_MS;
    for (const [k, v] of rateMap) if (v < cut) rateMap.delete(k);
  }
  return true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const emailSchema = z.string().email();

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

// ── Endpoint ──────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const ct = request.headers.get('content-type') ?? '';
  const isJson = ct.includes('application/json');

  // Parse body
  let email = '';
  let website = '';

  if (isJson) {
    try {
      const body = await request.json() as Record<string, unknown>;
      email = String(body.email ?? '');
      website = String(body.website ?? '');
    } catch {
      return json({ ok: false, error: 'Invalid request body.' }, 400);
    }
  } else {
    const fd = await request.formData();
    email = String(fd.get('email') ?? '');
    website = String(fd.get('website') ?? '');
  }

  // Honeypot: bot filled the hidden field — silent success
  if (website) {
    return isJson ? json({ ok: true }) : redirect('/subscribe/thanks');
  }

  // Validate email
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return isJson
      ? json({ ok: false, error: 'Please enter a valid email address.' }, 400)
      : redirect('/subscribe/thanks?invalid=1');
  }

  // Rate limit
  const ip =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ??
    'unknown';

  if (!checkRate(ip)) {
    return isJson
      ? json({ ok: false, error: 'Please wait a moment before subscribing again.' }, 429)
      : redirect('/subscribe/thanks'); // silent — don't reveal rate limit
  }

  // Add to Resend audience
  const apiKey = import.meta.env.RESEND_API_KEY;
  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    // Dev mode: skip Resend, still succeed so the UI is testable
    console.warn('[subscribe] RESEND_API_KEY or RESEND_AUDIENCE_ID not set — skipping');
    return isJson ? json({ ok: true }) : redirect('/subscribe/thanks');
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: parsed.data,
      unsubscribed: false,
      audienceId,
    });
  } catch (err) {
    console.error('[subscribe] Resend error:', err);
    return isJson
      ? json({ ok: false, error: 'We couldn\'t save your email. Please try again.' }, 500)
      : redirect('/subscribe/error');
  }

  return isJson ? json({ ok: true }) : redirect('/subscribe/thanks');
};
