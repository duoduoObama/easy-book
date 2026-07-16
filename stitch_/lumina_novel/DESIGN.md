---
name: Lumina Novel
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#dbc1b4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a38c80'
  outline-variant: '#554339'
  surface-tint: '#ffb689'
  primary: '#ffb689'
  on-primary: '#512300'
  primary-container: '#f08d49'
  on-primary-container: '#632c00'
  inverse-primary: '#974803'
  secondary: '#91cdff'
  on-secondary: '#003350'
  secondary-container: '#0071a8'
  on-secondary-container: '#deeeff'
  tertiary: '#4ad8eb'
  on-tertiary: '#00363c'
  tertiary-container: '#00b7c9'
  on-tertiary-container: '#00424a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb689'
  on-primary-fixed: '#321300'
  on-primary-fixed-variant: '#743500'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#91cdff'
  on-secondary-fixed: '#001e31'
  on-secondary-fixed-variant: '#004b72'
  tertiary-fixed: '#94f1ff'
  tertiary-fixed-dim: '#4ad8eb'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f57'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-title:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-md:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-reading-lg:
    fontFamily: Literata
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: 0.01em
  body-reading-md:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  ui-button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  reading-margin-h: 1.5rem
  reading-margin-v: 2rem
  gutter-md: 1rem
  stack-sm: 0.5rem
  stack-lg: 2rem
---

## Brand & Style

The design system is centered on "Immersive Sanctuary"—a philosophy that prioritizes the act of reading above all else. By removing the visual noise and commercial clutter of traditional reading apps, this design system creates a premium, focused environment that mimics the focus of a physical book while leveraging modern digital comforts.

The style is **Minimalist-Corporate Hybrid** with a high-end editorial feel. It utilizes deep, charcoal-ink surfaces to reduce eye strain, paired with high-precision typography. The emotional goal is to evoke a sense of calm, intellectual focus, and quiet luxury.

- **Minimalism:** Clean layouts, generous negative space in margins, and a strict "function-first" component hierarchy.
- **Modern:** Contemporary UI patterns like large tap targets and subtle tonal layering provide a sophisticated digital experience.
- **Focus:** Every element not related to the text itself is tucked away into secondary layers, accessible only when needed.

## Colors

The palette is optimized for long-form reading in low-light environments. 

- **Primary (Soft Orange):** Used sparingly for active states, reading progress indicators, and primary call-to-actions. It provides a warm, non-jarring contrast against the dark background.
- **Secondary (Muted Blue):** Used for informational elements, such as chapter metadata or "New" badges, providing a cooler alternative to the primary accent.
- **Neutrals:** The background is not pure black (#000) to avoid "ghosting" or smearing on OLED screens. Instead, a deep charcoal is used.
- **Reading Contrast:** Body text does not use pure white. A softened grey-white reduces the harshness of light emission, ensuring comfort for hours of continuous reading.

## Typography

Typography is the core of the design system. We use a dual-serif approach for the content and a clean sans-serif for the interface.

- **Reading Text (Literata):** Chosen for its exceptional legibility on digital screens. It features vertical stress and open counters that prevent eye fatigue.
- **Editorial Headers (Newsreader):** Provides a traditional, authoritative literary feel for book titles and chapter names.
- **System Interface (Inter):** A utilitarian sans-serif used for navigation, settings, and buttons to clearly distinguish "App UI" from "Book Content."

Line height is intentionally generous (1.6x - 1.8x) to help readers track lines easily. Paragraph spacing should be used instead of first-line indents for a modern digital reading feel.

## Layout & Spacing

The layout is a **Fixed Margin Model** on mobile and a **Centered Column Model** on larger screens. 

- **Reading Experience:** The text column width is capped at 700px on desktop/tablet to ensure an optimal line length (approx 60-75 characters).
- **Margins:** Vertical margins are intentionally deep at the top to allow for "breathing room" above chapter titles.
- **Grid:** A simple 4-column grid for mobile and 12-column for desktop governs the library and settings views. 
- **The "Zen" Mode:** In active reading mode, all UI (status bar, navigation, buttons) should fade out, leaving only the text. UI reappears upon a single center-screen tap.

## Elevation & Depth

To maintain a "flat and focused" aesthetic, this design system avoids heavy shadows. 

- **Tonal Layering:** Depth is conveyed through background color steps. The base is `#121212`. Overlays (like chapter lists or settings drawers) use `#242424`.
- **Low-Contrast Outlines:** Subtle 1px borders in `#333333` are used to define card boundaries or input fields, replacing the need for shadows.
- **Focused Overlays:** When an overlay appears (like the "Settings" panel), a backdrop blur (12px) is applied to the reading text behind it to maintain context without visual competition.

## Shapes

The shape language is sophisticated and "soft-modern."

- **Cards & Sheets:** Use a `1rem` (rounded-lg) corner radius to feel approachable and premium.
- **Interactive Elements:** Buttons and chips use the same `0.5rem` base to maintain consistency.
- **Book Covers:** Use a very slight `0.25rem` radius to mimic the subtle curve of a physical book spine and cover.

## Components

### Buttons
- **Primary:** Soft Orange (#F08D49) background with dark text. High visibility for "Start Reading."
- **Ghost:** No background, subtle grey border. Used for secondary actions like "Download Chapter."

### Reading Controls
- **Sliders:** The progress slider features a thick, rounded track in `#333` and a large, tactile thumb in the primary accent color.
- **Floating Action Button (FAB):** A single "Listen" (TTS) icon may float in the bottom right, using a semi-transparent blur background to avoid blocking text.

### Chapter List
- **List Items:** High vertical padding (16px) with a subtle separator line. Active chapters are highlighted with a left-edge primary color accent.

### Inputs
- **Search:** Fully rounded "pill" shape with a glassmorphic background for the library view.

### Cards
- **Library Card:** Vertical orientation, prioritizing the cover art with the title and author in the metadata area below. No borders; use spacing to define the grid.