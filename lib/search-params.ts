export type SearchParam = string | string[] | undefined;

export function firstSearchParam(value: SearchParam): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parsePageParam(value: SearchParam, maximum = 500): number {
  const raw = firstSearchParam(value);
  if (!/^\d+$/.test(raw)) return 1;

  const page = Number(raw);
  if (!Number.isSafeInteger(page) || page < 1) return 1;
  return Math.min(page, maximum);
}
