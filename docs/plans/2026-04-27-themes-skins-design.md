# Themes & Skins — Design Plan

## Why This Exists

Devin wants end users to be able to purchase skins/themes to customize how their digital instrument panel looks. Different colors, visual styles, textures — like buying a custom skin for a game character, but for music instrument panels. This is a monetizable product feature.

The contractor (designer who positions controls) should be able to preview skins in the editor to test how their layout looks with different themes. But the contractor doesn't configure themes — they just preview them.

## What A Theme Is

A theme is a coordinated color palette applied at the device level. One theme for the whole instrument. It changes:
- Panel background color and texture
- Button face gradients and borders
- Knob and slider surface colors
- Screen colorway (blue glow, green phosphor, amber CRT)
- Label text color temperature
- Section container tinting
- Tutorial highlight color

What it does NOT change:
- LED colors (PLAY green, REC red — these are hardware-accurate and stay)
- Control positions, sizes, or shapes
- Font faces
- Section layout or structure

## How It Works Technically

### CSS Custom Properties on PanelShell

`PanelShell` wraps the entire instrument panel. Apply theme as CSS variables on its root div:

```tsx
<div style={{
  '--panel-bg': theme.variables.panelBg,
  '--button-face-top': theme.variables.buttonFaceTop,
  '--button-face-bottom': theme.variables.buttonFaceBottom,
  '--label-color': theme.variables.labelColor,
  // ... all tokens
}}>
  {children}
</div>
```

Control components read CSS variables instead of hardcoded colors:
```tsx
// Before (hardcoded):
style={{ background: 'linear-gradient(to bottom, #4a4a4a, #2e2e2e)' }}

// After (themeable):
style={{ background: 'linear-gradient(to bottom, var(--button-face-top), var(--button-face-bottom))' }}
```

### Theme Definition Type

```typescript
interface PanelTheme {
  id: string;
  name: string;                // "Dark Industrial", "Retro Warm", "Neon Blue"
  description: string;
  isPremium: boolean;
  priceUsd?: number;
  previewImageUrl?: string;
  variables: {
    // Panel surface
    panelBg: string;
    panelBorder: string;
    panelGrainOpacity: string;     // texture intensity
    panelLightSource: string;      // radial gradient position

    // Sections & containers
    sectionBg: string;
    sectionBorder: string;
    sectionHeaderBg: string;
    sectionHeaderText: string;
    containerBg: string;
    containerBorder: string;
    containerShadow: string;

    // Buttons
    buttonFaceTop: string;         // gradient top
    buttonFaceBottom: string;      // gradient bottom
    buttonBorder: string;
    buttonText: string;

    // Knobs & dials
    knobOuter: string;
    knobInner: string;
    knobIndicator: string;

    // Sliders & faders
    sliderTrack: string;
    sliderThumb: string;

    // Pads
    padInactiveBg: string;

    // Screens
    displayBg: string;
    displayBezelColor: string;

    // Labels
    labelColor: string;
    labelMutedColor: string;

    // Depth & shadows
    shadowDepth: string;           // multiplier for shadow opacity
    highlightEdge: string;         // top-edge highlight brightness

    // Shape
    controlRadius: string;         // border-radius for rectangular controls

    // Tutorial highlights
    highlightGlowColor: string;    // blue by default, gold/rose for premium
  };
  metadata: {
    dominantHue: string;
    style: 'dark' | 'light' | 'high-contrast' | 'vintage';
    targetInstrumentTypes: ('synth' | 'dj' | 'universal')[];
  };
}
```

### Theme Storage & Delivery

- Built-in themes (including "Standard"): TypeScript objects in `src/lib/themes/`
- Premium themes: JSON files stored in Vercel Blob, fetched at runtime
- No CSS files — JSON serialized to `style` prop, no FOUC risk
- Preview thumbnails: small SVG or PNG showing a strip of themed controls

### What Already Exists (Architecture Readiness)

All controls already have `data-control-id` attributes in the DOM. All sections have `data-section-id`. These enable CSS targeting.

**What needs to be added:**
- `data-control-type` attribute on each control's outer wrapper (for type-based styling)
- `data-active` attribute for CSS-driven active state (avoids JS gradient recomputation)
- Migrate ~15 control components from hardcoded colors to CSS variables

### Migration Path

1. Add `data-control-type` and `data-active` attributes (small, no-risk)
2. Define "Standard" theme as CSS variables matching current hardcoded values (zero visual change)
3. Migrate control components one by one from hardcoded → CSS variables
4. Define 2-3 additional themes
5. Add theme selector UI on instrument page
6. Add "Skin Preview" dropdown in editor toolbar for contractor testing

### Migration Effort Estimate

