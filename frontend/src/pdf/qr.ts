/**
 * qr.ts — Generate QR code data URLs for PDF documents
 * Uses the `qrcode` package (already installed).
 */
import QRCode from 'qrcode';

const FRONTEND_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FRONTEND_URL)
  || window?.location?.origin
  || 'http://localhost:5173';

/** Returns a base64 PNG data URL for the given URL string */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 80,
    margin: 1,
    color: { dark: '#1f3a8a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

/** Returns the public verification URL for a fee receipt */
export function receiptVerifyUrl(receiptNumber: string): string {
  return `${FRONTEND_BASE}/verify/receipt/${encodeURIComponent(receiptNumber)}`;
}

/** Returns the public verification URL for a certificate */
export function certVerifyUrl(certificateNumber: string): string {
  return `${FRONTEND_BASE}/verify/cert/${encodeURIComponent(certificateNumber)}`;
}
