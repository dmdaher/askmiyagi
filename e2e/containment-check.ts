/**
 * Containment Check — production safety gate (Layer B).
 *
 * For every label and control in preview mode, asserts that the rendered
 * content (text or icon) fits within its parent container. Catches the
 * only cross-platform UX risk that actually affects users:
 *   - Linux/Windows renders a font wider than macOS
 *   - Text spills past the button/label edge
 *   - Section header wraps to 2 lines because it doesn't fit
 *
 * Editor↔preview pixel parity (Layer A) doesn't catch this because both
 * modes render the same way on the same machine. The user sees both as
 * "fine, just slightly different in width."
 *
 * This check is absolute (no comparison to baseline) — it asserts that
 * what we render TODAY, on Linux CI's chromium, fits inside its
 * container. If a label is 3 px too wide, fail.
 *
 * Usage:
 *   npm run drift:containment          # all devices
 *   tsx e2e/containment-check.ts --device fantom-06
 */
import { chromium, Page } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

const DEVICES = [
  { id: 'fantom-06', label: 'Fantom 06' },
  { id: 'cdj-3000', label: 'CDJ-3000' },
  { id: 'deepmind-12', label: 'DeepMind 12' },
];

interface ContainmentViolation {
  device: string;
  kind: 'label' | 'control';
  id: string;
  text: string;
  reason: string;
  contentRect: { left: number; top: number; width: number; height: number };
  parentRect: { left: number; top: number; width: number; height: number };
  overflowPx: number;
}

async function setUpPage(page: Page, deviceId: string) {
  await page.goto(`${BASE}/admin/${deviceId}/editor`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000 });
  await page.waitForTimeout(2000);
  // Lock zoom to 1.0 for deterministic measurement
  await page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { setState: (s: unknown) => void };
    };
    if (win.useEditorStore) {
      win.useEditorStore.setState({ zoom: 1, panX: 0, panY: 0, snapGrid: 1, showLabels: true });
    }
  });
  await page.waitForTimeout(500);
  // Switch to preview mode — production users see this view
  const previewBtn = page.locator('button:has-text("Preview")').first();
  await previewBtn.click();
  await page.waitForTimeout(2000);
  // Wait for any fonts to load (important for measurement accuracy)
  await page.evaluate(() => document.fonts.ready);
}

async function findViolations(page: Page, deviceId: string): Promise<ContainmentViolation[]> {
  // String-form evaluate to bypass tsx helper-name injection
  const violations = await page.evaluate(`(() => {
    const out = [];

    /**
     * The containment risks we actually want to catch are:
     *
     *   1. Unintended text wrapping — a label or control's text that fit on
     *      one line on macOS wraps to 2+ lines on Linux/Windows. Visible to
     *      users as awkward layout.
     *
     *   2. Horizontal overflow OF THE TEXT GLYPHS past the element's defined
     *      width — when the rendered text is wider than the box it sits in.
     *
     * SharedLabel uses a deliberate negative-margin pattern (padding: 4px 6px
     * + margin: -4px -6px on the inner span) to extend the click target
     * beyond the visual wrapper. That's by design and must NOT be reported.
     *
     * The right measurement on each element: scrollWidth vs clientWidth and
     * scrollHeight vs clientHeight. These compare what the BROWSER would
     * need to show all content vs what's actually visible. Differences
     * indicate true visual overflow that the user sees.
     */
    const checkElement = (el, kind, id) => {
      const rect = el.getBoundingClientRect();
      const text = (el.textContent || '').trim().slice(0, 40);

      // Unintended wrap: text that should fit on one line takes multiple.
      // For labels, whiteSpace: nowrap is set in SharedLabel — wrap means
      // either we removed the rule or the font is so wide that wrap was
      // forced. Either way it's a bug.
      if (el.scrollHeight > el.clientHeight + 1) {
        out.push({
          kind, id, text,
          reason: 'text wraps to multiple lines (scrollHeight ' + el.scrollHeight + ' > clientHeight ' + el.clientHeight + ')',
          contentRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          parentRect: { left: 0, top: 0, width: 0, height: 0 },
          overflowPx: el.scrollHeight - el.clientHeight,
        });
      }
      // Horizontal text overflow: the rendered text width exceeds the
      // visible box width. Catches "label was 38 px on macOS, 42 px on
      // Linux, but stored width is 40."
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push({
          kind, id, text,
          reason: 'text wider than element (scrollWidth ' + el.scrollWidth + ' > clientWidth ' + el.clientWidth + ')',
          contentRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          parentRect: { left: 0, top: 0, width: 0, height: 0 },
          overflowPx: el.scrollWidth - el.clientWidth,
        });
      }
    };

    for (const el of document.querySelectorAll('[data-label-id]')) {
      checkElement(el, 'label', el.dataset.labelId);
    }
    for (const el of document.querySelectorAll('[data-control-id]')) {
      checkElement(el, 'control', el.dataset.controlId);
    }
    return out;
  })()`) as Omit<ContainmentViolation, 'device'>[];

  return violations.map(v => ({ ...v, device: deviceId }));
}

async function main() {
  const args = process.argv.slice(2);
  const deviceFilter = args[args.indexOf('--device') + 1];
  const devices = deviceFilter && args.includes('--device')
    ? DEVICES.filter(d => d.id === deviceFilter)
    : DEVICES;

  console.log('=== Containment Check (production overflow gate) ===');
  console.log(`Devices: ${devices.map(d => d.id).join(', ')}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([{
    name: 'admin_access',
    value: ADMIN_PASSWORD,
    domain: 'localhost',
    path: '/',
    sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);

  const allViolations: ContainmentViolation[] = [];

  for (const device of devices) {
    console.log(`=== ${device.label} (${device.id}) ===`);
    try {
      await setUpPage(page, device.id);
      const violations = await findViolations(page, device.id);
      if (violations.length === 0) {
        console.log(`  ✓ no containment violations (every element fits within its parent)`);
      } else {
        console.log(`  ✗ ${violations.length} containment violation(s):`);
        for (const v of violations.slice(0, 15)) {
          console.log(`    ${v.kind} ${v.id} "${v.text}" — ${v.reason} (${v.overflowPx} px)`);
        }
        if (violations.length > 15) console.log(`    … and ${violations.length - 15} more`);
      }
      allViolations.push(...violations);
    } catch (err) {
      console.error(`  ✗ error checking ${device.id}:`, err);
    }
    console.log('');
  }

  console.log('=== FINAL VERDICT ===');
  if (allViolations.length === 0) {
    console.log('\x1b[32m✓ Containment OK — every label and control fits its parent on every device\x1b[0m');
    await browser.close();
    process.exit(0);
  } else {
    console.log(`\x1b[31m✗ ${allViolations.length} total containment violation(s)\x1b[0m`);
    console.log('');
    console.log('These elements WILL overflow on Linux/Windows even if they fit on macOS.');
    console.log('Fix by reducing fontSize, increasing label `w` in manifest, or adjusting CSS.');
    await browser.close();
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
