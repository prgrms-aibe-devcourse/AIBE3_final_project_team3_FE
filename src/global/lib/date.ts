const TIMEZONE_SUFFIX_RE = /(Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/;
const ISO_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const FRACTION_RE = /\.(\d+)(?=$|Z|[+-]\d{2}:\d{2}|[+-]\d{4})/;

const normalizeFractionToMillis = (value: string): string => {
  const match = value.match(FRACTION_RE);
  if (!match) {
    return value;
  }

  const fraction = match[1] ?? "";
  const millis = fraction.padEnd(3, "0").slice(0, 3);
  return value.replace(FRACTION_RE, `.${millis}`);
};

const ensureKstOffsetWhenMissing = (value: string): string => {
  const trimmed = value.trim();

  // If it already has timezone information, keep it.
  if (TIMEZONE_SUFFIX_RE.test(trimmed)) {
    return trimmed;
  }

  // Only force KST for ISO-like date-times that include a time component.
  if (ISO_NO_TZ_RE.test(trimmed)) {
    return `${trimmed}+09:00`;
  }

  return trimmed;
};

export const parseApiDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const normalized = ensureKstOffsetWhenMissing(normalizeFractionToMillis(trimmed));

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback: try original as-is
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const getApiTime = (value: unknown): number => {
  const date = parseApiDate(value);
  return date ? date.getTime() : 0;
};
