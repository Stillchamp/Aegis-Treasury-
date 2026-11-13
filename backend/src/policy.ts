import { InvalidAmountError, parseXrpToDrops } from "./amounts.js";

export interface PaymentInput {
  invoiceId: string;
  vendorId: string;
  amountXrp: string;
}

export interface PolicyContext {
  policy: { maxPerPaymentXrp: string; maxPerDayXrp: string };
  vendor: { vendorId: string; active: boolean } | undefined;
  approvedTodayDrops: bigint;
  now: Date;
}

export interface PolicyDecision {
  decision: "approved" | "rejected";
  reason: string;
  amountDrops: bigint;
}

export function evaluatePayment(input: PaymentInput, context: PolicyContext): PolicyDecision {
  let amountDrops: bigint;
  try {
    amountDrops = parseXrpToDrops(input.amountXrp);
  } catch (e) {
    if (e instanceof InvalidAmountError) {
      return { decision: "rejected", reason: "invalid_amount", amountDrops: 0n };
    }
    throw e;
  }
  const reject = (reason: string): PolicyDecision => ({
    decision: "rejected",
    reason,
    amountDrops,
  });

  if (!context.vendor || !context.vendor.active) return reject("unknown_or_inactive_vendor");
  if (amountDrops > parseXrpToDrops(context.policy.maxPerPaymentXrp)) {
    return reject("exceeds_per_payment_limit");
  }
  if (context.approvedTodayDrops + amountDrops > parseXrpToDrops(context.policy.maxPerDayXrp)) {
    return reject("exceeds_daily_limit");
  }
  return { decision: "approved", reason: "within_limits", amountDrops };
}
