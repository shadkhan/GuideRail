// Pack loader suite (spec 003 R3/R4/R6). Storage-level behavior only — the
// classify path (which needs the WASM instance) is proven in seeds.test.ts.
// The global beforeEach (test/setup.ts) clears the mocked chrome.storage.

import { describe, it, expect } from "vitest";
import * as storage from "../storage.js";
import {
  installPack,
  installSeedPacks,
  listPacks,
  getActivePack,
  setActivePack,
  DEFAULT_PACK_ID,
} from "./loader.js";
import cbse from "./seeds/cbse-class7.json";
import icse from "./seeds/icse-class7.json";

const clone = (p: unknown) => structuredClone(p);

describe("installPack (R3/R4)", () => {
  it("installs and activates a valid pack atomically", async () => {
    const r = await installPack(clone(cbse));
    expect(r.ok).toBe(true);
    expect(await storage.getActivePackId()).toBe("cbse-class7");
    expect(await storage.getPack("cbse-class7")).toMatchObject({ id: "cbse-class7" });
  });

  it("keeps the previous pack when an update is invalid (never bricks)", async () => {
    await installPack(clone(cbse)); // active = cbse-class7
    const before = await storage.getPack("cbse-class7");

    const broken = clone(cbse) as Record<string, unknown>;
    broken.version = "not-semver";
    const r = await installPack(broken);

    expect(r.ok).toBe(false);
    // Previous pack survives untouched, still active.
    expect(await storage.getActivePackId()).toBe("cbse-class7");
    expect(await storage.getPack("cbse-class7")).toEqual(before);
  });
});

describe("list / get / set active (R6)", () => {
  it("lists installed packs", async () => {
    await installPack(clone(cbse));
    await installPack(clone(icse));
    const ids = (await listPacks()).map((p) => p.id).sort();
    expect(ids).toEqual(["cbse-class7", "icse-class7"]);
  });

  it("getActivePack returns the active pack object", async () => {
    await installPack(clone(cbse));
    const active = await getActivePack();
    expect(active).toMatchObject({ id: "cbse-class7", board: "CBSE" });
  });

  it("setActivePack switches among installed packs", async () => {
    await installPack(clone(cbse));
    await installPack(clone(icse)); // active becomes icse-class7
    await setActivePack("cbse-class7");
    expect(await storage.getActivePackId()).toBe("cbse-class7");
  });

  it("setActivePack rejects an unknown id (no silent deactivation)", async () => {
    await installPack(clone(cbse));
    await expect(setActivePack("no-such-pack")).rejects.toThrow();
    expect(await storage.getActivePackId()).toBe("cbse-class7"); // unchanged
  });
});

describe("installSeedPacks (R5)", () => {
  it("installs all three seeds and activates the default", async () => {
    await installSeedPacks();
    const ids = (await listPacks()).map((p) => p.id).sort();
    expect(ids).toEqual(["cbse-class7", "homeschool-general", "icse-class7"]);
    expect(await storage.getActivePackId()).toBe(DEFAULT_PACK_ID);
  });

  it("does not override an already-active pack", async () => {
    await installPack(clone(cbse)); // active = cbse-class7
    await installSeedPacks();
    expect(await storage.getActivePackId()).toBe("cbse-class7");
  });
});
