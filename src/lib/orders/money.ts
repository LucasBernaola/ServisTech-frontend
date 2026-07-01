export function parseArsToNumberOrNull(value: string) {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/\.?-$/, "")
    .replace(/\.-$/, "");

  if (!cleaned) return null;

  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(normalized);

  return Number.isFinite(numberValue) ? numberValue : null;
}

export function coerceMoneyToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const directValue = Number(trimmed);
    if (Number.isFinite(directValue)) return directValue;

    return parseArsToNumberOrNull(trimmed);
  }

  return null;
}

export function formatArsDisplay(value: number) {
  const isInt = Math.abs(value % 1) < 1e-9;

  if (isInt) {
    return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}.-`;
  }

  return `$${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatArsInput(value: number) {
  const isInt = Math.abs(value % 1) < 1e-9;

  if (isInt) {
    return value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  }

  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
