export type NavPath =
  | 'overview'
  | 'payments'
  | 'ai-agents'
  | 'spending-policies'
  | 'vendors'
  | 'audit-trail'
  | 'settings'
  | 'help-support';

export interface PolicyCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface TransactionRecord {
  id: string;
  vendor: string;
  vendorSubtitle: string;
  purpose: string;
  agent: string;
  agentId: string;
  amountXrp: number;
  amountUsd: number;
  timeDisplay: string;
  timestampFull: string;
  policySummary: string;
  status: 'Settled' | 'Blocked' | 'Pending';
  xrplStatusLabel: string;
  ledgerRef: string;
  senderVault: string;
  payeeWallet: string;
  invoiceRef: string;
  auditProof: string;
  checks: PolicyCheck[];
  engineVerdict: string;
  verdictExplanation: string;
}

export interface AgentRecord {
  id: string;
  key: 'procurement' | 'monitor' | string;
  name: string;
  version: string;
  host: string;
  nodeId: string;
  purpose: string;
  status: 'Active' | 'Paused';
  modeLabel: string;
  readOnly: boolean;
  paymentsToday: number;
  paymentsTotal: number;
  successRate: string;
  lastActive: string;
  budgetConsumed: number;
  budgetCap: number;
  singleTxCap: number;
  ledgersScanned?: number;
  allowedScopes: string[];
  blockedScopes: string[];
  activityFeed: {
    time: string;
    verdict: 'VERIFIED_SETTLED' | 'INTERCEPTED_BREACH';
    title: string;
    detail: string;
  }[];
}

export interface VendorRecord {
  id: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  name: string;
  categoryLocation: string;
  category: string;
  walletShort: string;
  walletFull: string;
  singleLimitXrp: number;
  cumulativePaidXrp: number;
  orderCountLabel: string;
  status: 'Approved' | 'Pending Verification' | 'Deactivated';
  dateAdded: string;
  breachFlag?: string;
  taxId?: string;
}

export interface AuditEventRecord {
  id: string;
  timeUtc: string;
  dayLabel: string;
  title: string;
  subtitle: string;
  initiator: string;
  initiatorIcon: 'agent' | 'vault' | 'human';
  amountXrp: number | null;
  amountUsd: number | null;
  verdict: 'BLOCKED' | 'EVALUATED' | 'APPROVED' | 'GOVERNANCE';
  categoryTypes: ('approved' | 'rejected' | 'human' | 'onchain')[];
  proofHash: string;
  interceptionPoint: string;
  summaryText: string;
  feeText: string;
  xrplStatus: string;
  timelineSteps: {
    title: string;
    time: string;
    detail: string;
    status: 'pass' | 'fail' | 'neutral';
  }[];
}

export interface SpendingPoliciesConfig {
  dailyAggregateLimit: number;
  maxSingleTxLimit: number;
  strictWhitelist: boolean;
  emergencyFreeze: boolean;
  jurisdictions: { code: string; name: string; regId: string }[];
}

