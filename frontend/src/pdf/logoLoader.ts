/**
 * logoLoader.ts — Pre-fetch a sanstha logo and return a base64 data URL.
 *
 * react-pdf's internal image fetcher sometimes fails on localhost URLs
 * (cross-origin, auth headers, etc.).  By converting to base64 first we
 * hand react-pdf raw image bytes — no network call inside the PDF worker.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

/** Convert a relative logo path (e.g. /uploads/logo-x.png) → base64 data URL */
export async function loadLogoAsDataUrl(logoUrl: string | null | undefined): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${API_BASE}${logoUrl}`;
  try {
    const res = await fetch(fullUrl);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
