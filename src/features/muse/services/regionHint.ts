/** Cached soft region bias from the user's current network — never a fixed country. */
let cachedCountry: string | null | undefined;

/**
 * Best-effort country for geocode disambiguation (Paris vs namesakes, etc.).
 * Comes from the device network only — not hardcoded.
 */
export async function detectNetworkCountry(): Promise<string | null> {
  if (cachedCountry !== undefined) return cachedCountry;
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) {
      cachedCountry = null;
      return null;
    }
    const json = (await res.json()) as {
      success?: boolean;
      country?: string;
      country_code?: string;
    };
    if (json.success === false) {
      cachedCountry = null;
      return null;
    }
    cachedCountry = json.country?.trim() || json.country_code?.trim() || null;
    return cachedCountry;
  } catch {
    cachedCountry = null;
    return null;
  }
}