export const HOTLINK_ASSETS = {
  aegisLogo:
    'https://lh3.googleusercontent.com/aida/ALJJyrBQYug7sO-MdEZ_syuDfamQwX3qLnsfRWLSCYlXoSwfD_2-c1nz4fi1BeZwWKQ-Qi2PSasIlhDhYcflXLB2oEhanNrnbsDK_uEllptMat_ZZzO0Fr1ZLN4UXtZSmls4iv10n_GwXYrA3uJhwKJelQRHE7b-Tf6s9lt0tljykiBiVR09Ja8mLahSvxXIxMA1eh9NbkYgqmODTqYuB9onqAfftSzBmwp9fi-1ogZlm0fq',
  amaraAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDv2d4-xjvMX8kxZGgoeKZLK8ziokEaj9R3rVei_eb7H47r5Q5mQ4zutRKN3vENBaQG7NCsB_vje2e_AuUuNIcu_7FxQoxC8mIDyjrYku6oC_IN8tujjD8uZZehGyNEUVnCvIPoz-AyzEvjd0-YqKUQRLcIDNFZtj_tT7rZhuUM87pxk-CL8xuQiQRhDBdcu_pB8LX24WCauSaEUv-p058F52tSeJT0KumkFhC4x5fi',
  warehouseImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD1r5PZtU8iEwvX3ELbm2nnxgUsV10yj_3MYfml6CWa_hOPPKJY2Yz6Q3SyW2ODu2qeWZpMlD09rNBC0GDsahe7fFCVK6B4vpyqFr0EVzBRVczE-ZnmSB9FesAE1ae7w1cZSSxr_33yFhurMHJ_3Qci9CjzW8qJNxMc8xYrogtoHIekJMnDWDrtIrwGJjOS5nfcHoZ7qlKHUu9R5NxcSf49kBuEpyDo3TjHcSOkeL9P',
  regionalMapImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDX5ygqI3LK0nQ9HIxG1nXLxYyAKAAbdedDH6TvNxTMIp3CY-vZ5kZo_fMu0qaRv5ogVcifwkm6khnzI-nxUmnWPHdT3BT2ytFFEclDa-niEbwG6upnZC67Omg8yb5zyBk2QuxUag3dhslucnVdu5dSic8HzK9JWa586ivTBrvZ1aUWun6f8z_wFelQzjvfJzSpsKrqxU2b1v0JZ1iWuqflrqEco-McQOlIIZn5x8ll',
};

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TX-98421',
    vendor: 'Atlas Bearings',
    vendorSubtitle: 'Automotive Supplies · Tier 1',
    purpose: 'Industrial seals (Batch #401)',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 12.0,
    amountUsd: 6.84,
    timeDisplay: 'Today, 09:15 UTC',
    timestampFull: '12 May 2025, 09:15 UTC',
    policySummary: 'Passed POL-01, POL-04',
    status: 'Settled',
    xrplStatusLabel: 'Settled on XRPL',
    ledgerRef: 'Ledger #89,420,119',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rAtlasBearings89Nbi...4xM1',
    invoiceRef: 'INV-8821 (Industrial seals Batch #401)',
    auditProof: 'aegis_chk_4b7c8821f0a21bc',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: true,
        detail: 'Atlas Bearings registered in Tier-1 directory (#APX-VN-101)',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: true,
        detail: 'Requested 12.00 XRP is within single cap of 20.00 XRP.',
      },
      {
        name: 'Daily Remaining Budget',
        passed: true,
        detail: 'Cleared within 50.00 XRP daily aggregate ceiling.',
      },
    ],
    engineVerdict: 'AUTHORIZED & SETTLED',
    verdictExplanation:
      'Isolated HSM signed payment after deterministic policy approval. Finality confirmed on XRPL Testnet in 3.4s.',
  },
  {
    id: 'TX-98418',
    vendor: 'Prime Components',
    vendorSubtitle: 'OEM Engine Parts',
    purpose: 'Engine mounts replenishment',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 6.0,
    amountUsd: 3.42,
    timeDisplay: 'Today, 11:42 UTC',
    timestampFull: '12 May 2025, 11:42 UTC',
    policySummary: 'Passed POL-01, POL-04',
    status: 'Settled',
    xrplStatusLabel: 'Settled on XRPL',
    ledgerRef: 'Ledger #89,420,872',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rPrimeCompLagos99...2kP7',
    invoiceRef: 'INV-2025-0574 (Engine mounts)',
    auditProof: 'aegis_chk_91e39f19a04c2d',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: true,
        detail: 'Prime Components verified on Lagos corridor (#APX-VN-102)',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: true,
        detail: 'Requested 6.00 XRP is within vendor & policy limit.',
      },
      {
        name: 'Daily Remaining Budget',
        passed: true,
        detail: 'Cumulative daily spend 18.00 / 50.00 XRP.',
      },
    ],
    engineVerdict: 'AUTHORIZED & SETTLED',
    verdictExplanation:
      'Autonomous Tier-1 micro-expense cleared automatically and settled on XRPL Testnet.',
  },
  {
    id: 'REQ-98405',
    vendor: 'Global Parts Ltd',
    vendorSubtitle: 'Hydraulic Hardware Group',
    purpose: 'Hydraulic pumps order',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 35.0,
    amountUsd: 19.95,
    timeDisplay: 'Today, 14:23 UTC',
    timestampFull: '12 May 2025, 14:23 UTC',
    policySummary: 'Violated POL-02 (>20 XRP single)',
    status: 'Blocked',
    xrplStatusLabel: 'Blocked (Pre-Signing)',
    ledgerRef: 'Never Broadcast',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rGlobalPartsSupplier...7xL1',
    invoiceRef: 'INV-2025-0581 (Hydraulic seal kits)',
    auditProof: 'aegis_chk_8829f0a21bc9e4',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: true,
        detail: 'Global Parts Ltd registered in Tier-1 directory (#APX-VN-104)',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: false,
        detail: 'Requested 35.00 XRP exceeds single authorization cap of 20.00 XRP.',
      },
      {
        name: 'Daily Remaining Budget',
        passed: false,
        detail: 'Requested 35.00 XRP exceeds available rolling budget of 32.00 XRP.',
      },
    ],
    engineVerdict: 'HARD REJECTION',
    verdictExplanation:
      'Transaction signature denied at kernel level. Zero XRP moved. Never broadcast to ledger network; no network gas consumed.',
  },
  {
    id: 'TX-98390',
    vendor: 'Kisumu Logistics',
    vendorSubtitle: 'Regional Freight Transporter',
    purpose: 'Regional Mombasa-Nairobi freight delivery',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 8.5,
    amountUsd: 4.85,
    timeDisplay: 'Yesterday, 16:30 UTC',
    timestampFull: '11 May 2025, 16:30 UTC',
    policySummary: 'Passed POL-01',
    status: 'Settled',
    xrplStatusLabel: 'Settled on XRPL',
    ledgerRef: 'Ledger #89,418,920',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rKisumuLogistics7...8wQ3',
    invoiceRef: 'INV-2025-0560 (Mombasa-Nairobi freight)',
    auditProof: 'aegis_chk_3092a8e1d9401f',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: true,
        detail: 'Kisumu Logistics registered (#APX-VN-105)',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: true,
        detail: 'Requested 8.50 XRP is within 10.00 XRP vendor cap.',
      },
      {
        name: 'Daily Remaining Budget',
        passed: true,
        detail: 'Daily rolling budget sufficient.',
      },
    ],
    engineVerdict: 'AUTHORIZED & SETTLED',
    verdictExplanation:
      'Freight bill of lading matched ERP manifest; payment settled automatically.',
  },
  {
    id: 'REQ-98382',
    vendor: 'Unregistered Supplier X',
    vendorSubtitle: 'Unknown Counterparty',
    purpose: 'Unverified replacement parts',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 15.0,
    amountUsd: 8.55,
    timeDisplay: 'Yesterday, 10:14 UTC',
    timestampFull: '11 May 2025, 10:14 UTC',
    policySummary: 'Rejected: Unapproved Vendor',
    status: 'Blocked',
    xrplStatusLabel: 'Blocked (Vendor Unknown)',
    ledgerRef: 'Safety Sandbox Intercept',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rUnknownCounterparty...9zW4',
    invoiceRef: 'INV-EXT-4410 (Unverified invoice)',
    auditProof: 'aegis_chk_1002f8b73e12aa',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: false,
        detail: 'Destination wallet not found in Approved Vendors directory.',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: true,
        detail: 'Requested 15.00 XRP is below 20.00 XRP single limit.',
      },
    ],
    engineVerdict: 'HARD REJECTION',
    verdictExplanation:
      'Strict Allowlist Mode halted payment prior to key enclave handoff. Zero funds released.',
  },
  {
    id: 'TX-98375',
    vendor: 'Nairobi Brake Co.',
    vendorSubtitle: 'Friction & Hydraulics',
    purpose: 'Brake rotor & caliper batch',
    agent: 'Procurement Agent',
    agentId: 'agt_procure_09',
    amountXrp: 19.5,
    amountUsd: 11.12,
    timeDisplay: '10 May, 14:02 UTC',
    timestampFull: '10 May 2025, 14:02 UTC',
    policySummary: 'Approved (Allowlist & Budget)',
    status: 'Settled',
    xrplStatusLabel: 'Settled on XRPL',
    ledgerRef: 'Ledger #89,415,201',
    senderVault: 'rApexTreasury...9kQ2',
    payeeWallet: 'rNairobiBrakeCo...5mN8',
    invoiceRef: 'INV-2025-0542 (Brake caliper batch)',
    auditProof: 'aegis_chk_7721b3d0a9e821',
    checks: [
      {
        name: 'Vendor Allowlist Verification',
        passed: true,
        detail: 'Nairobi Brake Co. active Tier-1 supplier.',
      },
      {
        name: 'Maximum Single TX Limit',
        passed: true,
        detail: 'Requested 19.50 XRP within 20.00 XRP cap (CFO alert dispatched).',
      },
    ],
    engineVerdict: 'AUTHORIZED & SETTLED',
    verdictExplanation:
      'Tier-2 intermediate outflow cleared with synchronous CFO alert notification.',
  },
];

