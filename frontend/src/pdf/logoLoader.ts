/**
 * logoLoader.ts — Pre-fetch a sanstha logo and return a base64 data URL.
 *
 * react-pdf's internal image fetcher sometimes fails on localhost URLs
 * (cross-origin, auth headers, etc.).  By converting to base64 first we
 * hand react-pdf raw image bytes — no network call inside the PDF worker.
 */

import { mediaUrl } from '../api/client';

/** Convert a logo URL (relative or full S3 URL) → base64 data URL for PDF embedding */
export async function loadLogoAsDataUrl(logoUrl: string | null | undefined): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  const fullUrl = mediaUrl(logoUrl)!;
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
