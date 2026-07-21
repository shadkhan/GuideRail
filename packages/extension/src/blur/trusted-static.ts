// Static trusted-origin set for synchronous blur activation (spec 006 R2).
//
// The blur activation decision must be made at document_start, BEFORE first
// paint — but the active pack's allow_domains and the spec-004 verdict cache live
// in async chrome.storage, unreadable synchronously. So the content script uses
// this BUNDLED set to recognize trusted study origins synchronously and NOT
// activate the blur at all on them (zero flash on e.g. Khan Academy).
//
// This list is the UNION of the three bundled seed packs' allow_domains (spec 003
// ships bundled packs only, R7), so every active pack's allow_domains is covered
// flash-free. `trusted-static.test.ts` asserts it stays a superset of the seed
// domains, catching drift. A verdict-cache "allow" origin NOT in any pack's
// allow_domains still flash-blurs once before the async reveal (can't be read
// synchronously) — disclosed in ADR-0011.

import { hostMatches } from "../pipeline/gate-list.js";

/** Union of the bundled seed packs' allow_domains (kept in sync via the test). */
export const TRUSTED_STATIC: readonly string[] = [
  "aglasem.com",
  "brainpop.com",
  "brilliant.org",
  "britannica.com",
  "byjus.com",
  "careerpower.in",
  "cbse.gov.in",
  "cbse.nic.in",
  "cbseacademic.nic.in",
  "cisce.org",
  "ck12.org",
  "corestandards.org",
  "cuemath.com",
  "desmos.com",
  "diksha.gov.in",
  "doubtnut.com",
  "ducksters.com",
  "education.com",
  "embibe.com",
  "extramarks.com",
  "geogebra.org",
  "gutenberg.org",
  "icseboards.com",
  "icsereferencenotes.com",
  "ixl.com",
  "jagranjosh.com",
  "khanacademy.org",
  "khanacademykids.org",
  "learncbse.in",
  "learnohub.com",
  "mathsisfun.com",
  "meritnation.com",
  "mycbseguide.com",
  "natgeokids.com",
  "ncert.nic.in",
  "nios.ac.in",
  "nptel.ac.in",
  "oercommons.org",
  "olympiadtester.com",
  "outschool.com",
  "physicswallah.live",
  "pw.live",
  "sciencekids.co.nz",
  "selfstudys.com",
  "shaalaa.com",
  "splashlearn.com",
  "storyweaver.org.in",
  "studyrankers.com",
  "successcds.net",
  "swayam.gov.in",
  "time4learning.com",
  "tiwariacademy.com",
  "topperlearning.com",
  "toppr.com",
  "unacademy.com",
  "vedantu.com",
  "wolframalpha.com",
];

export function isTrustedStatic(host: string): boolean {
  return TRUSTED_STATIC.some((d) => hostMatches(host, d));
}