export const INITIAL_AGENTS: AgentRecord[] = [
  {
    id: 'agt_proc_8829',
    key: 'procurement',
    name: 'Procurement Agent',
    version: 'v2.4.1',
    host: 'ERP Webhook Daemon',
    nodeId: 'agt_proc_8829',
    purpose:
      'Automated supplier invoice matching against SAP / NetSuite, purchase order verification, and algorithmic settlement via XRPL Testnet.',
    status: 'Active',
    modeLabel: 'Autonomous Execution',
    readOnly: false,
    paymentsToday: 2,
    paymentsTotal: 34,
    successRate: '94.4%',
    lastActive: '14m ago (ERP Queue)',
    budgetConsumed: 18.0,
    budgetCap: 50.0,
    singleTxCap: 20.0,
    allowedScopes: [
      'Request supplier payments ≤ cap',
      'Query approved vendor directory',
    ],
    blockedScopes: [
      'CANNOT modify spending limits',
      'CANNOT access vault keys',
    ],
    activityFeed: [
      {
        time: '14:02:11 UTC',
        verdict: 'VERIFIED_SETTLED',
        title: 'Invoice #INV-9021 → Nairobi Hub Components',
        detail: 'Amount: 4.80 XRP · Ledger #89,420,982',
      },
      {
        time: '11:24:05 UTC',
        verdict: 'VERIFIED_SETTLED',
        title: 'Invoice #INV-9019 → Lagos Logistics Fleet',
        detail: 'Amount: 13.20 XRP · Ledger #89,419,230',
      },
      {
        time: '08:15:20 UTC',
        verdict: 'INTERCEPTED_BREACH',
        title: 'Attempted dispatch: 24.50 XRP (Exceeds 20.00 XRP tx ceiling)',
        detail: 'Policy Rule: RULE_MAX_TX_LIMIT_BLOCKED',
      },
    ],
  },
  {
    id: 'agt_obs_1044',
    key: 'monitor',
    name: 'Treasury Monitor',
    version: 'v1.1.0',
    host: 'Ledger Observer Worker',
    nodeId: 'agt_obs_1044',
    purpose:
      'Real-time monitoring of XRPL testnet ledger events, autonomous liquidity threshold evaluation, and zero-latency anomaly dispatching.',
    status: 'Active',
    modeLabel: 'Read-Only Auditing',
    readOnly: true,
    paymentsToday: 0,
    paymentsTotal: 0,
    successRate: '100.0%',
    lastActive: '12s ago (Ledger #89.4k)',
    budgetConsumed: 0,
    budgetCap: 0,
    singleTxCap: 0,
    ledgersScanned: 184200,
    allowedScopes: [
      'Read-only ledger querying',
      'Alert dispatching (Slack/Email)',
    ],
    blockedScopes: [
      'ZERO transaction execution permissions (Hardware blocked)',
    ],
    activityFeed: [
      {
        time: '14:23:41 UTC',
        verdict: 'INTERCEPTED_BREACH',
        title: 'Escalated REQ-98405 policy veto alert to #treasury-alerts',
        detail: 'Target: Global Parts Ltd · 35.00 XRP',
      },
      {
        time: '11:42:19 UTC',
        verdict: 'VERIFIED_SETTLED',
        title: 'Verified XRPL finality for TX-98418',
        detail: 'Ledger #89,420,872 · Sync 100%',
      },
    ],
  },
];

