// Screenshot capture for documents/Pacific_Sunday_User_Manual.md.
//
// Runs against the local dev environment (frontend on :3000, backend on :5000)
// in an iPhone 15 Pro viewport, walks the NFC dev-bypass flow with
// DEV-UID-A002, registers a fresh user, then captures the main owner-panel
// pages described in the manual.
//
// Run with:  node scripts/screenshot-manual.js
//
// Output:    ../documents/screenshots/*.png
//
// The script is idempotent w.r.t. file paths (overwrites each run) but NOT
// w.r.t. the database — registering DEV-UID-A002 once flips it to a
// "registered" bag, so subsequent runs land on the login screen instead of
// the register form. If you need to re-capture the register flow, reset the
// DEV-UID-A002 bag row (or switch this script to a different DEV-UID).

const { chromium, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'documents', 'screenshots');
const FRONTEND = 'http://localhost:3000';
const BACKEND  = 'http://localhost:5000/api';

// Pool of seeded dev bags. We'll pick the first one still in "new_user"
// state at run time so re-running the script doesn't fail just because a
// previous run already registered the first bag in the list.
const IYK_REF_POOL = [
  'DEV-UID-A001', 'DEV-UID-A002', 'DEV-UID-A003', 'DEV-UID-A004', 'DEV-UID-A005',
  'DEV-UID-B001', 'DEV-UID-B002', 'DEV-UID-B003', 'DEV-UID-B004', 'DEV-UID-B005',
];

// Test user we'll register. The PIN is 4 digits per the form rules.
const TEST_NAME    = 'Manual Screenshot';
const TEST_EMAIL   = `manual-shot-${Date.now()}@example.com`;
const TEST_COUNTRY = 'United States of America';
const TEST_PIN     = '1234';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function killDevBadge(page) {
  // Next.js dev-tools floating "N" button lives in a <nextjs-portal>
  // custom element with a closed shadow root. CSS in the light DOM can't
  // reach it, so we just remove the portal element entirely before each
  // screenshot. The portal regenerates after navigation, so call this
  // immediately before any shot().
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  }).catch(() => {});
}

