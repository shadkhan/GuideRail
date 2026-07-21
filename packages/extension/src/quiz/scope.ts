// Earned-time scope = the "origin-group" a token unlocks (spec 005 R4).
//
// We group by registrable domain so earning time on m.youtube.com unlocks
// www.youtube.com too (004A A4: "earned time opens all of YouTube"). This is a
// small heuristic, NOT the full Public Suffix List (too heavy for the bundle):
// two labels normally, three when the domain sits under a known second-level
// label of a two-letter ccTLD (e.g. diksha.gov.in).

const CC_SECOND_LEVEL = new Set([
  "co",
  "gov",
  "nic",
  "ac",
  "org",
  "net",
  "edu",
  "firm",
  "gen",
  "ind",
  "res",
]);

export function registrableDomain(host: string): string {
  const parts = host.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const tld = parts[parts.length - 1]!;
  const sld = parts[parts.length - 2]!;
  if (tld.length === 2 && CC_SECOND_LEVEL.has(sld)) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

/** Scope for a full URL (host → registrable domain), or null if unparseable. */
export function scopeOf(url: string): string | null {
  try {
    return registrableDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}