export const INITIAL_VENDORS: VendorRecord[] = [
  {
    id: 'vnd-1',
    initials: 'AB',
    avatarBg: 'bg-primary-fixed',
    avatarText: 'text-primary',
    name: 'Atlas Bearings Ltd',
    categoryLocation: 'Industrial Components & Bearings (Nairobi, KE)',
    category: 'Auto Parts',
    walletShort: 'rAtlasBearings89Nbi...4xM1',
    walletFull: 'rAtlasBearings89Nbi98240Klsad4xM1',
    singleLimitXrp: 20.0,
    cumulativePaidXrp: 142.5,
    orderCountLabel: '12 autonomous orders',
    status: 'Approved',
    dateAdded: '15 Jan 2025',
    taxId: 'KRA-PIN-P05110482A',
  },
  {
    id: 'vnd-2',
    initials: 'PC',
    avatarBg: 'bg-secondary-fixed',
    avatarText: 'text-on-secondary-fixed',
    name: 'Prime Components Ltd',
    categoryLocation: 'Automotive Electronics & Sensors (Lagos, NG)',
    category: 'Auto Parts',
    walletShort: 'rPrimeCompLagos99...2kP7',
    walletFull: 'rPrimeCompLagos99014194012kP7',
    singleLimitXrp: 15.0,
    cumulativePaidXrp: 84.0,
    orderCountLabel: '8 autonomous orders',
    status: 'Approved',
    dateAdded: '02 Feb 2025',
    taxId: 'NG-CAC-RC882910',
  },
  {
    id: 'vnd-3',
    initials: 'GP',
    avatarBg: 'bg-tertiary-fixed',
    avatarText: 'text-tertiary',
    name: 'Global Parts Ltd',
    categoryLocation: 'Heavy Machinery & Hydraulic Parts (Mombasa, KE)',
    category: 'Auto Parts',
    walletShort: 'rGlobalPartsSupplier...7xL1',
    walletFull: 'rGlobalPartsSupplier018247xL1',
    singleLimitXrp: 20.0,
    cumulativePaidXrp: 310.0,
    orderCountLabel: '19 autonomous orders',
    status: 'Approved',
    dateAdded: '10 Jan 2025',
    breachFlag: 'Over-limit attempt blocked today',
    taxId: 'KRA-PIN-P05992014K',
  },
  {
    id: 'vnd-4',
    initials: 'KL',
    avatarBg: 'bg-surface-container-high',
    avatarText: 'text-on-surface',
    name: 'Kisumu Logistics & Freight',
    categoryLocation: 'Shipping & Customs Clearance (Kisumu, KE)',
    category: 'Logistics',
    walletShort: 'rKisumuLogistics7...8wQ3',
    walletFull: 'rKisumuLogistics70014298wQ3',
    singleLimitXrp: 10.0,
    cumulativePaidXrp: 45.5,
    orderCountLabel: '5 autonomous orders',
    status: 'Approved',
    dateAdded: '20 Mar 2025',
    taxId: 'KRA-PIN-P05448120L',
  },
  {
    id: 'vnd-5',
    initials: 'HL',
    avatarBg: 'bg-amber-200',
    avatarText: 'text-amber-900',
    name: 'Horizon Lubricants PLC',
    categoryLocation: 'Oils & Fluids Wholesale (Eldoret, KE)',
    category: 'Raw Materials',
    walletShort: 'rHorizonLubricants...1bY9',
    walletFull: 'rHorizonLubricants91039811bY9',
    singleLimitXrp: 12.0,
    cumulativePaidXrp: 0.0,
    orderCountLabel: 'New Partner',
    status: 'Pending Verification',
    dateAdded: '10 May 2025',
    taxId: 'KRA-PIN-P05883201M',
  },
];

