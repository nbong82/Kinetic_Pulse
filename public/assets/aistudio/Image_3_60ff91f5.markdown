---
name: Kinetic Pulse
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#bacbb8'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#859583'
  outline-variant: '#3c4b3c'
  surface-tint: '#07e469'
  primary: '#77ff94'
  on-primary: '#003915'
  primary-container: '#10e66a'
  on-primary-container: '#006128'
  inverse-primary: '#006e2e'
  secondary: '#bec6de'
  on-secondary: '#283043'
  secondary-container: '#41495c'
  on-secondary-container: '#b0b8cf'
  tertiary: '#adefff'
  on-tertiary: '#00363f'
  tertiary-container: '#2cdbf9'
  on-tertiary-container: '#005c6b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#67ff8d'
  primary-fixed-dim: '#07e469'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#dae2fb'
  secondary-fixed-dim: '#bec6de'
  on-secondary-fixed: '#131b2d'
  on-secondary-fixed-variant: '#3f475a'
  tertiary-fixed: '#a6eeff'
  tertiary-fixed-dim: '#27d9f7'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5b'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  display-lg:
    fontFamily: Chivo
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Chivo
    fontSize: 36px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.02em
  metric-huge:
    fontFamily: JetBrains Mono
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.04em
  metric-huge-mobile:
    fontFamily: JetBrains Mono
    fontSize: 42px
    fontWeight: '700'
    lineHeight: 46px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Chivo
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Chivo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Chivo
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  body-lg:
    fontFamily: Chivo
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Chivo
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system is forged for endurance athletes, marathoners, and dedicated runners who operate in early dawns, night sessions, and extreme physical thresholds. The brand personality is dialed into relentless momentum, precision execution, and electric focus. It balances technical athletic instrumentation with an adrenaline-fueled digital aesthetic.

The design movement merges **Technical Precision Brutalism** with **Modern Luminescent Minimalism**:
- Deep obsidian and charcoal substrates eliminate optical fatigue during low-light training and maximize battery longevity on OLED screens.
- Electric fluorescent green highlights punch through the darkness, signaling active state changes, real-time pace splits, personal records, and crucial inputs.
- Micro-interactions communicate mechanical precision—delivering crisp tactile feedback, firm structural surfaces, and zero-distraction utilitarian clarity.

## Colors

The palette is engineered around high luminance contrast to ensure complete legibility under midday glare or pitch-black night trails.

- **Primary (`#10E66A`)**: Electric Volt Green. Used exclusively for core conversion actions (e.g., Save Run, Start Split), active pace metrics, completed track rings, and critical athletic milestones. Never dilute this color into large static backgrounds; it operates as high-voltage signaling wire.
- **Secondary (`#1E2638`)**: Slate Charcoal. Serves as container fills, segmented control tracks, and input field backdrops. It sits distinct from the void background to structure card containers.
- **Tertiary (`#38E1FF`)**: Cyan Pulse. Reserved for secondary athletic stats—specifically elevation gain, heart rate recovery intervals, and cadence differentials.
- **Neutral Base (`#0D1117`)**: Pure Obsidian Night. The foundation layer. Tinted subtly with cyan-blue undertones rather than pure grey to maintain chromatic depth on mobile OLED panels.
- **Neutral Elevated (`#161B26`)**: Card and drawer surfaces. Elevated one tier above canvas background with crisp, hairline perimeter delineation (`rgba(255, 255, 255, 0.08)`).
- **Text & Foreground**: Pure White (`#FFFFFF`) for primary stats, distances, and headers. Muted Silver (`#8B949E`) for metric labels (km, /km, bpm) and inactive meta information.

## Typography

The typographic hierarchy prioritizes instantaneous data intake during rapid movement. 

- **Primary & Display Type (`Chivo`)**: Selected for its aggressive geometric punch, wide stance, and high optical velocity. When set in bold and black weights, it radiates forward momentum.
- **Metric & Telemetry Type (`JetBrains Mono`)**: Applied to all numbers, pacing readouts, timers, splits, and coordinates. Tabular figures (`tnum`) are enforced systematically so dynamic counters never shift layout or vibrate during real-time GPS tracking.
- **All Caps for Labels**: Metadata indicators (`PACE`, `SPLIT`, `BPM`, `CADENCE`, `KM`) are always set in uppercase using `JetBrains Mono` with expanded tracking (`0.06em` to `0.08em`) to guarantee quick peripheral scanning.

## Layout & Spacing

The layout adapts to single-handed mobile usage with high touch targets, catering to sweaty or trembling hands post-workout.

- **Grid Architecture**: Mobile layout relies on a 4-column fluid structure flanked by `1.25rem` outer canvas margins. Tablet and desktop management dashboards expand to 8 and 12 columns with `1.5rem` gutters.
- **Thumb Zone Priority**: Primary action triggers (Save Run, Lap, Split, Pause) occupy the bottom 25% of the viewport within direct thumb reach. Critical metrics live in the center zone, while route maps and static profile data stay pinned to the upper third.
- **Component Padding Rhythms**:
  - `space-xs` (4px): Micro padding between icons and numeric telemetry.
  - `space-sm` (8px): Gaps between segment pills and grid stat cells.
  - `space-md` (16px): Standard internal padding for cards and entry fields.
  - `space-lg` (24px): Stack spacing between distinct telemetry card groups.
  - `space-xl` (36px): Generous separation for sheet headers and sticky action anchors.

