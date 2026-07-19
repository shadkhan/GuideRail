// Vitest setup: a minimal `chrome` mock so the extension modules run under Node.
//
// chrome.storage.local is backed by a Map with the same promise-based get/set/
// remove/clear surface the extension uses; runtime.getURL returns a stable fake
// URL. The store is cleared before each test for isolation.

import { beforeEach, vi } from "vitest";

class FakeStorageArea {
  private store = new Map<string, unknown>();

  async get(keys?: string | string[] | Record<string, unknown> | null) {
    if (keys == null) return Object.fromEntries(this.store);
    const names =
      typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
    const out: Record<string, unknown> = {};
    for (const k of names) if (this.store.has(k)) out[k] = this.store.get(k);
    return out;
  }

  async set(items: Record<string, unknown>) {
    for (const [k, v] of Object.entries(items)) this.store.set(k, v);
  }

  async remove(keys: string | string[]) {
    const names = typeof keys === "string" ? [keys] : keys;
    for (const k of names) this.store.delete(k);
  }

  async clear() {
    this.store.clear();
  }
}

const local = new FakeStorageArea();

const chromeMock = {
  storage: { local },
  runtime: {
    getURL: (path: string) => `chrome-extension://guiderail-test/${path}`,
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
};

// @ts-expect-error — partial mock is intentional; tests only touch what they use.
globalThis.chrome = chromeMock;

beforeEach(async () => {
  await local.clear();
});