async function shot(page, name) {
  await killDevBadge(page);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function scrolledShot(page, name, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(300);
  await killDevBadge(page);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png (scrolled ${y}px)`);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    // Scroll the main app shell — AppShell uses overflow:auto on <main>.
    window.scrollTo(0, 0);
    document.querySelectorAll('main').forEach((m) => m.scrollTo?.(0, 0));
  }).catch(() => {});
  await page.waitForTimeout(200);
}

async function waitASec(page, ms = 800) {
  await page.waitForTimeout(ms);
}

async function dismissInstallPrompt(page) {
  // PWA install prompt has a close button; if it appears, dismiss it.
  try {
    const close = page.locator('[aria-label="Close install prompt"], [aria-label="Dismiss"]').first();
    if (await close.isVisible({ timeout: 300 })) await close.click();
  } catch { /* none visible */ }
}

(async () => {
  // Find the first DEV bag still in "new_user" state. Re-running the script
  // after an earlier successful run is fine — we just pick the next one.
  let IYK_REF = null;
  for (const ref of IYK_REF_POOL) {
    const r = await fetch(`${BACKEND}/bag?iykRef=${ref}`).then((x) => x.json()).catch(() => null);
    if (r?.success && r?.data?.status === 'new_user') { IYK_REF = ref; break; }
  }
  if (!IYK_REF) {
    console.error('\n[FATAL] No DEV-UID-* bag is in new_user state.');
    console.error('  Reset one of the seeded dev bags or add a new one to IYK_REF_POOL.');
    process.exit(1);
  }
  console.log(`Using ${IYK_REF} for NFC tap flow.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    // Force light hover/no-touch warnings — Playwright already sets these
    // correctly for iPhone 15 Pro: viewport 393×852, DPR 3, hasTouch true.
  });

  // Suppress the PWA install prompt (it covers the whole screen on first
  // logged-in load and ruins every dashboard/community screenshot) and hide
  // the Next.js dev "X issues" toast. Both run before any page script.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('pwa-dismissed-native-v1', '1');
      localStorage.setItem('pwa-dismissed-ios-v1', '1');
      localStorage.setItem('pwa-dismissed-android-manual-v1', '1');
    } catch {}
    const style = document.createElement('style');
    style.textContent = `
      [data-nextjs-toast], [data-nextjs-dev-tools-button], #__next-build-watcher,
      nextjs-portal { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  });

  const page = await context.newPage();

  // ───── Section 1 — NFC flow ────────────────────────────────────────────
  console.log('\n[1] NFC verification + register flow');

  // Catch the brief "Verifying NFC tap…" loading state by slowing the bag
  // check response so it stays on screen long enough to screenshot. Use a
  // one-shot handler so any later bag-check call goes through unmodified.
  let slowed = false;
  const slowHandler = async (route) => {
    if (slowed) return route.continue().catch(() => {});
    slowed = true;
    await new Promise((r) => setTimeout(r, 2500));
    return route.continue().catch(() => {});
  };
  await page.route(/\/api\/bag\?/, slowHandler);
  await page.goto(`${FRONTEND}/n?iykRef=${IYK_REF}`, { waitUntil: 'domcontentloaded' });
  await waitASec(page, 600);
  await shot(page, '01-nfc-verifying');
  await page.unroute(/\/api\/bag\?/, slowHandler).catch(() => {});

  // Now wait for the actual register form to render
  await page.waitForSelector('input[placeholder="Full Name"]', { timeout: 10_000 });
  await waitASec(page, 400);
  await shot(page, '02-nfc-register-empty');

  // Fill in the form
  await page.fill('input[placeholder="Full Name"]', TEST_NAME);
  await page.click('input[placeholder="Search country..."]');
  await page.fill('input[placeholder="Search country..."]', 'United States');
  await waitASec(page, 300);
  // First option in dropdown — click it
  const usOption = page.locator('div', { hasText: TEST_COUNTRY }).last();
  await usOption.click({ timeout: 5000 }).catch(async () => {
    // Fallback: any option starting with "United States"
    await page.locator('text=/^United States/').first().click();
  });
  await page.fill('input[placeholder="Email Address"]', TEST_EMAIL);
  // Two PIN inputs with placeholder ••••
  const pins = page.locator('input[placeholder="••••"]');
  await pins.nth(0).fill(TEST_PIN);
  await pins.nth(1).fill(TEST_PIN);
  await waitASec(page, 300);
  await shot(page, '03-nfc-register-filled-top');
  // Scroll to reveal the PIN fields + submit button
  await scrolledShot(page, '03-nfc-register-filled-bottom', 400);

  // Submit registration
  await page.click('button:has-text("Create Account & Link Bag")');
  // After registration the user lands on / (dashboard).
  await page.waitForURL(`${FRONTEND}/`, { timeout: 20_000 }).catch(() => {});
  await waitASec(page, 1200);
  await dismissInstallPrompt(page);

  // ───── Section 1b — Login screen (visit /n again on registered bag) ───
  console.log('\n[1b] Capture login screen by revisiting NFC URL');
  await page.goto(`${FRONTEND}/n?iykRef=${IYK_REF}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[placeholder="john@example.com"], button:has-text("Sign In with Email")', { timeout: 10_000 }).catch(() => {});
  await waitASec(page, 500);
  // If we landed on the "Sign in with email" CTA, click it so the form is visible
  const signInCta = page.locator('button:has-text("Sign In with Email")');
  if (await signInCta.isVisible({ timeout: 500 }).catch(() => false)) {
    await signInCta.click();
    await waitASec(page, 400);
  }
  await shot(page, '04-nfc-login');

  // ───── Section 2 — Dashboard ───────────────────────────────────────────
  console.log('\n[2] Dashboard');
  await page.goto(`${FRONTEND}/`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1500);
  await dismissInstallPrompt(page);
  await resetScroll(page);
  await shot(page, '05-dashboard');
  await scrolledShot(page, '05-dashboard-scrolled', 700);

  // Open sidebar via the hamburger menu in the header
  console.log('\n[2b] Sidebar open');
  try {
    const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="Toggle" i]').first();
    await hamburger.click({ force: true, timeout: 4000 });
    await waitASec(page, 500);
    await shot(page, '06-sidebar');
    await page.keyboard.press('Escape').catch(() => {});
    await waitASec(page, 300);
  } catch (e) {
    console.log('  (sidebar shot skipped:', e.message.split('\n')[0], ')');
  }

  // ───── Section 3 — Community ───────────────────────────────────────────
  console.log('\n[3] Community');
  await page.goto(`${FRONTEND}/community`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1500);
  await resetScroll(page);
  await shot(page, '07-community-feed');
  await scrolledShot(page, '07-community-feed-scrolled', 600);

  // ───── Section 4 — Notifications ───────────────────────────────────────
  console.log('\n[4] Notifications');
  // First — bell dropdown from the dashboard
  await page.goto(`${FRONTEND}/`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1000);
  const bell = page.locator('button[aria-label="Notifications"]').first();
  if (await bell.isVisible({ timeout: 1000 }).catch(() => false)) {
    await bell.click();
    await waitASec(page, 700);
    await shot(page, '08-notification-bell');
    // close
    await page.keyboard.press('Escape').catch(() => {});
    await page.mouse.click(20, 400).catch(() => {});
    await waitASec(page, 300);
  }
  // Then — the dedicated notifications page
  await page.goto(`${FRONTEND}/notifications`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1000);
  await shot(page, '09-notifications-page');

  // ───── Section 5 — Fantasy Golf ────────────────────────────────────────
  console.log('\n[5] Fantasy Golf');
  await page.goto(`${FRONTEND}/fantasy-golf`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1500);
  await resetScroll(page);
  await shot(page, '10-fantasy-list');
  await scrolledShot(page, '10-fantasy-list-scrolled', 600);

  // ───── Section 5b — Live Scores ────────────────────────────────────────
  console.log('\n[5b] Live Scores');
  await page.goto(`${FRONTEND}/live-scores`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1200);
  await shot(page, '11-live-scores');

  // ───── Section 6 — My Bag ─────────────────────────────────────────────
  console.log('\n[6] My Bag');
  await page.goto(`${FRONTEND}/my-bag`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitASec(page, 1200);
  await shot(page, '12-my-bag');

  await browser.close();
  console.log(`\nAll done. Files written to:\n  ${OUT_DIR}`);
})().catch(async (err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