## Elevation & Depth

Visual hierarchy does not use diffuse, cloudy drop shadows, which muddy dark interfaces. Depth is achieved via **Luminescent Layering and Structural Contours**:

- **Ground Level (Canvas)**: `#0D1117`, totally matte and absorptive.
- **Level 1 (Card & Module Surfaces)**: Surface `#161B26` framed with a 1px solid border at `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Active/Floating Elements)**: `#1F2636` framed with `rgba(16, 230, 106, 0.35)` and an ambient, laser-focused back-glow: `box-shadow: 0 0 24px -4px rgba(16, 230, 106, 0.15)`.
- **Level 3 (Modals, Overlays, and Sticky Action Anchors)**: `#12161F` with a top boundary line of `rgba(255, 255, 255, 0.12)` accompanied by high-blur background filters (`backdrop-filter: blur(16px)`).

## Shapes

The design system maintains a chiseled, technical posture. Shapes avoid overly rounded, bubbly forms, adopting a disciplined **Soft Precision** geometry (`0.25rem` base, `0.5rem` for cards, `0.75rem` for prominent bottom sheets).

- **Cards & Data Grids**: Corner radius `rounded-lg` (`0.5rem`). Gives an engineered chassis feel.
- **Input Fields & Metric Steppers**: Corner radius `rounded` (`0.25rem`), accentuating industrial hardware.
- **Action Buttons**: Corner radius `rounded` (`0.25rem`) for high-tension physical presence. Primary action buttons can take `rounded-lg` (`0.5rem`) for enhanced ergonomic hand-off.
- **Pills & Status Chips**: Soft pill shape (`9999px`) reserved only for micro contextual badges (e.g., `GPS LOCKED`, `AUTO-PAUSE`) to create immediate visual distinction against geometric telemetry tiles.

## Components

### Buttons
- **Primary "Save Run" Button**: The physical anchor of the logging workflow. Rendered in full solid `#10E66A` with dark pitch-black text (`#0D1117`) in `Chivo Black` uppercase. Features a subtle bottom-edge bevel effect (`box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.25)`) and an active press state that physically depresses 2px downward. Generates a glowing edge aura (`box-shadow: 0 0 20px rgba(16, 230, 106, 0.35)`). Minimum touch target height: `56px`.
- **Secondary Button**: Background `#1E2638`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#FFFFFF`. On tap, brightens to `#2A354C`.
- **Destructive / Discard Button**: Ghost background, text `#FF4D4D`, border `1px solid rgba(255, 77, 77, 0.2)`.

### Input Fields (Distance, Duration, Pace)
- Specialized multi-cell mechanical segmented dials. 
- Background `#161B26` with a crisp 1px neutral stroke (`#242D3D`).
- Typography set in `JetBrains Mono` at `28px` to `36px` for numbers, accompanied by fixed trailing labels (`KM`, `HR`, `MIN`, `SEC`, `/KM`) in muted `#8B949E`.
- Active focus state swaps border color instantly to `#10E66A` with an inner hairline highlight.
- Native steppers and giant touch pads replace tiny keyboard entries where feasible to permit rapid adjustment while breathing heavily.

### Metric Cards & Telemetry Grid
- Two-column or three-column modular tiles.
- Top label: `JetBrains Mono` `10px` uppercase in `#8B949E`.
- Primary stat: `JetBrains Mono` `24px` to `32px` in `#FFFFFF`.
- Sub-stat / Trend arrow: `12px` font indicating delta compared to average pace in `#10E66A` (faster) or `#FF5C5C` (slower).

### Chips & Filter Tags
- Height: `32px`. Compact, dense layout.
- Inactive: Border `1px solid rgba(255, 255, 255, 0.1)`, surface `rgba(255, 255, 255, 0.03)`, text `#8B949E`.
- Selected: Border `1px solid #10E66A`, surface `rgba(16, 230, 106, 0.12)`, text `#10E66A`, with a 4px solid neon indicator dot preceding the chip label.

### Lists & Split Logs
- Split records alternate background row tints (`#0D1117` vs `#111620`) to preserve alignment across 20+ lap segments.
- Column structure: Lap Number (bold, fixed width) | Split Pace (tabular mono) | Elevation Profile (micro sparkline) | Heart Rate Zone Badge.
- Best split highlighted by a left vertical 2px neon bar (`#10E66A`).

### Checkboxes & Toggle Switches
- Toggle tracks are pill-shaped, dark charcoal (`#1E2638`), expanding to `#10E66A` when toggled on. The switch thumb is stark white (`#FFFFFF`) with tactile friction notches.
- Checkboxes: `20px x 20px` square with `2px` border radius. Checked state fills `#10E66A` with a jet-black checkmark icon.