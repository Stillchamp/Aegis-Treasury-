import crypto from "node:crypto";
import type { LookupResult, Signer, SignerResult, SubmitRequest } from "./signer.js";

/** Test double. No network, no keys. Every tx reference it invents is prefixed "SIM-". */
export class FakeSigner implements Signer {
  submitCalls = 0;
  private next: SignerResult | undefined;

  setNext(result: SignerResult): void {
    this.next = result;
  }

  async submit(_req: SubmitRequest): Promise<SignerResult> {
    this.submitCalls += 1;
    return this.next ?? { kind: "validated", txRef: `SIM-${crypto.randomBytes(8).toString("hex")}` };
  }

  async lookup(_txRef: string): Promise<LookupResult> {
    return { kind: "not_found" };
  }
}
