const DROPS_PER_XRP = 1_000_000n;
const AMOUNT_RE = /^\d+(\.\d{1,6})?$/;

export class InvalidAmountError extends Error {
  readonly code = "invalid_amount";
  constructor(message: string) {
    super(message);
    this.name = "InvalidAmountError";
  }
}

/** Parse a positive decimal XRP string (max 6 decimals) into drops. */
export function parseXrpToDrops(input: string): bigint {
  if (typeof input !== "string" || !AMOUNT_RE.test(input)) {
    throw new InvalidAmountError(
      "Amount must be a positive decimal string with at most 6 decimal places",
    );
  }
  const [whole, frac = ""] = input.split(".");
  const drops = BigInt(whole) * DROPS_PER_XRP + BigInt(frac.padEnd(6, "0"));
  if (drops <= 0n) {
    throw new InvalidAmountError("Amount must be greater than zero");
  }
  return drops;
}

/** Canonical decimal string: no trailing zeros, no trailing dot. */
export function formatDropsToXrp(drops: bigint): string {
  const whole = drops / DROPS_PER_XRP;
  const frac = (drops % DROPS_PER_XRP).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}