export const INITIAL_AUDIT_EVENTS: AuditEventRecord[] = [
  {
    id: 'AUD-9941',
    timeUtc: '14:23:41 UTC',
    dayLabel: 'Today',
    title: 'Agent payment request blocked by Aegis Policy Engine',
    subtitle: 'Target: Global Parts Ltd · Pre-signing veto enforced',
    initiator: 'Procure v2.4',
    initiatorIcon: 'agent',
    amountXrp: 35.0,
    amountUsd: 19.95,
    verdict: 'BLOCKED',
    categoryTypes: ['rejected'],
    proofHash: '0x882af9c3...91ce',
    interceptionPoint: 'Pre-Signing Layer',
    summaryText:
      'Autonomous Procurement Agent attempted a single transfer exceeding the dynamic policy threshold. Corporate private keys remained air-gapped in vault HSM.',
    feeText: '0.000000 XRP (Zero Cost)',
    xrplStatus: 'Uncommitted (Vetoed)',
    timelineSteps: [
      {
        title: 'Webhook Received',
        time: '14:23:40.102',
        detail:
          'Procurement Agent submitted invoice #INV-2025-0581 payload via authenticated gRPC stream.',
        status: 'pass',
      },
      {
        title: 'Agent Identity Validated',
        time: '14:23:40.115',
        detail: 'Ed25519 token agt_procure_09 verified with zero replay flag.',
        status: 'pass',
      },
      {
        title: 'Vendor Allowlist Check',
        time: '14:23:40.128',
        detail: 'rGlobalPartsSupplier...7xL1 present on allowlist (PASSED)',
        status: 'pass',
      },
      {
        title: 'Single Limit Policy (POL-01)',
        time: '14:23:40.140',
        detail:
          'FAILED: Requested 35.00 XRP vs single ceiling 20.00 XRP (Breached by 15.00 XRP).',
        status: 'fail',
      },
      {
        title: 'Daily Limit Rolling Cap (POL-02)',
        time: '14:23:40.141',
        detail:
          'FAILED: 18.00 XRP previously spent + 35.00 XRP exceeds current 50.00 XRP ceiling.',
        status: 'fail',
      },
      {
        title: 'Key Vault Isolation Enforced',
        time: '14:23:40.145',
        detail:
          'Authorization service aborted signing sequence. Private key was never loaded into RAM.',
        status: 'neutral',
      },
      {
        title: 'Security Dispatch',
        time: '14:23:40.150',
        detail: 'Webhook alert dispatched to Amara Okafor and Slack #treasury-alerts.',
        status: 'neutral',
      },
    ],
  },
  {
    id: 'AUD-9940',
    timeUtc: '14:23:40 UTC',
    dayLabel: 'Today',
    title: 'Agent requested payment for invoice #INV-2025-0581',
    subtitle: 'Triggered Policy Rules POL-01, POL-02, POL-03',
    initiator: 'Procure v2.4',
    initiatorIcon: 'agent',
    amountXrp: 35.0,
    amountUsd: 19.95,
    verdict: 'EVALUATED',
    categoryTypes: ['rejected'],
    proofHash: '0x714bc19a...42fd',
    interceptionPoint: 'Policy Evaluation Queue',
    summaryText:
      'Procurement Agent v2.4 parsed SAP ERP webhook for Global Parts Ltd and submitted SpendProposal #INV-2025-0581 to the Aegis Policy Engine.',
    feeText: '0.000000 XRP (Pending)',
    xrplStatus: 'Evaluated -> Halted',
    timelineSteps: [
      {
        title: 'ERP Webhook Triggered',
        time: '14:23:39.980',
        detail: 'SAP S/4HANA matched PO #PO-44812 to Global Parts Ltd.',
        status: 'pass',
      },
      {
        title: 'Proposal Emitted',
        time: '14:23:40.095',
        detail: 'Structured SpendProposal dispatched to isolated enclave.',
        status: 'neutral',
      },
    ],
  },
  {
    id: 'AUD-9938',
    timeUtc: '11:42:18 UTC',
    dayLabel: 'Today',
    title: 'XRPL Testnet payment confirmed on ledger #89,420,872',
    subtitle: 'Beneficiary: Prime Components Ltd · TX: E39F...19A0',
    initiator: 'Auth Svc (Vault)',
    initiatorIcon: 'vault',
    amountXrp: 6.0,
    amountUsd: 3.42,
    verdict: 'APPROVED',
    categoryTypes: ['approved', 'onchain'],
    proofHash: '0xe39f810c...19a0',
    interceptionPoint: 'HSM Enclave Sign-Off',
    summaryText:
      'SpendProposal cleared all deterministic checks and received multi-sign enclave signature. Confirmed final on XRPL Testnet ledger #89,420,872.',
    feeText: '0.000012 XRP (Network Fee)',
    xrplStatus: 'Finalized (#89,420,872)',
    timelineSteps: [
      {
        title: 'Allowlist & Cap Verification',
        time: '11:42:14.120',
        detail: 'Prime Components Ltd verified; 6.00 XRP within 15.00 XRP vendor cap.',
        status: 'pass',
      },
      {
        title: 'Enclave HSM Signing',
        time: '11:42:15.004',
        detail: 'Signed inside AWS KMS FIPS 140-3 Level 3 vault.',
        status: 'pass',
      },
      {
        title: 'XRPL Ledger Finality',
        time: '11:42:18.410',
        detail: 'Transaction E39F...19A0 validated by consensus.',
        status: 'pass',
      },
    ],
  },
  {
    id: 'AUD-9935',
    timeUtc: '09:15:32 UTC',
    dayLabel: 'Today',
    title: 'XRPL Testnet payment confirmed on ledger #89,420,119',
    subtitle: 'Beneficiary: Atlas Bearings Ltd · TX: A991...44F2',
    initiator: 'Auth Svc (Vault)',
    initiatorIcon: 'vault',
    amountXrp: 12.0,
    amountUsd: 6.84,
    verdict: 'APPROVED',
    categoryTypes: ['approved', 'onchain'],
    proofHash: '0xa9914bc2...44f2',
    interceptionPoint: 'HSM Enclave Sign-Off',
    summaryText:
      'Invoice #INV-8821 matched cryptographic vendor registry for Atlas Bearings Ltd. Autonomous multi-signature authorized.',
    feeText: '0.000012 XRP (Network Fee)',
    xrplStatus: 'Finalized (#89,420,119)',
    timelineSteps: [
      {
        title: 'Allowlist & Cap Verification',
        time: '09:15:28.012',
        detail: 'Atlas Bearings Ltd verified; 12.00 XRP within 20.00 XRP cap.',
        status: 'pass',
      },
      {
        title: 'Tier-2 CFO Notification',
        time: '09:15:29.400',
        detail: 'Synchronous receipt dispatched to #treasury-alerts.',
        status: 'pass',
      },
      {
        title: 'XRPL Ledger Finality',
        time: '09:15:32.118',
        detail: 'Transaction A991...44F2 validated by consensus.',
        status: 'pass',
      },
    ],
  },
  {
    id: 'AUD-9920',
    timeUtc: '17:05:00 UTC',
    dayLabel: 'Yesterday',
    title: 'Human Policy Change: Daily Spending Limit updated',
    subtitle: 'Limit increased from 40.00 XRP to 50.00 XRP · 2FA Authenticated',
    initiator: 'Amara Okafor',
    initiatorIcon: 'human',
    amountXrp: null,
    amountUsd: null,
    verdict: 'GOVERNANCE',
    categoryTypes: ['human'],
    proofHash: '0x5c11d902...8a11',
    interceptionPoint: 'Human Governance Console',
    summaryText:
      'Finance Administrator Amara Okafor signed a deterministic policy parameter update using FIDO2 WebAuthn hardware key.',
    feeText: '0.000000 XRP (Off-Chain Attested)',
    xrplStatus: 'Enclave Synced',
    timelineSteps: [
      {
        title: 'WebAuthn Hardware Assertion',
        time: '17:04:58.210',
        detail: 'FIDO2 hardware key verified for Amara Okafor.',
        status: 'pass',
      },
      {
        title: 'Enclave Policy Commit',
        time: '17:05:00.002',
        detail: 'Daily cap updated 40.00 XRP -> 50.00 XRP across all verification nodes.',
        status: 'pass',
      },
    ],
  },
];

export const INITIAL_POLICIES: SpendingPoliciesConfig = {
  dailyAggregateLimit: 50.0,
  maxSingleTxLimit: 20.0,
  strictWhitelist: true,
  emergencyFreeze: false,
  jurisdictions: [
    { code: 'KE', name: 'Kenya (KE)', regId: '#KE-KRA-01' },
    { code: 'NG', name: 'Nigeria (NG)', regId: '#NG-CAC-89' },
    { code: 'UK', name: 'United Kingdom (UK)', regId: '#GB-CH-44' },
  ],
};
