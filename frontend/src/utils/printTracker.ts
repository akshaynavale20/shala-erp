/**
 * printTracker.ts — localStorage-based "first print" tracker.
 *
 * Tracks whether a receipt/certificate has ever been printed on this device.
 * First print = original. Any subsequent print = DUPLICATE.
 *
 * Keys:
 *   erp_printed_receipts  → { [receiptId]: timestamp }
 *   erp_printed_certs     → { [certId]:    timestamp }
 */

const RECEIPT_KEY = 'erp_printed_receipts';
const CERT_KEY    = 'erp_printed_certs';

function read(key: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function write(key: string, data: Record<string, number>) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota exceeded — ignore */ }
}

// ── Receipts ──────────────────────────────────────────────────────────────────
export function isReceiptPrinted(id: string): boolean {
  return !!read(RECEIPT_KEY)[id];
}
export function markReceiptPrinted(id: string): void {
  const d = read(RECEIPT_KEY);
  d[id] = Date.now();
  write(RECEIPT_KEY, d);
}
export function getReceiptPrintedAt(id: string): Date | null {
  const ts = read(RECEIPT_KEY)[id];
  return ts ? new Date(ts) : null;
}

// ── Certificates ──────────────────────────────────────────────────────────────
export function isCertPrinted(id: string): boolean {
  return !!read(CERT_KEY)[id];
}
export function markCertPrinted(id: string): void {
  const d = read(CERT_KEY);
  d[id] = Date.now();
  write(CERT_KEY, d);
}
export function getCertPrintedAt(id: string): Date | null {
  const ts = read(CERT_KEY)[id];
  return ts ? new Date(ts) : null;
}
