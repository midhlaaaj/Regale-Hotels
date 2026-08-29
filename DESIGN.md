---
name: Heritage Ledger
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#56423c'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#8a726b'
  outline-variant: '#ddc0b8'
  surface-tint: '#a0401f'
  primary: '#842c0c'
  on-primary: '#ffffff'
  primary-container: '#a44322'
  on-primary-container: '#ffd4c7'
  inverse-primary: '#ffb59e'
  secondary: '#4d6453'
  on-secondary: '#ffffff'
  secondary-container: '#cde6d1'
  on-secondary-container: '#516857'
  tertiary: '#614504'
  on-tertiary: '#ffffff'
  tertiary-container: '#7b5d1c'
  on-tertiary-container: '#ffd993'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#802909'
  secondary-fixed: '#d0e9d4'
  secondary-fixed-dim: '#b4cdb8'
  on-secondary-fixed: '#0b2013'
  on-secondary-fixed-variant: '#364c3c'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#e9c176'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4201'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '600'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-ledger:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Space Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is rooted in the "New Indian Editorial" aesthetic—a blend of traditional hospitality and contemporary boutique minimalism. It avoids the friction-heavy patterns of global travel aggregators in favor of a calm, narrative-driven experience.

The visual language draws from the tactile quality of a guest ledger and the architectural warmth of South Indian estates. The style is **Minimalist-Tactile**, prioritizing expansive white space (limestone), rich organic textures, and intentional typographic hierarchies. It should evoke the feeling of reading a high-end travel journal rather than browsing a database.

## Colors

The palette is derived from the natural materials of the Indian landscape.
- **Limestone (#F9F7F2):** The primary canvas. Use this as the global background to provide warmth and reduce eye strain.
- **Laterite Red (#A44322):** The primary action color. Use for key CTAs, active states, and brand-critical highlights.
- **Backwater Green (#1B3022):** The core structural color. Used for primary typography, icons, and deep immersive backgrounds in sections like "The Experience."
- **Brass (#C5A059):** An accent color for ornamentation, dividers, and secondary interactive cues. Use sparingly to maintain its premium feel.

## Typography

The typographic system utilizes a three-font strategy to balance editorial elegance with utility:
1. **Bodoni Moda:** High-contrast serif for all storytelling elements and headlines. It brings the luxury fashion/editorial feel.
2. **Hanken Grotesk:** A clean, modern sans-serif that ensures legibility for descriptions and long-form copy.
3. **Space Mono:** Used exclusively for "data" elements—prices, dates, room numbers, and booking confirmations. This provides a "ledger" or "archival" character that feels authentic and trustworthy.

## Layout & Spacing

This design system employs a **Fixed Grid** on desktop (12 columns) and a **Fluid Grid** on mobile (4 columns). 

The spacing rhythm is intentional and generous. Avoid "packing" content. Use large vertical margins (Section Spacing) to allow the photography and typography to breathe. 
- **The "Ledger" Alignment:** Information on cards and booking bars should use the mono font aligned to a clear vertical axis, mimicking the columns of an old accounting book.
- **Breakpoints:** Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px).

## Elevation & Depth

To maintain the grounded, authentic feel, this system avoids heavy ambient shadows. Depth is conveyed through:
- **Tonal Layering:** Using slightly different shades of Limestone or very thin 1px Brass borders to separate containers.
- **Subtle Hard Shadows:** When elevation is necessary (e.g., a modal), use a sharp, low-offset shadow with a deep green tint: `4px 4px 0px rgba(27, 48, 34, 0.05)`.
- **Soft Overlays:** Use semi-transparent Backwater Green overlays on imagery to ensure text legibility while maintaining color harmony.

## Shapes

The shape language is **Architectural**. While the brand is warm, it is also structured and precise.
- **Soft (0.25rem):** Standard for buttons, input fields, and small UI components.
- **Sharp (0px):** For large hero sections and structural images to mimic the sharp lines of a printed magazine or architectural columns.
- **Dividers:** Use 1px wide lines in Brass (#C5A059) with high horizontal padding to separate content sections elegantly.

## Components

### Buttons
Primary buttons use a solid Laterite Red background with Limestone text. They are slightly elongated with 0.25rem corners. Secondary buttons use a Brass outline with Backwater Green text.

### Inputs & Fields
Inputs are designed as "Ledger Lines"—minimalist 1px bottom borders in Backwater Green. Labels use the `label-ledger` (Space Mono) style placed above the line. Focus states transition the border to Laterite Red.

### Cards
Hotel and room cards use a "Full Bleed" imagery style with a Limestone text block below. No shadows; use a 1px `Backwater Green` border at 10% opacity for containment.

### The Booking Ledger
A specialized component for Regale Hotels. This sticky bar or side panel uses the Space Mono font for all pricing and date calculations, presented in a clean vertical table format reminiscent of a paper receipt.

### Chips & Tags
Used for amenities (e.g., "Infinity Pool"). Styled with a very light Brass background (#F2E8D5) and Backwater Green text, using `label-ledger` typography.