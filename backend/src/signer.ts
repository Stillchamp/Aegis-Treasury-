export interface SubmitRequest {
  invoiceId: string;
  vendorId: string;
  amountXrp: string;
  attemptId: string;
  fencingToken: number;
}

export type SignerResult =
  | { kind: "validated"; txRef: string }
  | { kind: "failed_confirmed"; code: string }
  | { kind: "timeout" }
  | { kind: "ambiguous" };

export type LookupResult =
  | { kind: "validated"; txRef: string }
  | { kind: "failed_confirmed"; code: string }
  | { kind: "not_found" };

export interface Signer {
  submit(req: SubmitRequest): Promise<SignerResult>;
  lookup(txRef: string): Promise<LookupResult>;
}
