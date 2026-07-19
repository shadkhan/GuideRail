// Bundled seed packs (spec 003 R5, amendment 003A A4/A5).
//
// These three JSON packs ship inside the extension — no network fetch (R7).
// esbuild inlines the JSON into the service-worker bundle; installSeedPacks()
// in ../loader.ts validates and installs them on onInstalled.
//
// TODO(003A A5 verification): the `channel_id` values in every seed pack are
// VISIBLE PLACEHOLDERS — format-valid (^UC[A-Za-z0-9_-]{22}$) but obviously
// fake (mostly zeros), NOT resolved against live YouTube. Before this pack is
// marked final, each channel must be replaced with its real UC… id via human
// curation (docs/pack-schema.md curation rule). Until then the 003A acceptance
// box "≥5 verified channels with correct channel_ids" stays unchecked.

import type { Pack } from "../types.js";
import cbseClass7 from "./cbse-class7.json";
import icseClass7 from "./icse-class7.json";
import homeschoolGeneral from "./homeschool-general.json";

export const SEED_PACKS: Pack[] = [
  cbseClass7 as Pack,
  icseClass7 as Pack,
  homeschoolGeneral as Pack,
];
