// lib/utils.ts
// Tiny helper to combine class names safely in React/Tailwind components.

export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | Record<string, boolean>
  | ClassValue[];

/**
 * cn(...args) merges class names:
 * - strings/numbers are included
 * - falsy values are ignored
 * - objects include keys whose value is truthy
 * - nested arrays are flattened
 */
export function cn(...args: ClassValue[]): string {
  const out: string[] = [];

  const push = (v: ClassValue) => {
    if (!v) return;
    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(push);
      return;
    }
    if (typeof v === "object") {
      for (const [k, val] of Object.entries(v)) {
        if (val) out.push(k);
      }
    }
  };

  args.forEach(push);
  return out.join(" ");
}
