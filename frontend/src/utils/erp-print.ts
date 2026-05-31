/**
 * erp-print.ts — Unified branded print utility for SMS ERP
 *
 * Single source of truth for ALL print surfaces:
 *   - Fee receipts & ledger
 *   - Certificates (TC, Bonafide, Character, …)
 *   - Timetable
 *   - Accounts voucher / cash book
 *   - All 14 report types
 *   - Salary slips
 *
 * Usage:
 *   import { brandHeader, BRAND_CSS, openPrint, printGenericTable } from '../../utils/erp-print';
 */

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { mediaUrl } from '../api/client';

/** Generate a short unique report serial: e.g. "RPT-1K3F2A" */
function reportSerial(): string {
  return 'RPT-' + Date.now().toString(36).toUpperCase().slice(-6);
}

/** Escape user-entered strings before inserting into document.write HTML */
function esc(val: unknown): string {
  if (val === null || val === undefined) return '—';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Branded CSS (shared by every print popup) ─────────────────────────────────
// Direction 3 design tokens (mirrors theme.ts RPT object)
const D3 = {
  ink:         '#15181f',
  inkSoft:     '#5b626f',
  muted:       '#8b94a3',
  accent:      '#1f3a8a',
  accentLight: '#2f56c4',
  tint:        '#eef1f9',
  rule:        '#e4e7ee',
  ruleStrong:  '#c9cedb',
  rowEven:     '#f7f9fe',
  success:     '#1a7a48',
  successBg:   '#d4f0e3',
  danger:      '#c0392b',
  warning:     '#b45309',
};

export const BRAND_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap');
  *  { box-sizing: border-box; }
  body {
    font-family: 'Noto Sans Devanagari', sans-serif;
    font-size: 13px;
    color: ${D3.ink};
    margin: 0;
    padding: 0;
  }
  .page { max-width: 740px; margin: 0 auto; padding: 20px 24px; }

  /* ── Header: full-centered cert-style (logo → name → address → line·dot·line) ── */
  .brand-header {
    text-align: center;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .brand-header .logo {
    width: 52px; height: 52px; object-fit: contain;
    display: block; margin: 0 auto 8px;
  }
  .brand-header .logo-placeholder {
    width: 52px; height: 52px; border-radius: 50%;
    background: ${D3.accent}; display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 700; color: #fff; margin: 0 auto 8px;
  }
  .brand-header .sanstha-name {
    font-family: 'Noto Serif Devanagari', serif;
    font-size: 19px; font-weight: 700; color: ${D3.ink}; line-height: 1.2;
  }
  .brand-header .unit-name {
    font-size: 12px; font-weight: 600; color: ${D3.accent}; margin-top: 3px;
  }
  .brand-header .addr-line { font-size: 10px; color: ${D3.inkSoft}; margin-top: 3px; }
  .brand-header .meta-line { font-size: 9px;  color: ${D3.muted};   margin-top: 2px; }
  /* decorative divider: line · dot · line */
  .brand-header .divider {
    display: flex; align-items: center; gap: 6px;
    margin: 10px auto 0; max-width: 480px;
  }
  .brand-header .div-line {
    flex: 1; border-top: 1.5px solid ${D3.accent};
  }
  .brand-header .div-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: ${D3.accent}; flex-shrink: 0;
  }

  /* ── Document title ── */
  .doc-title {
    display: inline-flex; align-items: center;
    background: ${D3.accent}; color: #fff;
    padding: 4px 16px; border-radius: 2px;
    font-size: 13px; font-weight: 700; letter-spacing: 0.8px;
    margin-bottom: 10px;
  }
  .doc-title-plain {
    font-family: 'Noto Serif Devanagari', serif;
    font-size: 17px; font-weight: 700;
    color: ${D3.accent}; margin: 10px 0 4px;
    border-bottom: 2px solid ${D3.accent};
    padding-bottom: 6px;
  }

  /* ── Meta chips ── */
  .meta-row {
    display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;
    font-size: 10px; color: ${D3.inkSoft};
  }
  .meta-chip {
    background: ${D3.tint}; border: 1px solid ${D3.rule};
    padding: 2px 8px; border-radius: 2px;
    color: ${D3.accent}; font-weight: 600;
  }

  /* ── Info grid ── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 8px 0; }
  .info-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
  .info-grid.cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .info-item {
    background: ${D3.tint}; padding: 6px 10px;
    border-left: 3px solid ${D3.accentLight};
  }
  .info-label { font-size: 9px; color: ${D3.muted}; letter-spacing: 0.3px; margin-bottom: 2px; }
  .info-value {
    font-family: 'Noto Serif Devanagari', serif;
    font-size: 13px; font-weight: 700; color: ${D3.ink};
  }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th {
    background: ${D3.accent}; color: #fff;
    padding: 5px 8px; font-weight: 700; font-size: 11px;
    white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.15);
    letter-spacing: 0.3px;
  }
  td { padding: 5px 8px; border: 1px solid ${D3.rule}; font-size: 11.5px; }
  table.data td.lbl { font-weight: 700; width: 42%; background: ${D3.tint}; }
  tr.even td { background: ${D3.rowEven}; }
  tr.total-row td {
    background: ${D3.tint}; font-weight: 700; font-size: 13px;
    border-top: 1.5px solid ${D3.accent}; color: ${D3.accent};
  }

  /* ── Typography ── */
  .right  { text-align: right; }
  .center { text-align: center; }
  .bold   { font-weight: 700; }
  .red    { color: ${D3.danger}; }
  .green  { color: ${D3.success}; }
  .blue   { color: ${D3.accent}; }
  .big    { font-size: 16px; font-weight: 700; }
  .serif  { font-family: 'Noto Serif Devanagari', serif; }
  .words  { font-size: 11px; font-style: italic; color: #333; margin-top: 4px; }
  .muted  { color: ${D3.muted}; font-size: 10px; }

  /* ── Signature / seal row ── */
  .sign-row { display: flex; justify-content: space-between; margin-top: 28px; padding-top: 4px; }
  .sign     { text-align: center; min-width: 110px; }
  .sign-line {
    border-top: 1px solid ${D3.ink}; margin-bottom: 4px; margin-top: 32px;
    font-family: 'Noto Serif Devanagari', serif; font-weight: 700;
  }
  .sign-label { font-size: 11px; color: ${D3.ink}; font-weight: 600; }
  .sign-sub   { font-size: 9px; color: ${D3.muted}; margin-top: 2px; }
  .seal-box {
    width: 80px; height: 80px; border: 1.5px dashed ${D3.ruleStrong};
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: ${D3.muted}; margin: 0 auto;
  }
  .sign-note {
    display: flex; justify-content: space-between;
    font-size: 9px; color: ${D3.muted};
    border-top: 1px solid ${D3.rule}; padding-top: 6px; margin-top: 8px;
  }

  /* ── Receipt-specific ── */
  .receipt-bar {
    background: ${D3.accent}; color: #fff;
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px; margin-bottom: 10px;
  }
  .receipt-title { font-family: 'Noto Serif Devanagari', serif; font-size: 16px; font-weight: 700; }
  .receipt-sub   { font-size: 8px; color: rgba(255,255,255,0.6); letter-spacing: 1.5px; margin-top: 2px; }
  .receipt-no    { font-size: 13px; font-weight: 700; color: #FFD700; }
  .receipt-date  {
    background: rgba(255,255,255,0.15);
    padding: 2px 8px; font-size: 10px; margin-top: 3px; display: inline-block;
  }
  .paid-badge {
    background: ${D3.successBg}; border: 1px solid ${D3.success};
    color: ${D3.success}; font-weight: 700; font-size: 10px;
    padding: 3px 10px; border-radius: 2px; margin-top: 4px; display: inline-block;
  }
  .receipt-total {
    background: ${D3.accent}; color: #fff;
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; margin: 0 0 8px;
  }
  .total-label { font-size: 10px; color: rgba(255,255,255,0.7); margin-bottom: 2px; }
  .total-value {
    font-family: 'Noto Serif Devanagari', serif;
    font-size: 22px; font-weight: 700; color: #FFD700;
  }
  .mode-pill {
    background: ${D3.successBg}; border: 1px solid ${D3.success};
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 2px; font-size: 10px;
  }
  .mode-dot { width: 7px; height: 7px; border-radius: 50%; background: ${D3.success}; }
  .mode-text { font-weight: 700; color: ${D3.success}; }
  .cut-line {
    border: none; border-top: 1px dashed ${D3.ruleStrong};
    margin: 12px 0; position: relative;
  }
  .cut-line::before {
    content: '✂'; position: absolute; left: 50%;
    transform: translateX(-50%) translateY(-50%);
    background: #fff; padding: 0 6px; font-size: 12px; color: ${D3.muted};
  }

  /* ── Alert boxes ── */
  .alert-warning {
    background: #fef3c7; border: 1px solid #fde68a;
    padding: 8px 12px; border-radius: 2px; margin-top: 8px;
    font-size: 12px; border-left: 3px solid ${D3.warning};
  }
  .alert-success {
    background: ${D3.successBg}; border: 1px solid #6ee7b7;
    padding: 8px 12px; border-radius: 2px; margin-top: 8px;
    font-size: 12px; border-left: 3px solid ${D3.success};
  }

  /* ── Print button ── */
  .print-btn {
    display: block; margin: 14px auto 0; padding: 9px 28px;
    background: ${D3.accent}; color: #fff; border: none; border-radius: 3px;
    cursor: pointer; font-size: 13px; font-family: inherit;
  }

  /* ── Summary line ── */
  .summary-line {
    font-size: 11px; font-weight: 600; margin-top: 6px;
    text-align: right; color: ${D3.accent};
  }

  /* ── Footer strip ── */
  .footer-strip {
    margin-top: 20px; display: flex; justify-content: space-between;
    font-size: 10px; color: ${D3.muted};
    border-top: 1px solid ${D3.rule}; padding-top: 8px;
  }

  /* ── Audit footer ── */
  .audit-footer {
    margin-top: 14px; background: ${D3.tint};
    border: 1px solid ${D3.rule}; padding: 5px 12px;
    font-size: 9.5px; color: ${D3.muted};
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;
  }
  .audit-footer span { white-space: nowrap; }

  /* ── Salary slip ── */
  .slip-section { margin: 10px 0; }
  .slip-section-title {
    font-weight: 700; font-size: 11px; color: #fff;
    background: ${D3.accent}; padding: 4px 8px; margin-bottom: 0;
  }
  .slip-section-title.deductions { background: ${D3.danger}; }
  .slip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .slip-grid table { margin: 0; }
  .slip-total {
    background: ${D3.accent}; color: #fff;
    font-weight: 700; font-size: 13px;
    padding: 8px 12px; margin-top: 8px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .slip-net { font-size: 18px; color: #FFD700; font-family: 'Noto Serif Devanagari', serif; }

  /* ── Cash book ── */
  td.debit   { color: ${D3.danger};  font-weight: 600; }
  td.credit  { color: ${D3.success}; font-weight: 600; }
  td.balance { font-weight: 700; color: ${D3.accent}; }
  tr.day-total td {
    background: ${D3.tint}; font-weight: 700;
    border-top: 1.5px solid ${D3.accent};
  }

  @media print {
    .no-print { display: none !important; }
    .print-btn { display: none !important; }
    body { padding: 0; }
    .page { padding: 12px 16px; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    @page { size: A4; margin: 14mm 12mm; }
  }
`;

// ── Brand Header ──────────────────────────────────────────────────────────────
/**
 * Returns the HTML string for the branded school header.
 * @param sanstha  Sanstha entity (nameMr, logoUrl, addressMr, phone, email, ptrNumber)
 * @param unit     Unit entity  (nameMr, address, udiseCode, recognitionNumber) — optional
 */
export function brandHeader(sanstha?: any, unit?: any): string {
  if (!sanstha) return '';

  const logoUrl = mediaUrl(sanstha.logoUrl);
  const initial = sanstha.nameMr?.charAt(0) || 'श';

  const logoHtml = logoUrl
    ? `<img class="logo" src="${logoUrl}" alt="शाळा लोगो"/>`
    : `<div class="logo-placeholder">${initial}</div>`;

  const unitHtml = unit?.nameMr && unit.nameMr !== sanstha.nameMr
    ? `<div class="unit-name">${unit.nameMr}</div>`
    : '';

  const addrParts: string[] = [];
  if (unit?.address) addrParts.push(unit.address);
  else if (sanstha.addressMr) addrParts.push(sanstha.addressMr);
  if (sanstha.phone) addrParts.push(`दूरध्वनी: ${sanstha.phone}`);
  const addrHtml = addrParts.length
    ? `<div class="addr-line">${addrParts.join(' | ')}</div>`
    : '';

  const metaParts: string[] = [];
  if (unit?.udiseCode)          metaParts.push(`UDISE: ${unit.udiseCode}`);
  if (unit?.recognitionNumber)  metaParts.push(`मान्यता क्र.: ${unit.recognitionNumber}`);
  if (sanstha.ptrNumber)        metaParts.push(`PTR: ${sanstha.ptrNumber}`);
  const metaHtml = metaParts.length
    ? `<div class="meta-line">${metaParts.join(' · ')}</div>`
    : '';

  return `
    <div class="brand-header">
      ${logoHtml}
      <div class="sanstha-name">${sanstha.nameMr || ''}</div>
      ${unitHtml}
      ${addrHtml}
      ${metaHtml}
      <div class="divider">
        <div class="div-line"></div>
        <div class="div-dot"></div>
        <div class="div-line"></div>
      </div>
    </div>`;
}

// ── Brand Footer (seal + signatures) ─────────────────────────────────────────
export function brandFooter(
  signatures: { label: string; sub?: string; isSeal?: boolean }[] = [
    { label: 'संस्थेचा शिक्का', isSeal: true },
    { label: 'शुल्क संकलक', sub: 'सही' },
    { label: 'मुख्याध्यापक', sub: 'सही व शिक्का' },
  ],
  note?: string,
): string {
  const sigs = signatures.map(s =>
    s.isSeal
      ? `<div class="sign">
           <div class="seal-box">शिक्का</div>
           <div class="sign-label">${s.label}</div>
         </div>`
      : `<div class="sign">
           <div class="sign-line"></div>
           <div class="sign-label">${s.label}</div>
           ${s.sub ? `<div class="sign-sub">${s.sub}</div>` : ''}
         </div>`
  ).join('');
  const noteHtml = note
    ? `<div class="sign-note"><span>${note}</span></div>`
    : `<div class="sign-note"><span>हे दस्तऐवज संगणकीय प्रणालीद्वारे तयार करण्यात आले आहे.</span></div>`;
  return `<div class="sign-row">${sigs}</div>${noteHtml}`;
}

// ── Audit Footer ──────────────────────────────────────────────────────────────
/** Returns HTML for audit trail footer. Pass auditUser from auth store. */
export function auditFooter(auditUser?: string, serial?: string): string {
  const now = dayjs().format('DD/MM/YYYY HH:mm:ss');
  const user = auditUser || 'प्रणाली';
  const id   = serial || reportSerial();
  return `
    <div class="audit-footer">
      <span>📅 मुद्रित: ${now}</span>
      <span>👤 वापरकर्ता: ${user}</span>
      <span>🔢 अहवाल क्र.: ${id}</span>
    </div>`;
}

// ── Open print window — opens as full new tab via Blob URL (no popup, no auto-print) ──
export function openPrint(html: string, _size?: string): void {
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  // Revoke after tab has time to load
  if (tab) setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ── Generic table print (used by Reports page) ────────────────────────────────
export function printGenericTable(
  title: string,
  cols: { title: string; key: string; align?: string }[],
  rows: any[],
  sanstha?: any,
  unit?: any,
  extra?: { label: string; value: string }[],
  footerNote?: string,
  auditUser?: string,
): void {
  if (!rows.length) { alert('मुद्रणासाठी डेटा नाही'); return; }

  const serial = reportSerial();

  const th = cols.map(c =>
    `<th style="text-align:${c.align || 'left'}">${c.title}</th>`
  ).join('');

  const tbody = rows.map((r, i) =>
    `<tr class="${i % 2 === 0 ? 'even' : ''}">${
      cols.map(c => `<td style="text-align:${c.align || 'left'}">${esc(r[c.key])}</td>`).join('')
    }</tr>`
  ).join('');

  const extraHtml = (extra || [])
    .map(e => `<span class="meta-chip"><b>${e.label}:</b> ${e.value}</span>`)
    .join('');

  const html = `<html><head><meta charset="UTF-8"/><title>${title}</title>
<style>${BRAND_CSS}</style></head><body>
<div class="page">
  ${brandHeader(sanstha, unit)}
  <div class="doc-title-plain">${title}</div>
  <div class="meta-row">
    <span class="meta-chip">📅 दिनांक: ${dayjs().format('DD/MM/YYYY')}</span>
    <span class="meta-chip">⏰ वेळ: ${dayjs().format('HH:mm')}</span>
    <span class="meta-chip">🔢 एकूण नोंदी: ${rows.length}</span>
    ${extraHtml}
  </div>
  <table><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table>
  <div class="summary-line">एकूण ${rows.length} नोंदी</div>
  ${footerNote ? `<div class="meta-line" style="margin-top:6px">* ${footerNote}</div>` : ''}
  ${brandFooter()}
  ${auditFooter(auditUser, serial)}
  <button class="print-btn no-print" onclick="window.print()">📄 PDF म्हणून जतन करा</button>
</div>

</body></html>`;

  openPrint(html);
}

// ── Salary slip print ─────────────────────────────────────────────────────────
const MONTH_NAMES_MR = [
  'जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर',
];

export function printSalarySlip(
  slip: {
    month: number; year: number; grossSalary: number; totalDeduction: number; netSalary: number;
    earnings?: { nameMr: string; amount: number }[];
    deductions?: { nameMr: string; amount: number }[];
    paymentDate?: string; paymentMode?: string; status?: string;
  },
  staff: { nameMr?: string; designation?: string; employeeCode?: string } | null,
  sanstha?: any,
  unit?: any,
  auditUser?: string,
): void {
  const serial = reportSerial();
  const monthLabel = MONTH_NAMES_MR[(slip.month ?? 1) - 1];
  const earnings   = slip.earnings   || [];
  const deductions = slip.deductions || [];

  const earningsRows = earnings.map((e, i) =>
    `<tr class="${i % 2 === 0 ? 'even' : ''}"><td>${e.nameMr}</td><td class="right">₹ ${Number(e.amount).toLocaleString('en-IN')}</td></tr>`
  ).join('') || '<tr><td colspan="2" class="center">—</td></tr>';

  const deductionRows = deductions.map((d, i) =>
    `<tr class="${i % 2 === 0 ? 'even' : ''}"><td>${d.nameMr}</td><td class="right red">₹ ${Number(d.amount).toLocaleString('en-IN')}</td></tr>`
  ).join('') || '<tr><td colspan="2" class="center">—</td></tr>';

  const html = `<html><head><meta charset="UTF-8"/><title>वेतन स्लिप</title>
<style>${BRAND_CSS}</style></head><body>
<div class="page">
  ${brandHeader(sanstha, unit)}
  <div class="doc-title-plain">वेतन स्लिप — ${monthLabel} ${slip.year}</div>

  <div class="info-grid cols-3" style="margin-bottom:12px">
    <div class="info-item"><div class="info-label">कर्मचारी नाव</div><div class="info-value">${staff?.nameMr || '—'}</div></div>
    <div class="info-item"><div class="info-label">पद</div><div class="info-value">${staff?.designation || '—'}</div></div>
    <div class="info-item"><div class="info-label">कर्मचारी कोड</div><div class="info-value">${staff?.employeeCode || '—'}</div></div>
    <div class="info-item"><div class="info-label">वेतन माह</div><div class="info-value">${monthLabel} ${slip.year}</div></div>
    <div class="info-item"><div class="info-label">भुगतान दिनांक</div><div class="info-value">${slip.paymentDate ? dayjs(slip.paymentDate).format('DD/MM/YYYY') : '—'}</div></div>
    <div class="info-item"><div class="info-label">भुगतान पद्धत</div><div class="info-value">${slip.paymentMode || '—'}</div></div>
  </div>

  <div class="slip-grid">
    <div>
      <div class="slip-section-title">उत्पन्न घटक (Earnings)</div>
      <table><thead><tr><th>घटक</th><th style="text-align:right">रक्कम</th></tr></thead>
      <tbody>${earningsRows}</tbody></table>
    </div>
    <div>
      <div class="slip-section-title">कपात घटक (Deductions)</div>
      <table><thead><tr><th>घटक</th><th style="text-align:right">रक्कम</th></tr></thead>
      <tbody>${deductionRows}</tbody></table>
    </div>
  </div>

  <div class="slip-total">
    <span>एकूण उत्पन्न: ₹ ${Number(slip.grossSalary).toLocaleString('en-IN')}</span>
    <span>एकूण कपात: ₹ ${Number(slip.totalDeduction).toLocaleString('en-IN')}</span>
    <span style="font-size:16px">निव्वळ वेतन: ₹ ${Number(slip.netSalary).toLocaleString('en-IN')}</span>
  </div>

  ${brandFooter([
    { label: 'संस्थेचा शिक्का', isSeal: true },
    { label: 'कर्मचारी स्वाक्षरी' },
    { label: 'मुख्याध्यापक' },
  ])}
  ${auditFooter(auditUser, serial)}
  <button class="print-btn no-print" onclick="window.print()">📄 PDF म्हणून जतन करा</button>
</div>

</body></html>`;

  openPrint(html);
}

// ── Cash book print ───────────────────────────────────────────────────────────
export interface CashBookRow {
  date: string;
  voucherNumber?: string;
  descriptionMr?: string;
  type: 'income' | 'expense';
  amount: number;
  balance?: number;
}

export function printCashBook(
  rows: CashBookRow[],
  openingBalance: number,
  sanstha?: any,
  unit?: any,
  dateRange?: { from: string; to: string },
  auditUser?: string,
): void {
  if (!rows.length) { alert('मुद्रणासाठी डेटा नाही'); return; }

  const serial = reportSerial();

  // Compute running balance
  let running = openingBalance;
  const tableRows = rows.map((r, i) => {
    const isDebit  = r.type === 'expense';
    const isCredit = r.type === 'income';
    if (isCredit) running += r.amount;
    else          running -= r.amount;
    return `<tr class="${i % 2 === 0 ? 'even' : ''}">
      <td>${dayjs(r.date).format('DD/MM/YYYY')}</td>
      <td>${r.voucherNumber || '—'}</td>
      <td>${r.descriptionMr || '—'}</td>
      <td class="right credit">${isCredit ? '₹ ' + r.amount.toLocaleString('en-IN') : ''}</td>
      <td class="right debit">${isDebit  ? '₹ ' + r.amount.toLocaleString('en-IN') : ''}</td>
      <td class="right balance">₹ ${running.toLocaleString('en-IN')}</td>
    </tr>`;
  }).join('');

  const dateRangeHtml = dateRange
    ? `<span class="meta-chip">📅 ${dayjs(dateRange.from).format('DD/MM/YYYY')} ते ${dayjs(dateRange.to).format('DD/MM/YYYY')}</span>`
    : '';

  const totalIncome  = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  const html = `<html><head><meta charset="UTF-8"/><title>रोखवही</title>
<style>${BRAND_CSS}</style></head><body>
<div class="page">
  ${brandHeader(sanstha, unit)}
  <div class="doc-title-plain">रोखवही (Cash Book)</div>
  <div class="meta-row">
    ${dateRangeHtml}
    <span class="meta-chip">प्रारंभिक शिल्लक: ₹ ${openingBalance.toLocaleString('en-IN')}</span>
    <span class="meta-chip">एकूण नोंदी: ${rows.length}</span>
  </div>
  <table>
    <thead><tr>
      <th>दिनांक</th>
      <th>व्हाउचर क्र.</th>
      <th>विवरण</th>
      <th style="text-align:right">जमा (Credit)</th>
      <th style="text-align:right">नावे (Debit)</th>
      <th style="text-align:right">शिल्लक</th>
    </tr></thead>
    <tbody>
      <tr><td colspan="3" class="bold">प्रारंभिक शिल्लक</td><td class="right credit">₹ ${openingBalance.toLocaleString('en-IN')}</td><td></td><td class="right balance">₹ ${openingBalance.toLocaleString('en-IN')}</td></tr>
      ${tableRows}
      <tr class="total-row">
        <td colspan="3" class="bold">एकूण</td>
        <td class="right credit">₹ ${totalIncome.toLocaleString('en-IN')}</td>
        <td class="right debit">₹ ${totalExpense.toLocaleString('en-IN')}</td>
        <td class="right balance">₹ ${running.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>
  ${brandFooter([
    { label: 'संस्थेचा शिक्का', isSeal: true },
    { label: 'कोषाध्यक्ष' },
    { label: 'मुख्याध्यापक' },
  ])}
  ${auditFooter(auditUser, serial)}
  <button class="print-btn no-print" onclick="window.print()">📄 PDF म्हणून जतन करा</button>
</div>

</body></html>`;

  openPrint(html);
}

// ── Audit / summary report print ─────────────────────────────────────────────
export function printAuditReport(
  reportType: string,
  rows: any[],
  summary: { totalIncome: number; totalExpense: number; balance: number; period?: string },
  sanstha?: any,
  unit?: any,
  auditUser?: string,
): void {
  const serial = reportSerial();

  const summaryHtml = `
    <div class="info-grid cols-3" style="margin:12px 0">
      <div class="info-item" style="border-left:4px solid #27AE60">
        <div class="info-label">एकूण जमा</div>
        <div class="info-value green">₹ ${summary.totalIncome.toLocaleString('en-IN')}</div>
      </div>
      <div class="info-item" style="border-left:4px solid #E74C3C">
        <div class="info-label">एकूण खर्च</div>
        <div class="info-value red">₹ ${summary.totalExpense.toLocaleString('en-IN')}</div>
      </div>
      <div class="info-item" style="border-left:4px solid #1A3A5C">
        <div class="info-label">निव्वळ शिल्लक</div>
        <div class="info-value blue">₹ ${summary.balance.toLocaleString('en-IN')}</div>
      </div>
    </div>`;

  const categoryTotals: Record<string, { income: number; expense: number }> = {};
  rows.forEach(r => {
    const cat = r.category || r.categoryMr || 'इतर';
    if (!categoryTotals[cat]) categoryTotals[cat] = { income: 0, expense: 0 };
    if (r.type === 'income')  categoryTotals[cat].income  += Number(r.amount) || 0;
    else                      categoryTotals[cat].expense += Number(r.amount) || 0;
  });

  const catRows = Object.entries(categoryTotals).map(([cat, v], i) =>
    `<tr class="${i % 2 === 0 ? 'even' : ''}">
      <td>${cat}</td>
      <td class="right green">₹ ${v.income.toLocaleString('en-IN')}</td>
      <td class="right red">₹ ${v.expense.toLocaleString('en-IN')}</td>
      <td class="right bold">₹ ${(v.income - v.expense).toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  const html = `<html><head><meta charset="UTF-8"/><title>लेखापरीक्षण अहवाल</title>
<style>${BRAND_CSS}</style></head><body>
<div class="page">
  ${brandHeader(sanstha, unit)}
  <div class="doc-title-plain">${reportType} — लेखापरीक्षण अहवाल</div>
  <div class="meta-row">
    <span class="meta-chip">📅 ${dayjs().format('DD/MM/YYYY')}</span>
    ${summary.period ? `<span class="meta-chip">📆 कालावधी: ${summary.period}</span>` : ''}
    <span class="meta-chip">🔢 एकूण नोंदी: ${rows.length}</span>
  </div>
  ${summaryHtml}
  <div class="doc-title-plain" style="font-size:13px;margin-top:14px">प्रकारनिहाय सारांश</div>
  <table>
    <thead><tr>
      <th>प्रकार</th>
      <th style="text-align:right">जमा</th>
      <th style="text-align:right">खर्च</th>
      <th style="text-align:right">शिल्लक</th>
    </tr></thead>
    <tbody>${catRows}</tbody>
  </table>
  ${brandFooter([
    { label: 'संस्थेचा शिक्का', isSeal: true },
    { label: 'कोषाध्यक्ष' },
    { label: 'मुख्याध्यापक' },
  ])}
  ${auditFooter(auditUser, serial)}
  <button class="print-btn no-print" onclick="window.print()">📄 PDF म्हणून जतन करा</button>
</div>

</body></html>`;

  openPrint(html);
}

// ── Excel export ──────────────────────────────────────────────────────────────
export function exportToExcel(
  cols: { title: string; key: string }[],
  rows: any[],
  filename: string,
): void {
  if (!rows.length) { alert('निर्यातीसाठी डेटा नाही'); return; }
  const header = cols.map(c => c.title);
  const data   = rows.map(r => cols.map(c => r[c.key] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = header.map(h => ({ wch: Math.max(h.length + 4, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'अहवाल');
  XLSX.writeFile(wb, `${filename}-${dayjs().format('YYYYMMDD')}.xlsx`);
}
