// Editable gate-list (spec 007 R3). The static base (pipeline/gate-list.ts) plus a
// per-family override layer: effective = base ∪ added − removed. Both enforcement
// paths (the worker's DNR reconcile and the pipeline gate check) read the
// effective list, so a parent's add/remove takes effect everywhere.

import * as storage from "../storage.js";
import type { GateListOverrides } from "../storage.js";
import { GATE_LIST, hostMatches } from "../pipeline/gate-list.js";

const EMPTY: GateListOverrides = { added: [], removed: [] };

export async function getOverrides(): Promise<GateListOverrides> {
  return (await storage.get("config.gateListOverrides")) ?? { ...EMPTY };
}

/** The gate-list actually in force: base ∪ added − removed. */
export async function effectiveGateList(): Promise<string[]> {
  const { added, removed } = await getOverrides();
  const removedSet = new Set(removed);
  const out = new Set<string>();
  for (const d of GATE_LIST) if (!removedSet.has(d)) out.add(d);
  for (const d of added) if (!removedSet.has(d)) out.add(d);
  return [...out];
}

export async function addGateDomain(domain: string): Promise<void> {
  const d = domain.trim().toLowerCase();
  const o = await getOverrides();
  const added = new Set(o.added);
  added.add(d);
  const removed = o.removed.filter((x) => x !== d); // adding un-does a prior removal
  await storage.set("config.gateListOverrides", { added: [...added], removed });
}

export async function removeGateDomain(domain: string): Promise<void> {
  const d = domain.trim().toLowerCase();
  const o = await getOverrides();
  const added = o.added.filter((x) => x !== d); // drop from user-added
  const removed = new Set(o.removed);
  if (GATE_LIST.includes(d)) removed.add(d); // only base entries need a removal marker
  await storage.set("config.gateListOverrides", { added, removed: [...removed] });
}

/** True when `host` is on `domains` (or a subdomain) — used with the effective list. */
export function isGateListedIn(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => hostMatches(host, d));
}
