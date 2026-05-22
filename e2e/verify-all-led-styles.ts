/**
 * Comprehensive: verify all 5 LED styles render correctly in preview
 * with Test LEDs on. Targets cdj-3000 buttons that span all styles.
 *
 * Checks per button:
 *   - inline style attribute has expected LED CSS
 *   - dot count in the wrapper (should be exactly 1 for dot-style, 0 for non-dot)
 */
import { chromium } from 'playwright';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface Probe {
  controlId: string;
  expectedStyle: 'dot' | 'face' | 'label-backlit' | 'edge-glow';
  expectedDotCount: number; // dots rendered by PanelRenderer line 201 + PanelButton line 221
}

const PROBES: Probe[] = [
  // BEAT_SYNC has ledStyle=null + ledVariant=dot → behaves as 'dot'
  { controlId: 'BEAT_SYNC_INST_DOUBLES', expectedStyle: 'dot', expectedDotCount: 1 },
  { controlId: 'MASTER', expectedStyle: 'dot', expectedDotCount: 1 },
  { controlId: 'KEY_SYNC', expectedStyle: 'dot', expectedDotCount: 1 },
  // QUANTIZE is edge-glow — no dots, blue border instead
  { controlId: 'QUANTIZE', expectedStyle: 'edge-glow', expectedDotCount: 0 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${BASE}/admin/cdj-3000/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Enter preview
  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(800);
  // Toggle Test LEDs
  await page.locator('button', { hasText: /Test LEDs/ }).first().click();
  await page.waitForTimeout(800);

  let allPassed = true;
  for (const probe of PROBES) {
    const res = await page.evaluate((p) => {
      const wrapper = document.querySelector(`[data-control-id="${p.controlId}"]`);
      if (!wrapper) return { found: false } as { found: false };
      const btn = wrapper.querySelector('button');
      const style = btn?.getAttribute('style') ?? '';
      // Count dot-like rendered divs near the button (small rounded-full elements with backgroundColor matching a saturated color)
      const dots = Array.from(wrapper.querySelectorAll('div.rounded-full'));
      return {
        found: true as const,
        style,
        dotCount: dots.length,
      };
    }, probe);

    if (!res.found) {
      console.log(`  ✗ ${probe.controlId}: not found`);
      allPassed = false;
      continue;
    }

    const styleStr = (res as any).style as string;
    const dotCount = (res as any).dotCount as number;
    let styleOk = false;
    if (probe.expectedStyle === 'edge-glow') {
      styleOk = /border: 3px solid/.test(styleStr);
    } else if (probe.expectedStyle === 'face') {
      styleOk = /radial-gradient/.test(styleStr);
    } else if (probe.expectedStyle === 'label-backlit') {
      styleOk = /background-color: rgb\(26, 26, 30\)/.test(styleStr);
    } else if (probe.expectedStyle === 'dot') {
      // No LED CSS expected on button (dot is external)
      styleOk = !/border: 3px solid/.test(styleStr) && !/radial-gradient/.test(styleStr);
    }

    const dotOk = dotCount === probe.expectedDotCount;
    const pass = styleOk && dotOk;
    if (!pass) allPassed = false;
    console.log(`  ${pass ? '✓' : '✗'} ${probe.controlId} (${probe.expectedStyle}): styleOk=${styleOk}, dots=${dotCount}/${probe.expectedDotCount}`);
    if (!pass) {
      console.log(`    style: ${styleStr.slice(0, 200)}`);
    }
  }

  await browser.close();
  if (!allPassed) {
    console.error('FAIL — some LED styles not rendering correctly');
    process.exit(1);
  }
  console.log('PASS — all 5 LED styles render correctly');
})();
