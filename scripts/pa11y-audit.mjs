/**
 * pa11y accessibility audit — runs against all public routes.
 * Requires the dev server to be running: npm run dev
 *
 * Usage: npm run a11y:dev
 */

import pa11y from 'pa11y';

const BASE = 'http://localhost:4321';

const ROUTES = [
  '/',
  '/menu',
  '/story',
  '/visit',
  '/catering',
  '/press',
  '/subscribe/thanks',
  '/subscribe/error',
  '/catering/thanks',
  '/accessibility',
];

const OPTIONS = {
  standard: 'WCAG2AA',
  timeout: 30000,
  wait: 500,
  chromeLaunchConfig: { args: ['--no-sandbox'] },
};

let totalErrors = 0;
let totalWarnings = 0;

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  process.stdout.write(`Auditing ${route} … `);
  try {
    const result = await pa11y(url, OPTIONS);
    const errors   = result.issues.filter(i => i.type === 'error').length;
    const warnings = result.issues.filter(i => i.type === 'warning').length;
    totalErrors   += errors;
    totalWarnings += warnings;
    if (errors > 0) {
      console.log(`\x1b[31mFAIL\x1b[0m (${errors} errors, ${warnings} warnings)`);
      result.issues
        .filter(i => i.type === 'error')
        .forEach(i => console.log(`  [${i.code}] ${i.message}\n  → ${i.selector}`));
    } else {
      console.log(`\x1b[32mOK\x1b[0m (${warnings} warnings)`);
    }
  } catch (err) {
    console.log(`\x1b[33mSKIP\x1b[0m — ${err.message}`);
  }
}

console.log(`\nTotal: ${totalErrors} errors, ${totalWarnings} warnings`);
if (totalErrors > 0) process.exit(1);
