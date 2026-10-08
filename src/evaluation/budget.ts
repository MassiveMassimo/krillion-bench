const PILOT_CAP = 10_000_000_000n;

/** Round USD up to nanodollars. Never round a charge down. */
export function usdToNanos(value: string | number): bigint {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Invalid USD amount");
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  if (!match) throw new Error("Invalid USD amount");
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100)
    throw new Error("Invalid USD precision");
  const digits = BigInt(match[1] + fraction);
  const scale = 9 + exponent - fraction.length;
  if (scale >= 0) return digits * 10n ** BigInt(scale);
  const divisor = 10n ** BigInt(-scale);
  return (digits + divisor - 1n) / divisor;
}

export type BudgetSnapshot = {
  capNanos: string;
  spentNanos: string;
  reservedNanos: string;
  halted: boolean;
};

/** One shared, serial budget for one pilot. Persist snapshots before dispatch. */
export function createPilotBudget(saved?: BudgetSnapshot) {
  if (
    saved &&
    (typeof saved.halted !== "boolean" ||
      ![saved.capNanos, saved.spentNanos, saved.reservedNanos].every(
        (amount) => typeof amount === "string" && /^\d{1,30}$/.test(amount),
      ))
  )
    throw new Error("Invalid pilot budget");
  const cap = saved ? BigInt(saved.capNanos) : PILOT_CAP;
  let spent = saved ? BigInt(saved.spentNanos) : 0n;
  let reserved = saved ? BigInt(saved.reservedNanos) : 0n;
  let halted = saved?.halted ?? false;
  if (cap < 0n || cap > PILOT_CAP || spent < 0n || reserved < 0n)
    throw new Error("Invalid pilot budget");
  // A restored unresolved request must not be dispatched again.
  if (reserved > 0n || spent > cap) halted = true;
  return {
    reserve(maximum: bigint) {
      if (halted || reserved > 0n) throw new Error("Pilot budget stopped");
      if (maximum <= 0n || spent + maximum > cap) throw new Error("Pilot budget exhausted");
      reserved = maximum;
    },
    reconcile(actual: bigint) {
      if (reserved === 0n || actual < 0n) throw new Error("Invalid charge reconciliation");
      const exceeded = actual > reserved;
      spent += actual;
      reserved = 0n;
      if (exceeded) {
        halted = true;
        throw new Error("Charge exceeded reservation");
      }
    },
    halt() {
      halted = true;
    },
    snapshot(): BudgetSnapshot {
      return {
        capNanos: String(cap),
        spentNanos: String(spent),
        reservedNanos: String(reserved),
        halted,
      };
    },
  };
}
