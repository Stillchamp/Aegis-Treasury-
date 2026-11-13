'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  NavPath,
  TransactionRecord,
  AgentRecord,
  VendorRecord,
  AuditEventRecord,
  SpendingPoliciesConfig,
  INITIAL_TRANSACTIONS,
  INITIAL_AGENTS,
  INITIAL_VENDORS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_POLICIES,
} from '@/lib/treasury-data';

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface BackendAuditRow {
  id: number;
  event_type: string;
  actor: string;
  payload: string;
  created_at: string;
}

interface TreasuryContextValue {
  activePath: NavPath;
  setActivePath: (path: NavPath) => void;
  selectedEntity: 'apex-auto' | 'apex-logistics';
  setSelectedEntity: (entity: 'apex-auto' | 'apex-logistics') => void;
  transactions: TransactionRecord[];
  agents: AgentRecord[];
  vendors: VendorRecord[];
  auditEvents: AuditEventRecord[];
  policies: SpendingPoliciesConfig;
  treasuryBalanceXrp: number;
  spentTodayXrp: number;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  pauseAllAgents: () => void;
  resumeAllAgents: () => void;
  toggleAgentStatus: (agentKey: string) => void;
  addAgent: (name: string, policy: string, webhook: string) => void;
  updatePolicies: (next: Partial<SpendingPoliciesConfig>) => void;
  addVendor: (vendor: Omit<VendorRecord, 'id' | 'initials' | 'avatarBg' | 'avatarText' | 'cumulativePaidXrp' | 'orderCountLabel' | 'dateAdded'>) => void;
  updateVendorStatus: (vendorId: string, status: VendorRecord['status']) => void;
  updateVendorLimit: (vendorId: string, newLimit: number) => void;
  flagAgentTransaction: (txId: string) => void;
  requestCfoOverride: (txId: string) => void;
}

const CFO_TOKEN = process.env.NEXT_PUBLIC_CFO_TOKEN || 'cfo_demo_secret_token_2026';

const TreasuryContext = createContext<TreasuryContextValue | null>(null);

function parsePayload(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function pickStr(obj: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return String(obj[k]);
    }
  }
  return fallback;
}

function pickNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const n = Number(obj[k]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

export function TreasuryProvider({ children }: { children: React.ReactNode }) {
  const [activePath, setActivePath] = useState<NavPath>('overview');
  const [selectedEntity, setSelectedEntity] = useState<'apex-auto' | 'apex-logistics'>('apex-auto');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [agents, setAgents] = useState<AgentRecord[]>(INITIAL_AGENTS);
  const [vendors, setVendors] = useState<VendorRecord[]>(INITIAL_VENDORS);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>(INITIAL_AUDIT_EVENTS);
  const [policies, setPolicies] = useState<SpendingPoliciesConfig>(INITIAL_POLICIES);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [liveSettledXrp, setLiveSettledXrp] = useState<number>(0);

  const treasuryBalanceXrp = Number((1250.0 - liveSettledXrp).toFixed(2));
  const spentTodayXrp = Number((18.0 + liveSettledXrp).toFixed(2));

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const syncFromBackend = useCallback(async () => {
    try {
      const [policyRes, auditRes] = await Promise.all([
        fetch('/api/aegis/policy'),
        fetch('/api/aegis/audit', {
          headers: { 'x-cfo-token': CFO_TOKEN },
        }),
      ]);

      if (policyRes.ok) {
        const pData = (await policyRes.json()) as {
          maxPerPaymentXrp?: string;
          maxPerDayXrp?: string;
        };
        const single = Number(pData.maxPerPaymentXrp);
        const daily = Number(pData.maxPerDayXrp);
        if (!Number.isNaN(single) && !Number.isNaN(daily)) {
          setPolicies((prev) => ({
            ...prev,
            maxSingleTxLimit: single,
            dailyAggregateLimit: daily,
          }));
        }
      }

      if (auditRes.ok) {
        const rows = (await auditRes.json()) as BackendAuditRow[];
        if (Array.isArray(rows) && rows.length > 0) {
          const txByInvoice = new Map<string, TransactionRecord>();
          const liveAudits: AuditEventRecord[] = [];

          // Process oldest to newest so worker execution events enrich earlier decision rows
          const chronological = [...rows].reverse();

          for (const row of chronological) {
            const p = parsePayload(row.payload);
            const isPolicy = row.event_type === 'policy.updated';
            const invoiceId = pickStr(p, ['invoice', 'invoiceId', 'invoice_id']);
            const existingTx = invoiceId ? txByInvoice.get(invoiceId) : undefined;

            const vendorId = pickStr(p, ['vendor', 'vendorId', 'vendor_id'], existingTx?.vendor || 'apex-auto-parts');
            const amountNum = pickNum(p, ['amount', 'amountXrp', 'amount_xrp']) ?? (existingTx ? existingTx.amountXrp : null);
            const statusStr = pickStr(p, ['status', 'decision']).toLowerCase();
            const reason = pickStr(p, ['reason', 'error'], row.event_type);
            const txRef = pickStr(p, ['txRef', 'tx_ref']);

            const isBlocked = statusStr === 'rejected' || statusStr === 'blocked';
            const isSettled =
              statusStr === 'executed' ||
              row.event_type === 'payment.executed' ||
              row.event_type === 'payment.submitted' ||
              Boolean(txRef);

            const nextPolicy = (p.new as { maxPerPaymentXrp?: string; maxPerDayXrp?: string } | undefined);
            const policySubtitle = nextPolicy
              ? `Updated by CFO · Single cap: ${nextPolicy.maxPerPaymentXrp} XRP · Daily cap: ${nextPolicy.maxPerDayXrp} XRP`
              : `Updated by ${row.actor.toUpperCase()} · Enforced on backend`;

            liveAudits.unshift({
              id: `AUD-${9942 + row.id}`,
              timeUtc: row.created_at ? new Date(row.created_at).toUTCString().slice(17, 25) + ' UTC' : 'Just now · UTC',
              dayLabel: 'Today',
              title: isPolicy
                ? 'Human Policy Change: Spending limits updated'
                : row.event_type === 'payment.executed'
                  ? `XRPL Simulation Settled (${invoiceId || `EVT-${row.id}`})`
                  : isBlocked
                    ? `Agent Request Blocked (${invoiceId || `EVT-${row.id}`})`
                    : `Agent Payment ${row.event_type.replace('payment.', '').toUpperCase()} (${invoiceId || `EVT-${row.id}`})`,
              subtitle: isPolicy
                ? policySubtitle
                : `Vendor: ${vendorId} · ${txRef ? `Ref: ${txRef}` : `Reason: ${reason}`}`,
              initiator: row.actor === 'cfo' ? 'Amara Okafor' : row.actor === 'executor' ? 'Auth Svc (Worker)' : 'Procure v2.4',
              initiatorIcon: row.actor === 'cfo' ? 'human' : row.actor === 'executor' ? 'vault' : 'agent',
              amountXrp: amountNum,
              amountUsd: amountNum !== null ? Number((amountNum * 0.57).toFixed(2)) : null,
              verdict: isPolicy ? 'GOVERNANCE' : isBlocked ? 'BLOCKED' : 'APPROVED',
              categoryTypes: isPolicy ? ['human'] : isBlocked ? ['rejected'] : ['approved', 'onchain'],
              proofHash: txRef || `0x${row.id.toString(16).padStart(8, '0')}...aegis`,
              interceptionPoint: isPolicy ? 'CFO Policy API' : 'Aegis Enclave Gate',
              summaryText: `Event "${row.event_type}" recorded at ${row.created_at}. Details: ${row.payload}`,
              feeText: isBlocked || isPolicy ? '0.000000 XRP' : '0.000012 XRP (Simulated)',
              xrplStatus: isPolicy ? 'SQLite Synced' : isBlocked ? 'Vetoed Pre-Sign' : isSettled ? 'Finalized (Simulation)' : 'Queued',
              timelineSteps: [
                {
                  title: row.event_type,
                  time: row.created_at,
                  detail: `Actor: ${row.actor} · ${txRef || reason}`,
                  status: isBlocked ? 'fail' : 'pass',
                },
              ],
            });

            if (!isPolicy && invoiceId) {
              const resolvedAmount = amountNum ?? 0;
              const resolvedStatus: 'Settled' | 'Blocked' | 'Pending' = isBlocked
                ? 'Blocked'
                : isSettled
                  ? 'Settled'
                  : existingTx?.status ?? 'Pending';

              txByInvoice.set(invoiceId, {
                id: invoiceId,
                vendor: vendorId,
                vendorSubtitle: 'Live Backend Counterparty',
                purpose: `Autonomous Invoice ${invoiceId}`,
                agent: 'Procurement Agent',
                agentId: 'agt_procure_09',
                amountXrp: resolvedAmount,
                amountUsd: Number((resolvedAmount * 0.57).toFixed(2)),
                timeDisplay: 'Today · Live',
                timestampFull: row.created_at,
                policySummary: isBlocked
                  ? `Blocked: ${reason}`
                  : existingTx?.policySummary || `Passed (${reason})`,
                status: resolvedStatus,
                xrplStatusLabel: isBlocked
                  ? 'Blocked (Pre-Signing)'
                  : resolvedStatus === 'Settled'
                    ? 'Settled (Simulation)'
                    : 'Approved · Queued',
                ledgerRef: txRef || existingTx?.ledgerRef || (isBlocked ? 'Never Broadcast' : 'Pending Worker'),
                senderVault: 'rApexTreasury...9kQ2',
                payeeWallet: `r${vendorId.replace(/[^a-zA-Z0-9]/g, '')}...XRPL`,
                invoiceRef: invoiceId,
                auditProof: `aegis_live_${row.id}`,
                checks: [
                  {
                    name: 'Aegis Independent Policy Engine',
                    passed: !isBlocked,
                    detail: `Decision: ${resolvedStatus} (${txRef || reason})`,
                  },
                ],
                engineVerdict: isBlocked ? 'HARD REJECTION' : 'AUTHORIZED & SETTLED',
                verdictExplanation: `Enforced by Aegis backend (${row.event_type}).`,
              });
            }
          }

          const liveTxs = Array.from(txByInvoice.values()).reverse();
          const settledSum = liveTxs
            .filter((t) => t.status === 'Settled')
            .reduce((acc, t) => acc + t.amountXrp, 0);

          setLiveSettledXrp(settledSum);
          setAuditEvents([...liveAudits, ...INITIAL_AUDIT_EVENTS]);
          if (liveTxs.length > 0) {
            setTransactions([...liveTxs, ...INITIAL_TRANSACTIONS]);
          }
        }
      }
    } catch {
      // Backend offline: retain current state
    }
  }, []);

  useEffect(() => {
    syncFromBackend();
    const timer = setInterval(syncFromBackend, 2500);
    return () => clearInterval(timer);
  }, [syncFromBackend]);

  const appendAuditEvent = useCallback((event: Omit<AuditEventRecord, 'id'>) => {
    setAuditEvents((prev) => [
      {
        ...event,
        id: `AUD-${9942 + prev.length - INITIAL_AUDIT_EVENTS.length}`,
      },
      ...prev,
    ]);
  }, []);

  const pauseAllAgents = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: 'Paused' })));
    setPolicies((prev) => ({ ...prev, emergencyFreeze: true }));
    appendAuditEvent({
      timeUtc: 'Just now · UTC',
      dayLabel: 'Today',
      title: 'Emergency Halt: All autonomous agents suspended',
      subtitle: 'HSM dispatch keys revoked · Freeze Active',
      initiator: 'Amara Okafor',
      initiatorIcon: 'human',
      amountXrp: null,
      amountUsd: null,
      verdict: 'GOVERNANCE',
      categoryTypes: ['human'],
      proofHash: '0xf920ab12...77d1',
      interceptionPoint: 'Emergency KillSwitch',
      summaryText: 'Finance Administrator broadcast an emergency pause across all agents.',
      feeText: '0.000000 XRP',
      xrplStatus: 'Keys Suspended',
      timelineSteps: [
        {
          title: 'Kill Switch Invoked',
          time: '00:00.012',
          detail: 'Emergency halt broadcast by Amara Okafor.',
          status: 'fail',
        },
      ],
    });
    pushToast('Emergency pause signal broadcast. All autonomous agent dispatches suspended.', 'error');
  }, [appendAuditEvent, pushToast]);

  const resumeAllAgents = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: 'Active' })));
    setPolicies((prev) => ({ ...prev, emergencyFreeze: false }));
    pushToast('Autonomous agent verification enclaves resumed.', 'success');
  }, [pushToast]);

  const toggleAgentStatus = useCallback(
    (agentKey: string) => {
      let targetName = '';
      let nextStatus: 'Active' | 'Paused' = 'Paused';
      setAgents((prev) =>
        prev.map((a) => {
          if (a.key === agentKey) {
            targetName = a.name;
            nextStatus = a.status === 'Active' ? 'Paused' : 'Active';
            return { ...a, status: nextStatus };
          }
          return a;
        })
      );
      if (targetName) {
        pushToast(
          nextStatus === 'Paused'
            ? `Confirmed: ${targetName} execution halted.`
            : `${targetName} resumed and synchronized.`,
          nextStatus === 'Paused' ? 'info' : 'success'
        );
      }
    },
    [pushToast]
  );

  const addAgent = useCallback(
    (name: string, policy: string, webhook: string) => {
      const cleanName = name.trim() || 'Custom Treasury Agent';
      const newAgent: AgentRecord = {
        id: `agt_custom_${Date.now().toString().slice(-4)}`,
        key: `custom-${Date.now()}`,
        name: cleanName,
        version: 'v1.0.0',
        host: webhook.trim() || 'ERP Webhook Daemon',
        nodeId: `agt_ext_${Date.now().toString().slice(-4)}`,
        purpose: `Provisioned sandbox agent bound to ${policy}.`,
        status: 'Active',
        modeLabel: policy.includes('Read-Only') ? 'Read-Only Auditing' : 'Autonomous Execution',
        readOnly: policy.includes('Read-Only'),
        paymentsToday: 0,
        paymentsTotal: 0,
        successRate: '100.0%',
        lastActive: 'Just provisioned',
        budgetConsumed: 0,
        budgetCap: policies.dailyAggregateLimit,
        singleTxCap: policies.maxSingleTxLimit,
        allowedScopes: ['Request supplier payments within cap', 'Query approved vendor directory'],
        blockedScopes: ['CANNOT modify spending limits', 'CANNOT access vault keys'],
        activityFeed: [],
      };
      setAgents((prev) => [...prev, newAgent]);
      pushToast(`Agent sandbox key generated for "${cleanName}".`, 'success');
    },
    [policies.dailyAggregateLimit, policies.maxSingleTxLimit, pushToast]
  );

  const updatePolicies = useCallback(
    (next: Partial<SpendingPoliciesConfig>) => {
      setPolicies((prev) => {
        const updated = { ...prev, ...next };
        if (next.emergencyFreeze === true) {
          setAgents((aPrev) => aPrev.map((a) => ({ ...a, status: 'Paused' })));
        } else if (next.emergencyFreeze === false) {
          setAgents((aPrev) => aPrev.map((a) => ({ ...a, status: 'Active' })));
        }

        fetch('/api/aegis/policy', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-cfo-token': CFO_TOKEN,
          },
          body: JSON.stringify({
            maxPerPaymentXrp: String(updated.maxSingleTxLimit),
            maxPerDayXrp: String(updated.dailyAggregateLimit),
          }),
        })
          .then(() => syncFromBackend())
          .catch(() => {});

        return updated;
      });
      pushToast('Policy revision synced with Aegis backend SQLite enclave.', 'success');
    },
    [pushToast, syncFromBackend]
  );

  const addVendor = useCallback(
    (vendor: Omit<VendorRecord, 'id' | 'initials' | 'avatarBg' | 'avatarText' | 'cumulativePaidXrp' | 'orderCountLabel' | 'dateAdded'>) => {
      const words = vendor.name.trim().split(/\s+/);
      const initials = words.length >= 2 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : vendor.name.slice(0, 2).toUpperCase();
      const shortWallet =
        vendor.walletFull.length > 22
          ? `${vendor.walletFull.slice(0, 18)}...${vendor.walletFull.slice(-4)}`
          : vendor.walletFull;
      const newVendor: VendorRecord = {
        ...vendor,
        id: `vnd-${Date.now()}`,
        initials,
        avatarBg: 'bg-primary-fixed',
        avatarText: 'text-primary',
        walletShort: shortWallet,
        cumulativePaidXrp: 0,
        orderCountLabel: 'New Partner',
        dateAdded: 'Today',
      };
      setVendors((prev) => [newVendor, ...prev]);
      pushToast(`Vendor "${vendor.name}" added to allowlist.`, 'success');
    },
    [pushToast]
  );

  const updateVendorStatus = useCallback(
    (vendorId: string, status: VendorRecord['status']) => {
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, status } : v)));
      pushToast(`Vendor status updated to ${status}.`, status === 'Deactivated' ? 'info' : 'success');
    },
    [pushToast]
  );

  const updateVendorLimit = useCallback(
    (vendorId: string, newLimit: number) => {
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, singleLimitXrp: newLimit } : v)));
      pushToast(`Updated single payment limit to ${newLimit.toFixed(2)} XRP.`, 'success');
    },
    [pushToast]
  );

  const flagAgentTransaction = useCallback(
    (txId: string) => {
      pushToast(`Flagged ${txId} for anomaly review.`, 'info');
    },
    [pushToast]
  );

  const requestCfoOverride = useCallback(
    (txId: string) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId
            ? { ...tx, xrplStatusLabel: 'Override Pending CFO', ledgerRef: 'Escrow Review #409' }
            : tx
        )
      );
      pushToast(`Dual-key CFO override request queued for ${txId}.`, 'info');
    },
    [pushToast]
  );

  return (
    <TreasuryContext.Provider
      value={{
        activePath,
        setActivePath,
        selectedEntity,
        setSelectedEntity,
        transactions,
        agents,
        vendors,
        auditEvents,
        policies,
        treasuryBalanceXrp,
        spentTodayXrp,
        toasts,
        pushToast,
        dismissToast,
        pauseAllAgents,
        resumeAllAgents,
        toggleAgentStatus,
        addAgent,
        updatePolicies,
        addVendor,
        updateVendorStatus,
        updateVendorLimit,
        flagAgentTransaction,
        requestCfoOverride,
      }}
    >
      {children}
    </TreasuryContext.Provider>
  );
}

export function useTreasury() {
  const ctx = useContext(TreasuryContext);
  if (!ctx) {
    throw new Error('useTreasury must be used inside TreasuryProvider');
  }
  return ctx;
}