| Component | Effort | Color Points |
|-----------|--------|-------------|
| SectionContainer | Trivial | 2 |
| PanelShell | Easy | 3 |
| LEDIndicator, LEDRing | Easy | 2 each |
| DirectionSwitch, Lever, Port | Easy | 2 each |
| JogDisplay | Easy | 2 |
| Slider | Medium | 7-8 |
| Knob, ValueDial | Medium | 8 each |
| Wheel, JogWheelAssembly | Medium | 12-15 |
| PanelButton (9 variants) | Hard | 20+ |
| TouchDisplay | Medium | 5-6 |
| PadButton | Easy | 3 |

Total: ~2-3 focused days for full migration.

### What Makes Skins Worth Purchasing (Ranked by Impact)

1. **Panel background + section tinting** — immediate visual identity shift
2. **Screen colorway** — green phosphor, amber CRT, warm orange (musicians love this)
3. **Texture overlays** — brushed metal, carbon fiber via `--panel-texture-url` repeating pattern
4. **Label color temperature** — warm amber vs cool white vs electric blue
5. **Tutorial highlight color** — gold/rose instead of default blue (visible during use)
6. **Knob/dial indicator color** — transforms the most repeated element on synths
7. **Control radius** — 0px (brutalist) vs 6px (modern) vs rounded (soft)
8. **Shadow depth** — flat/minimal vs deep 3D

### What NOT to Theme

- LED colors (hardware-accurate: PLAY=green, REC=red, CUE=amber)
- Keyboard zone colors (tutorial-specific, not panel chrome)
- Font faces (loading latency, licensing complexity)
- Control shapes (hexagonal pads etc. — requires component changes)

### Per-Archetype Section Accents (v2, Not v1)

Skip for v1. A device-level palette is sufficient. Per-archetype tinting (transport=green, effects=blue) requires:
- `archetype` field populated on editor sections (not there today)
- `functionalGroup` committed to production manifests (currently dropped during export)

These are tracked as separate fixes. When they're done, v2 skins can use per-section accents.

### Data Model Gaps to Fix Before Skins

| Gap | Impact | Fix |
|-----|--------|-----|
| `export-manifest/route.ts` has 16-field whitelist missing `ledStyle`, `labelFontSize`, `zOrder` | Production manifests incomplete | Add fields to whitelist |
| `functionalGroup` dropped during export | Can't target controls by function | Include in export |
| `buttonStyle` union inconsistent (4 vs 6 vs 9 values across files) | Theme variant targeting unreliable | Reconcile to single source |
| `surfaceColor` never populated (0/121 controls) | Can't give specific buttons colors | Pipeline needs to extract it |

### Framer Motion Highlight Animation

PanelButton's highlight animation uses hardcoded `rgba(0,170,255,...)` in a Framer Motion `animate` prop. CSS variables can't be used inside Framer's JS animation engine. Fix: a `useThemeColor` hook that reads `getComputedStyle().getPropertyValue('--highlight-glow-color')` on mount and passes the resolved value to the animation. Cache it — it only changes on theme switch.

### User-Facing Flow

1. User visits instrument page (e.g., `/instruments/cdj-3000`)
2. Panel renders with their selected skin (default: "Standard")
3. "Customize" button opens skin selector
4. Free skins available immediately; premium skins show price + purchase flow
5. Selection stored in user preferences (account or localStorage for non-auth)
6. Skin applies instantly — CSS variable swap, no page reload

### Contractor Editor Flow

1. Contractor opens editor as normal
2. "Skin Preview" dropdown in toolbar (next to Preview button)
3. Select a skin → panel re-renders with that skin's colors
4. Purely visual — doesn't save to manifest, resets on reload
5. Helps contractor verify their layout looks good across skins

---

## Key Files (for implementation reference)

- `src/components/controls/PanelShell.tsx` — root wrapper, apply CSS variables here
- `src/components/controls/PanelButton.tsx` — 9 variant styles with hardcoded gradients
- `src/components/controls/Knob.tsx` — radial gradients, box-shadows
- `src/components/controls/Slider.tsx` — track/thumb colors
- `src/components/controls/PadButton.tsx` — inactive bg color
- `src/components/controls/TouchDisplay.tsx` — bezel, screen bg, scanlines
- `src/components/controls/SectionContainer.tsx` — section bg/shadow
- `src/components/controls/PanelRenderer.tsx` — add `theme` prop, pass to PanelShell
- `src/lib/themes/` — new directory for theme definitions
- `src/types/panel.ts` or new `src/types/theme.ts` — PanelTheme interface

## Status

**PLAN ONLY — saved for later implementation.** Features 1 (label alignment) and 2 (mini sections) are being implemented first. This plan is ready for a new Claude instance to pick up and execute when the time comes.
