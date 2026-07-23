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
const session = new FakeStorageArea(); // spec 005: pending quiz attempts live here

const chromeMock = {
  storage: { local, session },
  runtime: {
    getURL: (path: string) => `chrome-extension://guiderail-test/${path}`,
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  // Spec 004: the pipeline toggles DNR rules, redirects tabs on gate, and arms
  // study-hours alarms. Minimal mocks so the worker paths run under Node.
  declarativeNetRequest: {
    updateDynamicRules: vi.fn(async () => {}),
    updateSessionRules: vi.fn(async () => {}),
  },
  tabs: { update: vi.fn(async () => {}), create: vi.fn(async () => {}) },
  alarms: {
    create: vi.fn(async () => {}),
    clear: vi.fn(async () => true),
    onAlarm: { addListener: vi.fn() },
  },
  // Spec 005 earned-time badge; spec 007 toolbar-click opens options.
  action: {
    setBadgeText: vi.fn(async () => {}),
    setBadgeBackgroundColor: vi.fn(async () => {}),
    onClicked: { addListener: vi.fn() },
  },
};

// @ts-expect-error — partial mock is intentional; tests only touch what they use.
globalThis.chrome = chromeMock;

beforeEach(async () => {
  await local.clear();
  await session.clear();
});
