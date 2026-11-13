'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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

const TreasuryContext = createContext<TreasuryContextValue | null>(null);

export function TreasuryProvider({ children }: { children: React.ReactNode }) {
  const [activePath, setActivePath] = useState<NavPath>('overview');
  const [selectedEntity, setSelectedEntity] = useState<'apex-auto' | 'apex-logistics'>('apex-auto');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [agents, setAgents] = useState<AgentRecord[]>(INITIAL_AGENTS);
  const [vendors, setVendors] = useState<VendorRecord[]>(INITIAL_VENDORS);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>(INITIAL_AUDIT_EVENTS);
  const [policies, setPolicies] = useState<SpendingPoliciesConfig>(INITIAL_POLICIES);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const treasuryBalanceXrp = 1250.0;
  const spentTodayXrp = 18.0;

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
      subtitle: 'HSM dispatch keys revoked on XRPL Testnet · Freeze Active',
      initiator: 'Amara Okafor',
      initiatorIcon: 'human',
      amountXrp: null,
      amountUsd: null,
      verdict: 'GOVERNANCE',
      categoryTypes: ['human'],
      proofHash: '0xf920ab12...77d1',
      interceptionPoint: 'Emergency Kill Switch',
      summaryText:
        'Finance Administrator Amara Okafor broadcast an emergency pause across all autonomous verification enclaves.',
      feeText: '0.000000 XRP (Enclave Halt)',
      xrplStatus: 'Keys Suspended',
      timelineSteps: [
        {
          title: 'Kill Switch Invoked',
          time: '00:00.012',
          detail: 'Emergency halt broadcast by Amara Okafor.',
          status: 'fail',
        },
        {
          title: 'Enclave Signing Revoked',
          time: '00:00.029',
          detail: 'All outbound agent SpendProposals quarantined.',
          status: 'neutral',
        },
      ],
    });
    pushToast('Emergency pause signal broadcast to isolated verification enclaves. All autonomous agent dispatches suspended.', 'error');
  }, [appendAuditEvent, pushToast]);

  const resumeAllAgents = useCallback(() => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: 'Active' })));
    setPolicies((prev) => ({ ...prev, emergencyFreeze: false }));
    appendAuditEvent({
      timeUtc: 'Just now · UTC',
      dayLabel: 'Today',
      title: 'Human Policy Change: Autonomous agents resumed',
      subtitle: 'Emergency freeze lifted by Finance Administrator',
      initiator: 'Amara Okafor',
      initiatorIcon: 'human',
      amountXrp: null,
      amountUsd: null,
      verdict: 'GOVERNANCE',
      categoryTypes: ['human'],
      proofHash: '0x219ac831...10ef',
      interceptionPoint: 'Human Governance Console',
      summaryText: 'Finance Administrator restored normal policy enforcement across active daemons.',
      feeText: '0.000000 XRP',
      xrplStatus: 'Enclave Active',
      timelineSteps: [
        {
          title: 'Operator Re-Authorization',
          time: '00:00.018',
          detail: 'Amara Okafor lifted Emergency Freeze.',
          status: 'pass',
        },
      ],
    });
    pushToast('Autonomous agent verification enclaves resumed.', 'success');
  }, [appendAuditEvent, pushToast]);

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
        appendAuditEvent({
          timeUtc: 'Just now · UTC',
          dayLabel: 'Today',
          title: `${targetName} ${nextStatus === 'Paused' ? 'paused' : 'resumed'} by operator`,
          subtitle: `Worker node execution state changed to ${nextStatus}`,
          initiator: 'Amara Okafor',
          initiatorIcon: 'human',
          amountXrp: null,
          amountUsd: null,
          verdict: 'GOVERNANCE',
          categoryTypes: ['human'],
          proofHash: '0x6a91d201...31be',
          interceptionPoint: 'Agent Registry Control',
          summaryText: `${targetName} transitioned to ${nextStatus} state via Aegis Control Panel.`,
          feeText: '0.000000 XRP',
          xrplStatus: nextStatus === 'Paused' ? 'Execution Halted' : 'Active',
          timelineSteps: [
            {
              title: 'Operator Intent Verified',
              time: '00:00.014',
              detail: `${targetName} set to ${nextStatus}.`,
              status: nextStatus === 'Paused' ? 'fail' : 'pass',
            },
          ],
        });
        pushToast(
          nextStatus === 'Paused'
            ? `Confirmed: ${targetName} execution halted. Pending settlement requests quarantined.`
            : `${targetName} resumed and synchronized with XRPL Testnet.`,
          nextStatus === 'Paused' ? 'info' : 'success'
        );
      }
    },
    [appendAuditEvent, pushToast]
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
        purpose: `Provisioned sandbox agent bound to ${policy}. Evaluates structured SpendProposals via isolated enclave.`,
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
        allowedScopes: ['Request supplier payments ≤ cap', 'Query approved vendor directory'],
        blockedScopes: ['CANNOT modify spending limits', 'CANNOT access vault keys'],
        activityFeed: [
          {
            time: 'Just now',
            verdict: 'VERIFIED_SETTLED',
            title: 'Ed25519 sandbox keypair provisioned',
            detail: `Bound to ${policy}`,
          },
        ],
      };
      setAgents((prev) => [...prev, newAgent]);
      pushToast(`Agent sandbox key generated for "${cleanName}". Ephemeral Ed25519 token provisioned.`, 'success');
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
        appendAuditEvent({
          timeUtc: 'Just now · UTC',
          dayLabel: 'Today',
          title: 'Human Policy Change: Spending Policy matrix updated',
          subtitle: `Daily limit ${updated.dailyAggregateLimit.toFixed(2)} XRP · Max single ${updated.maxSingleTxLimit.toFixed(2)} XRP`,
          initiator: 'Amara Okafor',
          initiatorIcon: 'human',
          amountXrp: null,
          amountUsd: null,
          verdict: 'GOVERNANCE',
          categoryTypes: ['human'],
          proofHash: '0x7f4e92a1...c890',
          interceptionPoint: 'Human Governance Console',
          summaryText:
            'Hardware-enforced treasury parameter update signed via WebAuthn and synchronized with verification enclaves.',
          feeText: '0.000000 XRP',
          xrplStatus: 'Enclave Synced',
          timelineSteps: [
            {
              title: 'WebAuthn Verification',
              time: '00:00.022',
              detail: 'Amara Okafor signed policy delta.',
              status: 'pass',
            },
            {
              title: 'Enclave Sync Complete',
              time: '00:00.041',
              detail: `Daily Cap: ${updated.dailyAggregateLimit.toFixed(2)} XRP | Single Cap: ${updated.maxSingleTxLimit.toFixed(2)} XRP.`,
              status: 'pass',
            },
          ],
        });
        return updated;
      });
      pushToast('Policy revision verified and synchronized across XRPL authorization enclaves.', 'success');
    },
    [appendAuditEvent, pushToast]
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
        dateAdded: '12 May 2025',
      };
      setVendors((prev) => [newVendor, ...prev]);
      appendAuditEvent({
        timeUtc: 'Just now · UTC',
        dayLabel: 'Today',
        title: `Human Policy Change: Added vendor ${vendor.name}`,
        subtitle: `Wallet ${shortWallet} · Single limit ${vendor.singleLimitXrp.toFixed(2)} XRP`,
        initiator: 'Amara Okafor',
        initiatorIcon: 'human',
        amountXrp: null,
        amountUsd: null,
        verdict: 'GOVERNANCE',
        categoryTypes: ['human'],
        proofHash: '0x420b99e1...11c4',
        interceptionPoint: 'Allowlist Registry',
        summaryText: `Supplier wallet registered for ${vendor.name} (${vendor.status}).`,
        feeText: '0.000000 XRP',
        xrplStatus: 'Registry Updated',
        timelineSteps: [
          {
            title: 'Base58 Wallet Format Validated',
            time: '00:00.009',
            detail: `${shortWallet} passed XRPL checksum validation.`,
            status: 'pass',
          },
        ],
      });
      pushToast(`Vendor "${vendor.name}" queued for Administrator dual-sign approval.`, 'success');
    },
    [appendAuditEvent, pushToast]
  );

  const updateVendorStatus = useCallback(
    (vendorId: string, status: VendorRecord['status']) => {
      let vendorName = '';
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === vendorId) {
            vendorName = v.name;
            return { ...v, status };
          }
          return v;
        })
      );
      if (vendorName) {
        pushToast(`${vendorName} status updated to ${status}.`, status === 'Deactivated' ? 'info' : 'success');
      }
    },
    [pushToast]
  );

  const updateVendorLimit = useCallback(
    (vendorId: string, newLimit: number) => {
      let vendorName = '';
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === vendorId) {
            vendorName = v.name;
            return { ...v, singleLimitXrp: newLimit };
          }
          return v;
        })
      );
      if (vendorName) {
        pushToast(`Updated single payment limit for ${vendorName} to ${newLimit.toFixed(2)} XRP.`, 'success');
      }
    },
    [pushToast]
  );

  const flagAgentTransaction = useCallback(
    (txId: string) => {
      pushToast(`Flagged ${txId} for anomaly review and attached trace to compliance log.`, 'info');
    },
    [pushToast]
  );

  const requestCfoOverride = useCallback(
    (txId: string) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId
            ? {
                ...tx,
                xrplStatusLabel: 'Override Pending CFO',
                ledgerRef: 'Escrow Review #409',
              }
            : tx
        )
      );
      pushToast(`Dual-key WebAuthn CFO override request queued for ${txId}.`, 'info');
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
