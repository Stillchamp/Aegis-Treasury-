import { describe, expect, it } from "vitest";
import { formatDropsToXrp, parseXrpToDrops } from "./amounts.js";
import { evaluatePayment } from "./policy.js";

const ctx = {
  policy: { maxPerPaymentXrp: "20", maxPerDayXrp: "50" },
  vendor: { vendorId: "v", active: true },
  approvedTodayDrops: 0n,
  now: new Date("2026-01-01T00:00:00Z"),
};
const pay = (amountXrp: string) => ({ invoiceId: "i", vendorId: "v", amountXrp });

describe("amounts", () => {
  it("parses and formats", () => {
    expect(parseXrpToDrops("12")).toBe(12_000_000n);
    expect(parseXrpToDrops("0.000001")).toBe(1n);
    expect(formatDropsToXrp(12_500_000n)).toBe("12.5");
    expect(formatDropsToXrp(12_000_000n)).toBe("12");
    expect(formatDropsToXrp(1n)).toBe("0.000001");
  });
});

describe("evaluatePayment", () => {
  it("approves within limits", () => {
    expect(evaluatePayment(pay("12"), ctx)).toMatchObject({ decision: "approved", reason: "within_limits" });
  });
  it("rejects over per-payment limit", () => {
    expect(evaluatePayment(pay("35"), ctx).reason).toBe("exceeds_per_payment_limit");
  });
  it.each(["0", "-1", "1e3", "1.1234567", "abc", ""])("rejects invalid amount %j", (a) => {
    expect(evaluatePayment(pay(a), ctx)).toMatchObject({ decision: "rejected", reason: "invalid_amount" });
  });
  it("rejects unknown or inactive vendor", () => {
    expect(evaluatePayment(pay("1"), { ...ctx, vendor: undefined }).reason).toBe("unknown_or_inactive_vendor");
    expect(
      evaluatePayment(pay("1"), { ...ctx, vendor: { vendorId: "v", active: false } }).reason,
    ).toBe("unknown_or_inactive_vendor");
  });
  it("rejects over the daily limit", () => {
    expect(
      evaluatePayment(pay("12"), { ...ctx, approvedTodayDrops: 39_000_000n }).reason,
    ).toBe("exceeds_daily_limit");
  });
});
