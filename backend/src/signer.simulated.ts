// SIMULATION ONLY. Not an XRPL transaction.
// No I/O, no keys, no network. References it returns are prefixed "SIM-" so they are never mistaken for a ledger hash.
import crypto from "node:crypto";
import type { LookupResult, Signer, SignerResult, SubmitRequest } from "./signer.js";

export class SimulatedSigner implements Signer {
  submitCalls = 0;

  async submit(req: SubmitRequest): Promise<SignerResult> {
    this.submitCalls += 1;
    return { kind: "validated", txRef: `SIM-${req.invoiceId}-${crypto.randomBytes(6).toString("hex")}` };
  }

  async lookup(txRef: string): Promise<LookupResult> {
    return { kind: "validated", txRef };
  }
}
