# Design System — ShalaERP

> **Memorable thing:** A village school teacher with no computer background should not feel intimidated.

---

## Product Context

- **What this is:** Marathi-language school management ERP for Maharashtra government and aided schools
- **Who it's for:** School clerks, principals, and teachers — many with low computer literacy; some on low-DPI monitors; some on Android phones on 3G
- **Space/industry:** Govtech / Education — same space as UDISE+, SARAL, Samagra
- **Project type:** Data-dense web app + dashboard; Ant Design (React + Vite)
- **Primary tasks by frequency:** Fee collection, attendance entry, report printing, certificate generation, salary slip management

---

## Aesthetic Direction

- **Direction:** Civic Warmth
- **Decoration level:** Minimal — typography and whitespace carry the visual work
- **Mood:** Official enough to be trusted by a government school inspector; human enough that a first-time computer user is not threatened. The category (UDISE+, SARAL) trades in density-as-professionalism. ShalaERP trades in **clarity-as-respect**.
- **Differentiation from category:** Every school ERP/government portal assumes the user will be trained before they use it — the UI reflects this with dense layouts, small fonts, and equal visual weight on all elements. ShalaERP breaks from this: generous spacing, one primary action always visible, clear Devanagari hierarchy at readable sizes.
- **Reference sites:** UDISE+ (udiseplus.gov.in) — studied and deliberately improved upon

---

## Typography

All text uses **Mukta** as primary face — it is purpose-built for Devanagari/Latin co-rendering with excellent legibility at screen sizes. Noto Sans Devanagari is the fallback for characters Mukta does not cover.

**Never use:** Inter, Roboto, Arial, or system-ui as primary font — they do not support Devanagari adequately.

- **Display / Page Title:** Mukta 700 — 28px / line-height 1.3
- **Section Heading:** Mukta 600 — 22px / line-height 1.4
- **Subsection / Card Title:** Mukta 600 — 18px / line-height 1.5
- **Body:** Mukta 400 — **16px minimum enforced** / line-height 1.7
- **Form Labels:** Mukta 500 — 15px / line-height 1.5
- **Table / Data:** Mukta 500 — 15px / `font-variant-numeric: tabular-nums` / letter-spacing 0.01em
- **Caption / Helper text:** Mukta 400 — 13px / line-height 1.6
- **Code:** JetBrains Mono — for any developer-facing content

**Loading:** Google Fonts CDN
```
https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap
```

**Type scale rationale:** The 16px body minimum is a hard rule. Devanagari script at 13px (the category standard) is illegible on low-DPI monitors under ambient light in a school office. Every pixel of font size is directly in service of the memorable thing.

---

## Color

**Approach:** Restrained — navy grounds authority, warm off-white softens it, saffron accent guides action.

### Primary — Navy (SAFE)
Trust signal. Maharashtra government school staff associate navy blue with official software (UDISE+, DigiLocker, all NIC portals). Changing this would disorient users.

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#1A5276` | Sidebar background, primary nav, secondary buttons |
| `--navy-dark` | `#0F3A57` | Hover states, active pressed |
| `--navy-light` | `#2471A3` | Links, secondary interactive elements |
| `--navy-tint` | `#EAF2F8` | Badge backgrounds, selected row highlight |

### Accent — Saffron/Amber (RISK)
**This is the key differentiation.** The category uses blue-on-blue CTAs — primary buttons are a slightly lighter/darker blue than the surrounding UI. This creates poor visual hierarchy for low-literacy users who need to find the action quickly.

