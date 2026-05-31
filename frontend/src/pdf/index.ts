/**
 * pdf/index.ts — VidyaSetu PDF Design System
 *
 * Centralised re-export of every PDF primitive so consumers can:
 *
 *   import { downloadReportPDF, downloadFeeReceipt, RPT, BrandHeader } from '../../pdf';
 *
 * ── Design tokens ────────────────────────────────────────────────────────────
 *   RPT      — Report palette (navy, ink, muted, rowEven, tint, rule…)
 *   CERT     — Certificate palette (navy, gold, formal)
 *   FONT     — 'Mukta'  (sans-serif, Devanagari, bold works)
 *   FONT_SERIF — 'NotoSerifDevanagari' (use FONT instead for bold text)
 *   base     — Base StyleSheet: page, pageA5, pageCert
 *
 * ── Shared components ────────────────────────────────────────────────────────
 *   BrandHeader   — 3-col report letterhead OR centred cert crest
 *   BrandFooter   — Signature row + seal + computer-generated note
 *   AuditFooter   — Audit trail row (printed-at / user / report-id)
 *   PageNumber    — Fixed page-number footer
 *
 * ── PDF documents ────────────────────────────────────────────────────────────
 *   ReportTablePDF / downloadReportPDF    — Generic 14-type report
 *   FeeReceiptPDF / downloadFeeReceipt    — Fee receipt (2 copies on A4)
 *   FeeSummaryPDF / downloadFeeSummary    — Fee collection summary (2-table)
 *   CertificatePDF / downloadCertificate  — TC / Bonafide / Character cert
 *   SalarySlipPDF / downloadSalarySlip    — Salary slip
 *   IdentityCardPDF / downloadIdentityCards — ID cards (4 per A4 portrait)
 *
 * ── Utilities ────────────────────────────────────────────────────────────────
 *   registerFonts   — Call once before rendering any PDF
 *   loadLogoAsDataUrl — Fetch logo as base64 to avoid CORS in PDF worker
 */

// ── Design tokens ─────────────────────────────────────────────────────────────
export { RPT, CERT, COLORS, FONT, FONT_SERIF, base } from './theme';

// ── Utilities ─────────────────────────────────────────────────────────────────
export { registerFonts } from './fonts';
export { loadLogoAsDataUrl } from './logoLoader';

// ── Shared components ─────────────────────────────────────────────────────────
export { default as BrandHeader } from './components/BrandHeader';
export { default as BrandFooter } from './components/BrandFooter';
export { default as AuditFooter } from './components/AuditFooter';
export { default as PageNumber } from './components/PageNumber';

// ── PDF documents ─────────────────────────────────────────────────────────────
export { ReportTablePDF, downloadReportPDF }      from './ReportTable';
export { FeeReceiptPDF, downloadFeeReceipt }      from './FeeReceipt';
export { FeeSummaryPDF, downloadFeeSummary }      from './FeeSummary';
export { CertificatePDF, downloadCertificate }    from './Certificate';
export { SalarySlipPDF, downloadSalarySlip }      from './SalarySlip';
export { IdentityCardPDF, downloadIdentityCards } from './IdentityCard';

// ── Types ─────────────────────────────────────────────────────────────────────
export type { ColDef, ReportTableProps }          from './ReportTable';
export type { IDCardPerson, IdentityCardProps }   from './IdentityCard';
export type { FeeSummaryProps }                   from './FeeSummary';
