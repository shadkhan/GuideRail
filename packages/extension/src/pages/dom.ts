// Tiny DOM helper shared by the options + rules pages (spec 007). No inline
// event handlers (CSP), so callers attach listeners after building.

type Props = Record<string, string>;

export function h(tag: string, props: Props = {}, ...kids: Array<Node | string>): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids) el.append(kid);
  return el;
}

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));