Saffron (#C0722A) breaks from convention. It is culturally resonant in Maharashtra without being cliché (it is not the saffron of political parties — it is the warm amber of sunlight, brick, and traditional handcraft). More importantly: it is visually unambiguous. On any screen with navy and white, the saffron button is the only warm-colored element. Eyes find it immediately.

| Token | Hex | Usage |
|-------|-----|-------|
| `--saffron` | `#C0722A` | **Primary action buttons only** — शुल्क भरा, जतन करा (main CTA) |
| `--saffron-dark` | `#9E5A1C` | Hover/pressed state |
| `--saffron-light` | `#E8934A` | Focus ring on saffron elements |
| `--saffron-tint` | `#FDF0E5` | Alert backgrounds, highlighted states |

**Rule:** Only one saffron element is visible per screen at a time. If two saffron buttons appear simultaneously, one must be demoted to `btn-secondary` (navy). Scarcity preserves the guidance value for low-literacy users.

### Surfaces (RISK)
Shift from `#F5F5F5` (cold gray) to `#FAF8F5` (warm off-white). The change is subtle — 3-4 points of warmth in RGB — but it shifts the emotional register from clinical to welcoming.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#FAF8F5` | Page background |
| `--surface` | `#FFFFFF` | Cards, modals, sidebar content areas |
| `--surface-raised` | `#F5F1EB` | Table header rows, selected states, secondary backgrounds |
| `--border` | `#E8E2D9` | Default borders (cards, inputs, table rows) |
| `--border-strong` | `#C9BFB0` | Dividers, ghost button borders |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--ink` | `#1C1917` | Headings, table cell content, form values |
| `--ink-soft` | `#57534E` | Body paragraphs, secondary descriptions |
| `--ink-muted` | `#A8A29E` | Captions, placeholder text, disabled labels |
| `--ink-inverse` | `#FFFFFF` | Text on navy/saffron backgrounds |

### Semantic
| Token | Hex | Background | Usage |
|-------|-----|-----------|-------|
| `--success` | `#166534` | `#DCFCE7` | भरले, Paid, Active |
| `--warning` | `#92400E` | `#FEF3C7` | अंशतः, Partial, Expiring soon |
| `--error` | `#991B1B` | `#FEE2E2` | थकबाकी, Failed, Overdue |
| `--info` | `#1E40AF` | `#DBEAFE` | प्रक्रियेत, In progress, System info |

### Dark Mode
Dark mode reduces surface lightness while preserving warm undertones. Do not map to pure black (`#000000`) — use `#1C1917` (warm near-black).
- Background: `#1C1917`
- Surface: `#292524`
- Surface Raised: `#3C3633`
- Borders: `#44403C` / `#57534E`
- Text: unchanged accent colors, text inverted

---

## Spacing

**Base unit:** 8px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-2xs` | 4px | Icon gaps, tight badge padding |
| `--space-xs` | 8px | Button icon gap, small internal padding |
| `--space-sm` | 12px | Form field internal padding (vertical) |
| `--space-md` | 16px | Form field gaps, card internal padding |
| `--space-lg` | 24px | Card padding, section element spacing |
| `--space-xl` | 32px | Section breaks within a page |
| `--space-2xl` | 48px | Major section breaks, page-level vertical rhythm |
| `--space-3xl` | 64px | Page top padding, hero areas |

**Density rules:**
- **Tables:** 40px row height (generous — reduces mis-taps on touch, reduces visual anxiety)
- **Forms:** `--space-md` (16px) between fields
- **Sections on a page:** `--space-xl` to `--space-2xl` (32-48px) between logical groups
- **Cards:** `--space-lg` (24px) internal padding

**Rationale:** UDISE+ and every school portal in the category uses ~28-32px row height and 8-12px between form groups. This creates visual pressure. ShalaERP's extra space is the primary design delivery of the "not intimidating" brief.

---

## Layout

- **Approach:** Grid-disciplined — strict columns for data pages, consistent alignment
- **Grid:** 12-column; data pages use 8+4 or 6+6 splits; forms use single 6-column centered column on wide screens
- **Max content width:** 1280px
- **Sidebar:** Fixed 230px, navy gradient, collapses on `breakpoint="lg"` (mobile)
- **Header:** 52px fixed, white, sticky

**One primary action rule:** Every page must have exactly one primary (saffron) action visible at all times — the thing the user is expected to do next. If a page has no clear next action, show an empty state with a directional message pointing to what they need to select/configure first.

**Border radius scale:**
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Tags, badges, small interactive chips |
| `--radius-md` | 8px | Input fields, dropdowns, tooltips |
| `--radius-lg` | 12px | Cards, modals, sidebar sections |
| `--radius-full` | 9999px | Pills, avatar circles, toggle switches |

---

## Motion

**Approach:** Minimal-functional — only transitions that aid comprehension; no animation on data-heavy views.

- **Page transitions:** 150ms ease-out opacity + translate(0, 4px)
- **Modal open/close:** 200ms ease-out scale(0.97) + opacity
- **Button hover:** 150ms ease-in-out background-color only — no scale/bounce
- **Table row hover:** 100ms ease background-color change
- **Alert appear:** 200ms ease-out slide-down
- **No animation on:** Table content, chart updates, form validation messages while typing

**Easing:** `enter: cubic-bezier(0.0, 0.0, 0.2, 1)` (ease-out) · `exit: cubic-bezier(0.4, 0.0, 1, 1)` (ease-in) · `move: cubic-bezier(0.4, 0.0, 0.2, 1)` (ease-in-out)

---

## Ant Design Token Mapping

The system is built on Ant Design. These are the ConfigProvider token overrides:

```ts
const antTheme = {
  token: {
    colorPrimary:   '#1A5276',      // Navy — used for focus rings, links
    colorLink:      '#1A5276',
    fontFamily:     "'Mukta', 'Noto Sans Devanagari', sans-serif",
    fontSize:       16,             // Enforced minimum
    borderRadius:   8,              // --radius-md
    colorBgBase:    '#FAF8F5',      // Warm off-white
    colorBgLayout:  '#FAF8F5',
    colorBorderSecondary: '#E8E2D9',
  },
  components: {
    Button: {
      // Primary buttons: use saffron by wrapping with style prop
      // -- Do not override colorPrimary here; use className="btn-saffron"
    },
    Table: {
      headerBg:    '#F5F1EB',
      rowHoverBg:  '#F5F1EB',
      borderColor: '#E8E2D9',
    },
  },
};
```

**Saffron primary buttons:** Ant Design's `colorPrimary` token is also used for focus rings and links (should stay navy). Use a CSS utility class for saffron CTAs:
```css
.btn-cta.ant-btn-primary {
  background: #C0722A !important;
  border-color: #C0722A !important;
}
.btn-cta.ant-btn-primary:hover {
  background: #9E5A1C !important;
  border-color: #9E5A1C !important;
}
```

---

## Number Format Convention

- **UI tables and screens:** Arabic numerals with Indian locale (`en-IN`) — `₹5,200` — faster to scan in dense data contexts
- **Printed documents (fee receipts, salary slips, TC, certificates):** Devanagari numerals — `₹ ५,२०० ` — appropriate for official Maharashtra government document format

---

## Empty States

Every page that depends on a selector (unit, academic year, student) must show a directional empty state when that selector is unpopulated. Never show a generic "No data" message — show where to look:

```
↑
शाळा निवडा
वरील "शाळा" निवडल्यानंतर माहिती दिसेल
```

The arrow points toward the actual control. This serves low-literacy users who might not scan the full UI before reading the content area.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-30 | Initial design system created | /design-consultation — product context confirmed, UDISE+ competitive research, user brief: "not intimidating" |
| 2026-05-30 | Saffron accent `#C0722A` adopted | Replaces blue-on-blue CTAs; provides unambiguous action hierarchy for low-literacy users; culturally resonant in Maharashtra |
| 2026-05-30 | Background shifted `#F5F5F5` → `#FAF8F5` | Warm off-white reduces clinical feel; maintains high contrast |
| 2026-05-30 | 16px body minimum enforced | Devanagari at 13px (category standard) is illegible on low-DPI school monitors |
| 2026-05-30 | 40px table row height | Reduces anxiety for clerks processing 50+ rows/day; reduces mis-taps on touch |
| 2026-05-30 | Number format: Arabic in UI, Devanagari in print | Arabic scans faster in tables; Devanagari appropriate for official printed documents |
| 2026-05-30 | "One saffron element per screen" rule | Scarcity preserves guidance value for low-literacy users |
