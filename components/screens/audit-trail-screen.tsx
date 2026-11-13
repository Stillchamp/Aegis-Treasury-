'use client';

import React, { useState } from 'react';
import {
  BadgeCheck,
  Download,
  FileText,
  Gavel,
  UserCheck,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Lock,
  Bot,
  KeyRound,
  ChevronRight,
  GitFork,
  Shield,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '@/components/treasury-context';
import { AuditEventRecord } from '@/lib/treasury-data';

type CategoryFilter = 'all' | 'approved' | 'rejected' | 'human' | 'onchain';
type TimeRangeFilter = 'today' | '7d' | 'custom';

export function AuditTrailScreen() {
  const { auditEvents, pushToast } = useTreasury();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('AUD-9941');
  const [merkleModalOpen, setMerkleModalOpen] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);

  const selectedEvent: AuditEventRecord =
    auditEvents.find((e) => e.id === selectedEventId) || auditEvents[0];

  const filteredEvents = auditEvents.filter((ev) => {
    const matchesCat = category === 'all' || ev.categoryTypes.includes(category);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ev.id.toLowerCase().includes(q) ||
      ev.title.toLowerCase().includes(q) ||
      ev.subtitle.toLowerCase().includes(q) ||
      ev.initiator.toLowerCase().includes(q) ||
      ev.proofHash.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleExportLog = () => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aegis-immutable-audit-trail.json';
    link.click();
    URL.revokeObjectURL(url);
    pushToast('Immutable audit trail archive downloaded (JSON).', 'success');
  };

  const handleCopyJsonProof = () => {
    const payload = JSON.stringify(
      {
        event_id: selectedEvent.id,
        timestamp: selectedEvent.timeUtc,
        policy_version: '2025.4.1',
        initiator: selectedEvent.initiator,
        verdict: selectedEvent.verdict,
        proof_hash: selectedEvent.proofHash,
        xrpl_status: selectedEvent.xrplStatus,
      },
      null,
      2
    );
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
    pushToast(`Copied cryptographic JSON proof for ${selectedEvent.id}.`, 'info');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Header & Macro Statistics */}
      <section className="flex flex-col gap-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary text-[11px] tracking-wider uppercase font-semibold">
                Immutable Provenance Log
              </span>
              <span className="inline-flex items-center gap-1 text-on-surface-variant text-[11px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                XRPL Synchronized
              </span>
            </div>
            <h1 className="text-[36px] leading-[44px] tracking-[-0.025em] text-on-surface font-semibold">
              Audit Trail
            </h1>
            <p className="text-[14px] leading-5 text-on-surface-variant mt-0.5">
              Every payment request, policy evaluation, and ledger event is cryptographically
              recorded.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setMerkleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-medium shadow-sm hover:bg-surface-container-low transition-colors whitespace-nowrap"
            >
              <BadgeCheck className="w-[18px] h-[18px] text-primary" />
              <span>Verify Merkle Proof</span>
            </button>
            <button
              type="button"
              onClick={handleExportLog}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium shadow-sm hover:bg-primary-container transition-colors whitespace-nowrap"
            >
              <Download className="w-[18px] h-[18px]" />
              <span>Export Immutable Log</span>
              <span className="text-on-primary/70 text-[11px]">JSON/CSV</span>
            </button>
          </div>
        </div>

        {/* Macro Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
                Total Events Recorded
              </span>
              <FileText className="w-5 h-5 text-on-surface-variant" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-[36px] leading-[44px] font-semibold text-on-surface tabular-nums">
                {(1424 + auditEvents.length).toLocaleString()}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px] font-semibold">
                +18 today
              </span>
            </div>
            <div className="mt-2 pt-1 flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Continuous hash validation</span>
              <span className="font-mono text-primary font-medium">Block #89,421,042</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
                Intercepted Violations
              </span>
              <Gavel className="w-5 h-5 text-error" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-[36px] leading-[44px] font-semibold text-error tabular-nums">
                9
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[11px] font-semibold">
                100% Pre-Signing
              </span>
            </div>
            <div className="mt-2 pt-1 flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Prevented capital leakage</span>
              <span className="font-mono font-medium">185.00 XRP ($105.45)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
                Policy Updates
              </span>
              <UserCheck className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-[36px] leading-[44px] font-semibold text-on-surface tabular-nums">
                {13 + auditEvents.filter((e) => e.verdict === 'GOVERNANCE').length}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                WebAuthn Signed
              </span>
            </div>
            <div className="mt-2 pt-1 flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Latest change</span>
              <span className="font-mono font-medium">Yesterday, 17:05 UTC</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
                Ledger Proofs Verified
              </span>
              <CheckCircle2 className="w-5 h-5 text-tertiary" />
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-[36px] leading-[44px] font-semibold text-on-surface tabular-nums">
                100%
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold">
                XRPL Testnet
              </span>
            </div>
            <div className="mt-2 pt-1 flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Consensus integrity</span>
              <span className="font-mono text-tertiary font-medium">0 Divergent Hashes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Controls & Filters */}
      <section className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by event ID, agent, vendor, or hash..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-[13px] text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 rounded-lg bg-surface-container-low gap-1">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: 'custom', label: 'Custom' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1 rounded text-[12px] transition-colors ${
                    timeRange === t.id
                      ? 'font-semibold bg-surface-container-lowest text-primary shadow-xs'
                      : 'font-medium text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />

            <button
              type="button"
              onClick={() => setIsStreaming((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[13px] font-medium hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isStreaming ? 'bg-tertiary-container animate-pulse' : 'bg-secondary'
                }`}
              />
              <span>{isStreaming ? 'Live Ingestion Active' : 'Ingestion Paused'}</span>
              <SlidersHorizontal className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All Events', count: 1429, dot: '' },
              { id: 'approved', label: 'Approved Payments', count: 139, dot: 'bg-tertiary' },
              { id: 'rejected', label: 'Policy Rejections', count: 9, dot: 'bg-error' },
              { id: 'human', label: 'Human Policy Changes', count: 14, dot: 'bg-secondary' },
              {
                id: 'onchain',
                label: 'On-Chain Transactions',
                count: 139,
                dot: 'bg-primary-container',
              },
            ] as const
          ).map((pill) => {
            const active = category === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setCategory(pill.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors whitespace-nowrap ${
                  active
                    ? 'font-semibold bg-primary text-on-primary shadow-xs'
                    : 'font-medium bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {pill.dot && <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />}
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    active
                      ? 'bg-white/20 text-on-primary'
                      : pill.id === 'rejected'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {pill.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Split View Workspace: Primary Audit Ledger Table & Forensic Deep Trace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-3">
          <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px] leading-6 text-on-surface font-semibold">
                  Ledger Events &amp; Verdicts
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  Showing latest filtered items
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                <Lock className="w-4 h-4 text-tertiary" />
                <span>Deterministic SHA-256 Chain</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider h-9">
                    <th className="px-3 font-semibold w-28">Event ID</th>
                    <th className="px-3 font-semibold w-32">Timestamp</th>
                    <th className="px-3 font-semibold min-w-[200px]">Description &amp; Action</th>
                    <th className="px-3 font-semibold w-36">Initiator</th>
                    <th className="px-3 font-semibold text-right w-28">Amount</th>
                    <th className="px-3 font-semibold text-center w-28">Policy Verdict</th>
                    <th className="px-3 font-semibold text-right w-20">Inspect</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-on-surface divide-y divide-surface-container-low">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-on-surface-variant">
                        No audit events match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => {
                      const isSelected = selectedEvent.id === ev.id;
                      const dotColor =
                        ev.verdict === 'BLOCKED'
                          ? 'bg-error'
                          : ev.verdict === 'APPROVED'
                            ? 'bg-tertiary'
                            : ev.verdict === 'GOVERNANCE'
                              ? 'bg-secondary'
                              : 'bg-outline-variant';
                      const idColor =
                        ev.verdict === 'BLOCKED'
                          ? 'text-error'
                          : ev.verdict === 'APPROVED'
                            ? 'text-tertiary'
                            : ev.verdict === 'GOVERNANCE'
                              ? 'text-secondary'
                              : 'text-on-surface';

                      return (
                        <tr
                          key={ev.id}
                          onClick={() => setSelectedEventId(ev.id)}
                          className={`cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-surface-container-low'
                              : 'bg-surface-container-lowest hover:bg-surface-container-low/70'
                          }`}
                        >
                          <td className={`px-3 py-3 font-mono text-[11px] font-semibold ${idColor}`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              {ev.id}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-on-surface-variant whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px] text-on-surface font-medium">
                                {ev.timeUtc}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {ev.dayLabel}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="text-[14px] text-on-surface font-semibold group-hover:text-primary transition-colors">
                                {ev.title}
                              </span>
                              <span className="text-[11px] text-on-surface-variant mt-0.5">
                                {ev.subtitle}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              {ev.initiatorIcon === 'agent' && (
                                <Bot className="w-4 h-4 text-primary shrink-0" />
                              )}
                              {ev.initiatorIcon === 'vault' && (
                                <KeyRound className="w-4 h-4 text-tertiary shrink-0" />
                              )}
                              {ev.initiatorIcon === 'human' && (
                                <UserCheck className="w-4 h-4 text-secondary shrink-0" />
                              )}
                              <span className="font-mono text-[11px] text-on-surface truncate max-w-[110px]">
                                {ev.initiator}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {ev.amountXrp !== null ? (
                              <>
                                <span
                                  className={`font-mono text-[13px] font-semibold ${
                                    ev.verdict === 'BLOCKED' ? 'text-error' : 'text-on-surface'
                                  }`}
                                >
                                  {ev.amountXrp.toFixed(2)} XRP
                                </span>
                                <div className="text-[11px] text-on-surface-variant">
                                  ${(ev.amountUsd ?? 0).toFixed(2)} USD
                                </div>
                              </>
                            ) : (
                              <span className="font-mono text-[11px] text-on-surface-variant">
                                &mdash;
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                ev.verdict === 'BLOCKED'
                                  ? 'bg-error-container text-on-error-container'
                                  : ev.verdict === 'APPROVED'
                                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                    : ev.verdict === 'EVALUATED'
                                      ? 'bg-secondary-container text-on-secondary-container'
                                      : 'bg-surface-container-high text-on-surface'
                              }`}
                            >
                              {ev.verdict}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              title="View Deep Trace"
                              className="p-1 rounded hover:bg-surface-container-high text-primary"
                            >
                              <ChevronRight className="w-[18px] h-[18px]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-[11px]">
              <div className="flex items-center gap-2">
                <span>
                  Displaying {filteredEvents.length} of {(1424 + auditEvents.length).toLocaleString()}{' '}
                  authenticated records
                </span>
                <span className="text-outline-variant">&middot;</span>
                <span className="text-tertiary font-medium">Merkle Root: 0x9b42...88ce</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface text-[12px] shadow-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 py-1 font-mono text-[11px] text-on-surface font-medium">
                  Page 1 of 286
                </span>
                <button
                  type="button"
                  onClick={() => pushToast('Loaded snapshot page 1 of immutable log.', 'info')}
                  className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface text-[12px] shadow-xs hover:bg-surface-container-high"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Merkle Tree Architecture & Invariant Guarantees */}
          <div className="p-4 rounded-xl bg-surface-container-low shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-surface-container-highest text-primary shrink-0">
                <GitFork className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] leading-6 text-on-surface font-semibold">
                  Zero-Knowledge State Root Validation
                </span>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  Every 100 transactions, Aegis commits a Merkle Tree state root directly to an XRPL
                  Testnet trustline memo to guarantee non-repudiation by rogue agent actors.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 w-full lg:w-auto justify-end">
              <span className="font-mono text-[11px] px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface">
                Epoch #429 Verified
              </span>
            </div>
          </div>
        </div>

        {/* Forensic Drawer / Inspector Panel */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden sticky top-20">
            <div className="p-4 bg-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield
                  className={`w-5 h-5 ${
                    selectedEvent.verdict === 'BLOCKED' ? 'text-error' : 'text-primary'
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-[16px] leading-6 text-on-surface font-semibold">
                    Forensic Deep Trace
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    {selectedEvent.id} &middot; Cryptographic Proof
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                  selectedEvent.verdict === 'BLOCKED'
                    ? 'bg-error-container text-on-error-container'
                    : selectedEvent.verdict === 'APPROVED'
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : 'bg-secondary-container text-on-secondary-container'
                }`}
              >
                {selectedEvent.verdict === 'BLOCKED'
                  ? 'Veto Enforced'
                  : selectedEvent.verdict}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Interception Point</span>
                  <span
                    className={`font-mono font-medium ${
                      selectedEvent.verdict === 'BLOCKED' ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {selectedEvent.interceptionPoint}
                  </span>
                </div>
                <p className="text-[13px] text-on-surface font-medium">
                  {selectedEvent.summaryText}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-on-surface-variant">XRPL Fee Incurred:</span>
                  <span className="font-mono font-semibold text-tertiary">
                    {selectedEvent.feeText}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-on-surface uppercase tracking-wider font-semibold">
                    Step-by-Step Policy Evaluation
                  </span>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    &Delta;t: 48ms total
                  </span>
                </div>

                <div className="relative pl-5 flex flex-col gap-3">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-surface-container-high" />
                  {selectedEvent.timelineSteps.map((step, i) => {
                    const dotClass =
                      step.status === 'pass'
                        ? 'bg-tertiary'
                        : step.status === 'fail'
                          ? 'bg-error'
                          : 'bg-primary';
                    return (
                      <div key={i} className="relative flex flex-col gap-0.5">
                        <span
                          className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ${dotClass} ring-2 ring-surface-container-lowest`}
                        />
                        <div className="flex items-baseline justify-between">
                          <span
                            className={`text-[12px] font-semibold ${
                              step.status === 'fail' ? 'text-error' : 'text-on-surface'
                            }`}
                          >
                            {step.title}
                          </span>
                          <span
                            className={`font-mono text-[11px] ${
                              step.status === 'fail'
                                ? 'text-error font-medium'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {step.time}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] ${
                            step.status === 'fail'
                              ? 'text-error font-medium'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {step.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 font-mono text-[11px]">
                <span className="text-[12px] font-semibold text-on-surface font-sans">
                  Proof Integrity
                </span>
                <div className="flex items-center justify-between text-on-surface-variant pt-1">
                  <span>Proof Hash:</span>
                  <span className="text-on-surface font-semibold">{selectedEvent.proofHash}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Agent Signature:</span>
                  <span className="text-tertiary font-semibold">ED25519_VALID</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>XRPL Ledger:</span>
                  <span className="text-on-surface">{selectedEvent.xrplStatus}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyJsonProof}
                  className="flex-1 py-2 rounded-lg bg-surface-container-high text-on-surface text-[13px] font-medium hover:bg-surface-container hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedProof ? (
                    <>
                      <Check className="w-4 h-4 text-tertiary" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy JSON Proof</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pushToast(
                      `Exception override review opened for ${selectedEvent.id}.`,
                      'info'
                    )
                  }
                  className="py-2 px-3 rounded-lg bg-error-container text-on-error-container text-[13px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Override Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Merkle Proof Verification Modal */}
      <AnimatePresence>
        {merkleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMerkleModalOpen(false)}
              className="absolute inset-0 bg-[#0f172a]/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg rounded-xl bg-surface-container-lowest p-6 shadow-xl flex flex-col gap-4 z-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-fixed text-primary">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-on-surface">
                      Verify Cryptographic Root
                    </h3>
                    <span className="text-[11px] text-on-surface-variant">
                      XRPL Testnet Consensus Invariant
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMerkleModalOpen(false)}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold">
                    Ledger Anchor Block
                  </span>
                  <span className="font-mono text-[13px] text-on-surface font-semibold">
                    #89,421,042 (Consensus Final)
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-on-surface font-semibold">
                    Merkle Root Hexadecimal
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="0x9b42e718af29841bb02094ec2018fa308cb1902a7b8e19e91ce842b10091efca"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low font-mono text-[11px] text-on-surface select-all"
                  />
                </div>
                <div className="p-3 rounded-lg bg-tertiary-fixed/30 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-on-surface">
                    The mathematical commitment of all 1,429 historical entries perfectly matches the
                    cryptographic digest registered in XRPL Testnet account{' '}
                    <span className="font-mono font-semibold">
                      rApexTreasuryTestnetVault...89xA
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setMerkleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium hover:bg-primary-container transition-colors"
                >
                  Audit Confirmed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
