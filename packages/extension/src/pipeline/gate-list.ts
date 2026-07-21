// Curated entertainment gate-list (spec 004 R4).
//
// A static, bundled list of ~50 distraction domains (video · social · gaming)
// that route straight to the quiz gate during study hours. This is the coarse
// fast path; fine-grained decisions come from the WASM classifier. Editable
// per-family later (spec 007 settings).
//
// NOTE: YouTube is deliberately ABSENT — it is handled channel-by-channel by the
// pipeline's YouTube step (spec 004A), which runs before this list. Putting
// youtube.com here would make the declarativeNetRequest (DNR) rules redirect
// even allowed study channels before the content script can resolve them.

/** Bare host suffixes; matched against a hostname and its subdomains. */
export const GATE_LIST: readonly string[] = [
  // --- video / streaming ---
  "netflix.com",
  "primevideo.com",
  "hotstar.com",
  "disneyplus.com",
  "hulu.com",
  "twitch.tv",
  "dailymotion.com",
  "vimeo.com",
  "jiocinema.com",
  "sonyliv.com",
  "zee5.com",
  "mxplayer.in",
  "voot.com",
  // --- social ---
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "snapchat.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "tumblr.com",
  "pinterest.com",
  "threads.net",
  "discord.com",
  "quora.com",
  "9gag.com",
  "imgur.com",
  // --- gaming ---
  "roblox.com",
  "epicgames.com",
  "fortnite.com",
  "store.steampowered.com",
  "steampowered.com",
  "miniclip.com",
  "poki.com",
  "crazygames.com",
  "y8.com",
  "addictinggames.com",
  "coolmathgames.com",
  "friv.com",
  "kongregate.com",
  "itch.io",
  "ign.com",
  "minecraft.net",
  "ea.com",
  "playstation.com",
  "xbox.com",
  "nintendo.com",
  "supercell.com",
  "king.com",
];

/** True when `host` equals `domain` or is a subdomain of it. */
export function hostMatches(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith("." + d);
}

/** True when a hostname is on the curated gate-list. */
export function isGateListed(host: string): boolean {
  return GATE_LIST.some((d) => hostMatches(host, d));
}

/** True when `host` matches any domain in `list` (used for pack allow_domains). */
export function hostInList(host: string, list: readonly string[]): boolean {
  return list.some((d) => hostMatches(host, d));
}
