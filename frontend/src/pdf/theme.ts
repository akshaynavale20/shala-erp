/**
 * pdf/theme.ts — Design tokens for VidyaSetu PDFs
 *
 * Two design directions:
 *   CERT_*   — Direction 2: Navy + Gold formal crest  (TC, Bonafide, Character)
 *   RPT_*    — Direction 3: Indigo modern gazette      (Reports, Fee receipts, Salary)
 */
import { StyleSheet } from '@react-pdf/renderer';

// ── Direction 2: Bordered Formal Crest (Certificates) ────────────────────────
export const CERT = {
  paper:     '#fffdf6',
  ink:       '#1d2433',
  inkSoft:   '#4d5566',
  navy:      '#16233f',
  navySoft:  '#3a4d72',
  gold:      '#9a7b2e',
  goldSoft:  '#c9aa5d',
  rule:      '#d9cfb6',
  box:       '#f6f1e3',
};

// ── Direction 3: Modern Gazette (Reports / Fee / Salary) ────────────────────
// Laser-safe palette: colour used only where it survives B&W grayscale.
// Key rule — no row/cell distinction that relies solely on a light colour tint.
// Dark headers (#1a1a2e) → very dark gray on laser ✓
// rowEven (#f0f0f0) → visible 6% gray step from white ✓  (was near-white blue)
// tint (#e4e4e4) → clear light gray ✓                    (was blue near-white)
// rule/ruleStrong → medium/dark gray borders ✓
export const RPT = {
  paper:       '#ffffff',
  ink:         '#111111',         // near-black for maximum contrast on laser
  inkSoft:     '#4a5568',
  muted:       '#718096',
  accent:      '#1a1a2e',        // very dark navy → prints as near-black on laser ✓
  accentLight: '#2d3748',        // dark slate → dark gray on laser ✓
  tint:        '#e4e4e4',        // clear light gray (was blue near-white #eef1f9)
  rule:        '#c0c0c0',        // visible gray border (was faint #e4e7ee)
  ruleStrong:  '#888888',        // strong gray border (was faint #c9cedb)
  rowEven:     '#f0f0f0',        // 6% gray step — clear alternation on laser (was #f7f9fe)
  success:     '#1a6b3c',        // dark green → medium-dark gray on laser, still readable
  successBg:   '#d4edd8',        // light green bg; text is dark, still legible on laser
  danger:      '#b91c1c',        // dark red → dark gray on laser
  dangerBg:    '#fee2e2',        // light red bg; text is dark, still legible
  warning:     '#92400e',        // dark amber → dark gray on laser
  warningBg:   '#fef3c7',
};

// ── Legacy aliases (used by existing callers) ─────────────────────────────────
export const COLORS = {
  primary:    RPT.accent,
  accent:     RPT.accentLight,
  success:    RPT.success,
  danger:     RPT.danger,
  warning:    RPT.warning,
  text:       RPT.ink,
  textLight:  RPT.inkSoft,
  textMuted:  RPT.muted,
  bg:         RPT.paper,
  bgAlt:      RPT.tint,
  bgHeader:   RPT.accent,
  border:     RPT.rule,
  borderDark: RPT.ruleStrong,
  rowEven:    RPT.rowEven,
  rowOdd:     RPT.paper,
};

export const FONT       = 'Mukta';                // sans — labels, metadata, badges (static TTF, bold works)
export const FONT_SERIF = 'NotoSerifDevanagari';  // serif — values, school name, declaration

export const base = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: RPT.ink,
    backgroundColor: RPT.paper,
    padding: '14mm 12mm',
    lineHeight: 1.5,
  },
  pageA5: {
    fontFamily: FONT,
    fontSize: 9.5,
    color: RPT.ink,
    backgroundColor: RPT.paper,
    padding: '10mm 9mm',
    lineHeight: 1.5,
  },
  pageCert: {
    fontFamily: FONT,
    fontSize: 10,
    color: CERT.ink,
    backgroundColor: CERT.paper,
    padding: '10mm 12mm',
    lineHeight: 1.4,
  },
});
