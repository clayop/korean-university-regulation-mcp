import { UNIVERSITIES, getUniversityBaseUrl } from "./universities.js";

const cache = new Map<string, string>();

function cacheKey(universityId: string, seqHistory: number): string {
  return `${universityId}:${seqHistory}`;
}

/**
 * Fetch regulation HTML by university and SEQ_HISTORY id.
 */
export async function fetchRegulationHtml(
  universityId: string,
  seqHistory: number,
): Promise<string | null> {
  const key = cacheKey(universityId, seqHistory);
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const uni = UNIVERSITIES[universityId];
  if (!uni) return null;

  const baseUrl = getUniversityBaseUrl(uni);
  const url = `${baseUrl}?SEQ_HISTORY=${seqHistory}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "korean-university-regulation-mcp/0.2.0",
      Accept: "text/html",
    },
  });

  if (!res.ok) return null;

  const html = await res.text();
  if (!html.includes('class="lawname"')) return null;

  cache.set(key, html);
  return html;
}

/**
 * Quickly check if a SEQ_HISTORY has content.
 */
export async function probeRegulationName(
  universityId: string,
  seqHistory: number,
): Promise<string | null> {
  const html = await fetchRegulationHtml(universityId, seqHistory);
  if (!html) return null;

  const match = html.match(/class="lawname"[^>]*?>([^<]+)</);
  if (!match) return null;

  return match[1].trim().replace(/\s+/g, " ");
}
