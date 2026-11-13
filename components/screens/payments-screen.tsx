'use client';

import React, { useState } from 'react';
import {
  Download,
  Filter,
  PauseCircle,
  FileText,
  Calendar,
  BadgeCheck,
  ShieldAlert,
  Clock,
  Search,
  ChevronDown,
  Bot,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  Shield,
  X,
} from 'lucide-react';
import { useTreasury } from '@/components/treasury-context';
import { TransactionRecord } from '@/lib/treasury-data';

type PaymentStatusFilter = 'all' | 'settled' | 'blocked' | 'review';

export function PaymentsScreen() {
  const {
    transactions,
    pauseAllAgents,
    requestCfoOverride,
    flagAgentTransaction,
    pushToast,
  } = useTreasury();

  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('Procurement Agent');
  const [selectedPeriod, setSelectedPeriod] = useState('Today (Past 24h)');
  const [selectedTxId, setSelectedTxId] = useState<string>('REQ-98405');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const selectedTx: TransactionRecord =
    transactions.find((t) => t.id === selectedTxId) || transactions[2] || transactions[0];

  const filteredRows = transactions.filter((tx) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'settled' && tx.status === 'Settled') ||
      (statusFilter === 'blocked' && tx.status === 'Blocked') ||
      (statusFilter === 'review' && tx.status === 'Pending');

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tx.id.toLowerCase().includes(q) ||
      tx.vendor.toLowerCase().includes(q) ||
      tx.payeeWallet.toLowerCase().includes(q) ||
      tx.purpose.toLowerCase().includes(q);

    const matchesAgent =
      selectedAgent === 'All Agents' || tx.agent.toLowerCase().includes(selectedAgent.toLowerCase());

    return matchesStatus && matchesQuery && matchesAgent;
  });

  const handleDownloadCsv = () => {
    const csv = [
      ['Transaction ID', 'Supplier', 'Agent', 'Amount XRP', 'Amount USD', 'Policy Decision', 'XRPL Status', 'Timestamp'].join(','),
      ...filteredRows.map((r) =>
        [
          r.id,
          `"${r.vendor}"`,
          `"${r.agent}"`,
          r.amountXrp.toFixed(2),
          r.amountUsd.toFixed(2),
          `"${r.policySummary}"`,
          `"${r.xrplStatusLabel}"`,
          `"${r.timestampFull}"`,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegis-payments-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Downloaded filtered payments ledger CSV.', 'success');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] leading-8 tracking-[-0.02em] font-semibold text-on-surface">
              Payments
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] leading-[14px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              XRPL Testnet Demo
            </span>
          </div>
          <p className="text-[14px] leading-5 text-on-surface-variant max-w-2xl">
            Monitor supplier payments initiated by your autonomous agents on the XRP Ledger. Continuous
            cryptographic policy evaluation safeguards all outbound liquidity.
          </p>
        </div>

        {/* Global Page Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] leading-4 font-medium shadow-xs hover:bg-surface-container-low transition-colors whitespace-nowrap"
          >
            <Download className="w-[18px] h-[18px] text-on-surface-variant" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'blocked' ? 'all' : 'blocked'))
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] leading-4 font-medium shadow-xs hover:bg-surface-container-low transition-colors whitespace-nowrap"
          >
            <Filter className="w-[18px] h-[18px] text-on-surface-variant" />
            <span>{statusFilter === 'blocked' ? 'Show All Statuses' : 'Filter by Ledger Status'}</span>
          </button>
          <button
            type="button"
            onClick={pauseAllAgents}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error text-on-error text-[13px] leading-4 font-medium shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            <PauseCircle className="w-[18px] h-[18px]" />
            <span>New Emergency Hold</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Tiles (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1 */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-[14px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Total Payments
            </span>
            <span className="p-1 rounded-md bg-surface-container text-primary">
              <FileText className="w-[18px] h-[18px]" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                148
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">TXS</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant pt-1">
            <span className="text-[12px] leading-4">All-time simulation</span>
            <span className="inline-flex items-center gap-1 text-[12px] leading-4 font-semibold text-primary">
              <Calendar className="w-3.5 h-3.5" />
              18 today
            </span>
          </div>
        </div>

        {/* Tile 2 */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-[14px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Successful Payments
            </span>
            <span className="p-1 rounded-md bg-tertiary-container/10 text-tertiary-container">
              <BadgeCheck className="w-[18px] h-[18px]" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                139
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-normal">
                Settled
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] leading-4 text-on-surface-variant">Validated by XRPL</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-tertiary-container/15 text-tertiary text-[11px] leading-[14px] font-semibold">
              93.9% auto-approved
            </span>
          </div>
        </div>

        {/* Tile 3 */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-[14px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Blocked Payments
            </span>
            <span className="p-1 rounded-md bg-error-container text-error">
              <ShieldAlert className="w-[18px] h-[18px]" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-error tabular-nums">
                9
              </span>
              <span className="text-[16px] leading-6 text-error font-normal">Intercepted</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] leading-4 text-on-surface-variant">Pre-signature hold</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[11px] leading-[14px] font-semibold">
              100% funds protected
            </span>
          </div>
        </div>

        {/* Tile 4 */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-[14px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Pending Verification
            </span>
            <span className="p-1 rounded-md bg-surface-container text-secondary">
              <Clock className="w-[18px] h-[18px]" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                0
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-normal">
                In Queue
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] leading-4 text-on-surface-variant">Deterministic auth</span>
            <span className="font-mono text-[11px] text-on-surface-variant">avg 140ms</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Panel */}
      <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          <div className="relative min-w-[260px] max-w-md flex-1">
            <Search className="w-5 h-5 text-on-surface-variant absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor, transaction ID, or XRP address..."
              className="w-full pl-10 pr-3 py-2 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 rounded-lg text-[13px] leading-[18px] focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-container-low rounded-lg shrink-0">
            {(
              [
                { id: 'all', label: 'All', count: 148 },
                { id: 'settled', label: 'Settled', count: 139 },
                { id: 'blocked', label: 'Blocked', count: 9 },
                { id: 'review', label: 'Manual Review', count: 0 },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1 rounded text-[12px] leading-4 font-semibold transition-all whitespace-nowrap ${
                  statusFilter === pill.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {pill.label} <span className="ml-0.5 opacity-80">({pill.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-surface-container-low text-on-surface text-[12px] leading-4 font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <option>All Agents</option>
              <option>Procurement Agent</option>
              <option>Liquidity Rebalancer</option>
              <option>Payroll Disburser</option>
            </select>
            <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-surface-container-low text-on-surface text-[12px] leading-4 font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <option>Today (Past 24h)</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>Custom Epoch</option>
            </select>
            <Calendar className="w-4 h-4 text-on-surface-variant absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table with Integrated Inspector Drawer */}
      <div className="relative flex flex-col xl:flex-row gap-4 items-start">
        <div className="w-full flex-1 overflow-hidden bg-surface-container-lowest rounded-xl shadow-sm transition-all duration-300">
          <div className="px-4 py-3 bg-surface-container-low/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] leading-4 text-on-surface font-semibold">
                Ledger Stream
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                Showing latest autonomous dispatches
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              <span>Zero-Knowledge Policy Interceptor Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] leading-[14px] uppercase tracking-wider h-10 select-none">
                  <th className="pl-4 pr-2 py-2">Transaction ID</th>
                  <th className="px-3 py-2">Supplier / Payee</th>
                  <th className="px-3 py-2">Initiating Agent</th>
                  <th className="px-3 py-2 text-right">Amount (XRP / USD)</th>
                  <th className="px-3 py-2">Policy Decision</th>
                  <th className="px-3 py-2">XRPL Status</th>
                  <th className="px-3 py-2">Date / Timestamp</th>
                  <th className="pr-4 pl-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low text-[13px] leading-[18px] text-on-surface">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-on-surface-variant">
                      No payments matched your active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((tx) => {
                    const isBlocked = tx.status === 'Blocked';
                    const isSelected = drawerOpen && selectedTx.id === tx.id;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => {
                          setSelectedTxId(tx.id);
                          setDrawerOpen(true);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? isBlocked
                              ? 'bg-error-container/25'
                              : 'bg-surface-container-low'
                            : isBlocked
                              ? 'bg-error-container/10 hover:bg-error-container/20'
                              : 'hover:bg-surface-container-low/40'
                        }`}
                      >
                        <td
                          className={`pl-4 pr-2 py-3.5 font-mono text-[11px] font-semibold ${
                            isBlocked ? 'text-error' : 'text-primary'
                          }`}
                        >
                          {tx.id}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[13px] font-semibold ${
                                  tx.id === 'REQ-98382' ? 'text-error' : 'text-on-surface'
                                }`}
                              >
                                {tx.vendor}
                              </span>
                              {tx.id === 'REQ-98405' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                              )}
                              {tx.id === 'REQ-98382' && (
                                <AlertTriangle className="w-3.5 h-3.5 text-error" />
                              )}
                            </div>
                            <span className="text-[11px] leading-[14px] text-on-surface-variant">
                              {tx.vendorSubtitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface text-[12px] font-medium whitespace-nowrap">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                            {tx.agent}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums">
                          <div className="flex flex-col items-end">
                            <span
                              className={`font-semibold ${
                                isBlocked ? 'text-error' : 'text-on-surface'
                              }`}
                            >
                              {tx.amountXrp.toFixed(2)} XRP
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              ${tx.amountUsd.toFixed(2)} USD
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          {isBlocked ? (
                            <div className="flex items-center gap-1.5 text-error">
                              {tx.id === 'REQ-98382' ? (
                                <Ban className="w-4 h-4 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 shrink-0" />
                              )}
                              <span className="text-[12px] font-semibold">{tx.policySummary}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-tertiary">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="text-[12px] font-medium">
                                Approved (Allowlist &amp; Budget)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                                isBlocked
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-tertiary-container/15 text-tertiary'
                              }`}
                            >
                              {tx.xrplStatusLabel}
                            </span>
                            <span className="font-mono text-[10px] text-on-surface-variant mt-0.5">
                              {tx.ledgerRef}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                          {tx.timestampFull}
                        </td>
                        <td className="pr-4 pl-3 py-3.5 text-right">
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors whitespace-nowrap ${
                              tx.id === 'REQ-98405'
                                ? 'bg-error text-on-error hover:opacity-90'
                                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            {isBlocked ? 'Inspect Decision' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-[12px]">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span>Displaying 1–{filteredRows.length} of 148 transactions</span>
              <span className="text-outline-variant">&middot;</span>
              <span className="text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                Node WebSocket Synchronized
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button type="button" className="px-2.5 py-1 rounded bg-primary text-on-primary font-medium">
                1
              </button>
              <button
                type="button"
                onClick={() => pushToast('Showing page 1 simulation snapshot.', 'info')}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface hover:bg-surface-container"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => pushToast('Showing page 1 simulation snapshot.', 'info')}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface hover:bg-surface-container"
              >
                3
              </button>
              <span className="px-1 text-on-surface-variant">...</span>
              <button
                type="button"
                onClick={() => pushToast('Showing page 1 simulation snapshot.', 'info')}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface hover:bg-surface-container"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Slide-Over Detail Drawer / Cryptographic Inspector */}
        {drawerOpen && selectedTx && (
          <div className="w-full xl:w-[460px] shrink-0 bg-surface-container-lowest rounded-xl shadow-md p-4 flex flex-col gap-3 sticky top-20">
            <div className="flex items-center justify-between pb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-[16px] leading-6 font-semibold text-on-surface">
                    Transaction Details
                  </span>
                </div>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    selectedTx.status === 'Blocked' ? 'text-error' : 'text-primary'
                  }`}
                >
                  {selectedTx.id}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Testnet Simulation
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {selectedTx.status === 'Blocked' ? (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container flex items-start gap-2">
                <Shield className="w-6 h-6 text-error shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold tracking-tight text-error">
                    BLOCKED BY INDEPENDENT AUTHORIZATION
                  </span>
                  <span className="text-[13px] text-on-error-container mt-0.5">
                    Autonomous agent attempted to dispatch capital exceeding hard executive ceiling
                    limits.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-tertiary-container/15 text-tertiary flex items-start gap-2">
                <CheckCircle2 className="w-6 h-6 text-tertiary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold tracking-tight text-tertiary">
                    AUTHORIZED &amp; SETTLED ON XRPL
                  </span>
                  <span className="text-[13px] text-on-surface mt-0.5">
                    Cleared all deterministic policy rules and finalized via isolated HSM signature.
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface-container-low">
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  Payment Amount
                </span>
                <span
                  className={`text-[20px] leading-7 font-bold tabular-nums ${
                    selectedTx.status === 'Blocked' ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {selectedTx.amountXrp.toFixed(2)} XRP
                </span>
                <span className="text-[11px] text-on-surface-variant tabular-nums">
                  &approx; ${selectedTx.amountUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  Initiating Agent
                </span>
                <span className="text-[13px] font-semibold text-on-surface">
                  {selectedTx.agent} v2.4
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {selectedTx.agentId}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[13px]">
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant text-[11px] uppercase">Sender Vault:</span>
                <span className="font-mono text-[11px] text-on-surface font-medium">
                  {selectedTx.senderVault}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant text-[11px] uppercase">Payee Wallet:</span>
                <span
                  className={`font-mono text-[11px] font-medium ${
                    selectedTx.status === 'Blocked' ? 'text-error' : 'text-primary'
                  }`}
                >
                  {selectedTx.payeeWallet}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest">
                <span className="text-on-surface-variant text-[11px] uppercase">Invoice Ref:</span>
                <span className="font-mono text-[11px] text-on-surface">
                  {selectedTx.invoiceRef}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
                  Independent Policy Rules
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {selectedTx.checks.length} Checks Run
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedTx.checks.map((chk) => (
                  <div
                    key={chk.name}
                    className={`p-2.5 rounded-lg flex items-start gap-2 ${
                      chk.passed ? 'bg-surface-container-low' : 'bg-error-container/40'
                    }`}
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-[18px] h-[18px] text-tertiary shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-[18px] h-[18px] text-error shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[13px] font-semibold ${
                            chk.passed ? 'text-on-surface' : 'text-error'
                          }`}
                        >
                          {chk.name}
                        </span>
                        <span
                          className={`text-[11px] font-semibold uppercase ${
                            chk.passed ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          {chk.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">{chk.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container text-on-surface flex flex-col gap-1 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold">Engine Verdict:</span>
                <span
                  className={`text-[11px] font-bold uppercase ${
                    selectedTx.status === 'Blocked' ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  {selectedTx.engineVerdict}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">{selectedTx.verdictExplanation}</p>
              <div className="mt-1 pt-1 flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                <span>Audit Proof:</span>
                <span className="text-primary truncate ml-2">{selectedTx.auditProof}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => requestCfoOverride(selectedTx.id)}
                className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary text-[13px] font-semibold shadow-xs hover:bg-primary-container transition-colors text-center whitespace-nowrap"
              >
                Request CFO Override
              </button>
              <button
                type="button"
                onClick={() => flagAgentTransaction(selectedTx.id)}
                className="flex-1 py-2 px-3 rounded-lg bg-surface-container-low text-error text-[13px] font-semibold hover:bg-error-container hover:text-on-error-container transition-colors text-center whitespace-nowrap"
              >
                Flag Agent Behavior
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
