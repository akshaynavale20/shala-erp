/**
 * pdf/fonts.ts — Register Devanagari fonts for @react-pdf/renderer
 *
 * Three families:
 *   Mukta               — compact sans for receipts/UI-style docs (tighter metrics)
 *   NotoSansDevanagari  — sans-serif for labels, metadata, badges, small text
 *   NotoSerifDevanagari — serif for certificates, school name, declarations
 */
import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  // Mukta — compact Devanagari sans, designed for tight line-heights
  Font.register({
    family: 'Mukta',
    fonts: [
      { src: '/fonts/Mukta-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Mukta-Bold.ttf',    fontWeight: 700 },
    ],
  });

  // Noto Sans Devanagari — for reports/certificates where Noto look is preferred
  Font.register({
    family: 'NotoSansDevanagari',
    fonts: [
      { src: '/fonts/NotoSansDevanagari.ttf', fontWeight: 400 },
      { src: '/fonts/NotoSansDevanagari.ttf', fontWeight: 700 },
    ],
  });

  // Noto Serif Devanagari — serif display for certificates
  Font.register({
    family: 'NotoSerifDevanagari',
    fonts: [
      { src: '/fonts/NotoSerifDevanagari.ttf', fontWeight: 400 },
      { src: '/fonts/NotoSerifDevanagari.ttf', fontWeight: 700 },
    ],
  });

  // Disable hyphenation — Devanagari doesn't use hyphens
  Font.registerHyphenationCallback(word => [word]);
}
