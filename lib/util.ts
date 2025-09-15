export function cn(...cls: Array<string | undefined | false>) {
  return cls.filter(Boolean).join(" ");
}