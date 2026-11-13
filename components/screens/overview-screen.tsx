'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  SlidersHorizontal,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Clock,
  Bot,
  ShieldAlert,
  Ban,
  BadgeCheck,
  Search,
  ChevronRight,
  Lock,
  X,
  Check,
  Minus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '@/components/treasury-context';
import { TransactionRecord } from '@/lib/treasury-data';

type VelocityRange = 'hourly' | 'daily' | '7d';

const VELOCITY_SERIES: Record<
  VelocityRange,
  { labels: string[]; bars: { xLabel: string; settled: number; blocked?: number; tooltip: string }[] }
> = {
  hourly: {
    labels: ['04:00', '08:00', '10:00', '12:00', '14:00 (Breach)', '18:00', 'Now'],
    bars: [
      { xLabel: '04:00', settled: 0, tooltip: '0.00 XRP' },
      { xLabel: '08:00', settled: 0, tooltip: '0.00 XRP' },
      { xLabel: '10:00', settled: 12, tooltip: '12.00 XRP · Atlas Bearings' },
      { xLabel: '12:00', settled: 6, tooltip: '6.00 XRP · Prime Components' },
      { xLabel: '14:00', settled: 0, blocked: 35, tooltip: '35.00 XRP BLOCKED · Global Parts' },
      { xLabel: '18:00', settled: 0, tooltip: 'Idle' },
    ],
  },
  daily: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    bars: [
      { xLabel: 'Mon', settled: 22, tooltip: '22.00 XRP Settled' },
      { xLabel: 'Tue', settled: 34, tooltip: '34.00 XRP Settled' },
      { xLabel: 'Wed', settled: 19.5, tooltip: '19.50 XRP Settled' },
      { xLabel: 'Thu', settled: 41, blocked: 28, tooltip: '41.00 XRP Settled · 28.00 XRP Blocked' },
      { xLabel: 'Fri', settled: 26, tooltip: '26.00 XRP Settled' },
      { xLabel: 'Today', settled: 18, blocked: 35, tooltip: '18.00 XRP Settled · 35.00 XRP Blocked' },
    ],
  },
  '7d': {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    bars: [
      { xLabel: 'Day 1', settled: 15, tooltip: '15.00 XRP' },
      { xLabel: 'Day 2', settled: 28, tooltip: '28.00 XRP' },
      { xLabel: 'Day 3', settled: 19.5, tooltip: '19.50 XRP' },
      { xLabel: 'Day 4', settled: 8.5, blocked: 15, tooltip: '8.50 XRP · 15.00 XRP Blocked' },
      { xLabel: 'Day 5', settled: 31, tooltip: '31.00 XRP' },
      { xLabel: 'Day 6', settled: 18, blocked: 35, tooltip: '18.00 XRP · 35.00 XRP Blocked' },
    ],
  },
};

export function OverviewScreen() {
  const {
    setActivePath,
    transactions,
    agents,
    policies,
    treasuryBalanceXrp,
    spentTodayXrp,
    pauseAllAgents,
    resumeAllAgents,
    pushToast,
  } = useTreasury();

  const [velocityRange, setVelocityRange] = useState<VelocityRange>('hourly');
  const [txFilter, setTxFilter] = useState('');
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'trace' | 'detail' | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const remainingBudget = Math.max(0, policies.dailyAggregateLimit - spentTodayXrp);
  const spentPct = policies.dailyAggregateLimit > 0
    ? Math.min(100, Math.round((spentTodayXrp / policies.dailyAggregateLimit) * 100))
    : 0;
  const remainingPct = Math.max(0, 100 - spentPct);

  const activeAgentCount = agents.filter((a) => a.status === 'Active').length;
  const isAllPaused = activeAgentCount === 0 || policies.emergencyFreeze;

  const filteredTransactions = transactions.slice(0, 4).filter((tx) => {
    if (!txFilter.trim()) return true;
    const q = txFilter.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.vendor.toLowerCase().includes(q) ||
      tx.purpose.toLowerCase().includes(q)
    );
  });

  const handleExportReport = () => {
    const csvRows = [
      ['Tx ID', 'Vendor', 'Purpose', 'Agent', 'Amount (XRP)', 'Time', 'Policy Decision', 'Status'].join(','),
      ...transactions.map((t) =>
        [t.id, `"${t.vendor}"`, `"${t.purpose}"`, `"${t.agent}"`, t.amountXrp.toFixed(2), `"${t.timeDisplay}"`, `"${t.policySummary}"`, t.status].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aegis-treasury-overview-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    pushToast('Executive treasury report exported (CSV).', 'success');
  };

  const currentSeries = VELOCITY_SERIES[velocityRange];
  const barXPositions = [75, 185, 295, 405, 515, 625];

  return (
    <div className="flex flex-col w-full">
      {/* Top Section: Header & Live System Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[11px] leading-[14px] uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              XRPL Testnet · Demo Environment
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] leading-[14px] font-semibold tracking-tight ${
                isAllPaused
                  ? 'bg-error-container text-error'
                  : 'bg-tertiary-container/15 text-tertiary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAllPaused
                ? 'Emergency Halt: Autonomous Signing Suspended'
                : 'Autonomous Policy Engine: Active & Enforcing'}
            </span>
          </div>
          <h1 className="text-[24px] leading-8 tracking-[-0.02em] font-semibold text-on-surface">
            Good morning, Finance Team
          </h1>
          <p className="text-[14px] leading-5 text-on-surface-variant">
            Here&apos;s what&apos;s happening with your corporate treasury and autonomous agents today.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] leading-4 font-medium shadow-sm hover:bg-surface-container-low transition-all whitespace-nowrap"
          >
            <Download className="w-[18px] h-[18px] text-on-surface-variant" />
            <span>Export Report</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePath('spending-policies')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface text-[13px] leading-4 font-medium shadow-sm hover:bg-surface-container-highest transition-all whitespace-nowrap"
          >
            <SlidersHorizontal className="w-[18px] h-[18px] text-primary" />
            <span>Manage Policies</span>
          </button>
          {isAllPaused ? (
            <button
              type="button"
              onClick={resumeAllAgents}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tertiary text-on-tertiary text-[13px] leading-4 font-medium shadow-sm hover:bg-tertiary-container transition-all whitespace-nowrap"
            >
              <PlayCircle className="w-[18px] h-[18px]" />
              <span>Resume All Agents</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPauseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error text-on-error text-[13px] leading-4 font-medium shadow-sm hover:bg-error/90 transition-all whitespace-nowrap"
            >
              <PauseCircle className="w-[18px] h-[18px]" />
              <span>Pause All Agents</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Stat Cards: 4 Column Executive Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Treasury Balance */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] leading-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Treasury Balance
            </span>
            <span className="font-mono text-[11px] leading-4 text-primary px-1.5 py-0.5 rounded bg-surface-container font-medium">
              rApexTreasury...9kQ2
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                {treasuryBalanceXrp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-medium">XRP</span>
            </div>
            <p className="font-mono text-[11px] leading-4 text-on-surface-variant mt-0.5 tabular-nums">
              ≈ ${(treasuryBalanceXrp * 0.57).toFixed(2)} USD
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-1 text-tertiary text-[12px] leading-4 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Safe Reserve: &gt; 500 XRP required</span>
            </div>
            <svg className="w-16 h-5 text-tertiary-container" fill="none" stroke="currentColor" viewBox="0 0 64 20">
              <path
                d="M1 15 L14 11 L28 14 L42 7 L56 9 L63 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Spent Today */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] leading-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Spent Today
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container text-on-surface text-[11px] leading-[14px] font-semibold">
              3 Transacted
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                {spentTodayXrp.toFixed(2)}
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-medium">XRP</span>
            </div>
            <p className="text-[13px] leading-[18px] text-on-surface-variant mt-0.5">
              {spentPct}% of daily allocation cap
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex flex-col gap-1.5">
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-500"
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] leading-[14px] text-on-surface-variant">
              <span>+6.00 XRP pending queue</span>
              <span className="font-semibold text-primary tabular-nums">{spentPct}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Daily Spending Limit */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] leading-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Daily Spending Limit
            </span>
            <span className="text-[11px] leading-[14px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
              Rule #POL-01
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface tabular-nums">
                {policies.dailyAggregateLimit.toFixed(2)}
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-medium">XRP</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-[13px] leading-[18px] mt-0.5">
              <Clock className="w-[15px] h-[15px]" />
              <span>Reset in 14h 22m (00:00 UTC)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-on-surface-variant text-[11px] leading-[14px]">
            <span className="truncate">Ceiling enforced independently</span>
            <span className="inline-block px-1.5 py-0.5 rounded bg-secondary-fixed/40 text-on-secondary-fixed font-semibold">
              Strict
            </span>
          </div>
        </div>

        {/* Card 4: Remaining Daily Budget */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] leading-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Remaining Budget
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary-container" />
              <span className="text-[11px] leading-[14px] font-semibold text-tertiary">
                Buffer Adequate
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-primary-container tabular-nums">
                {remainingBudget.toFixed(2)}
              </span>
              <span className="text-[16px] leading-6 text-on-surface-variant font-medium">XRP</span>
            </div>
            <p className="text-[13px] leading-[18px] text-on-surface-variant mt-0.5">
              {remainingPct}% available for authorized agents
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-[11px] leading-[14px]">
            <span className="text-on-surface-variant">Max Single Tx Limit</span>
            <span className="font-mono text-[11px] leading-4 text-on-surface font-semibold tabular-nums">
              {policies.maxSingleTxLimit.toFixed(2)} XRP
            </span>
          </div>
        </div>
      </div>

      {/* Operational Middle Section: 2:1 Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Velocity & Activity Chart (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col p-6 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[16px] leading-6 font-semibold text-on-surface">
                Payment &amp; Spending Velocity
              </h2>
              <p className="text-[11px] leading-[14px] text-on-surface-variant mt-0.5">
                Autonomous transaction requests vs. settled XRPL transfers
              </p>
            </div>
            {/* Time Segment Filter */}
            <div className="inline-flex p-0.5 rounded-lg bg-surface-container self-start sm:self-auto">
              {(
                [
                  { id: 'hourly', label: 'Hourly' },
                  { id: 'daily', label: 'Daily' },
                  { id: '7d', label: '7 Days' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setVelocityRange(tab.id)}
                  className={`px-3 py-1 rounded-md text-[12px] leading-4 transition-colors ${
                    velocityRange === tab.id
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="relative w-full h-64 flex flex-col justify-end pt-4 pb-2">
            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 760 210">
              <line
                className="text-surface-container-high"
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                x1="30"
                x2="750"
                y1="20"
                y2="20"
              />
              <text className="fill-on-surface-variant font-mono text-[10px]" x="5" y="24">
                {Math.round(policies.dailyAggregateLimit)}
              </text>
              <line
                className="text-surface-container-high"
                stroke="currentColor"
                strokeDasharray="2 2"
                strokeWidth="1"
                x1="30"
                x2="750"
                y1="75"
                y2="75"
              />
              <text className="fill-on-surface-variant font-mono text-[10px]" x="5" y="79">
                {Math.round(policies.dailyAggregateLimit * 0.7)}
              </text>
              <line
                className="text-surface-container-high"
                stroke="currentColor"
                strokeDasharray="2 2"
                strokeWidth="1"
                x1="30"
                x2="750"
                y1="130"
                y2="130"
              />
              <text className="fill-on-surface-variant font-mono text-[10px]" x="5" y="134">
                {Math.round(policies.dailyAggregateLimit * 0.4)}
              </text>
              <line
                className="text-surface-container-highest"
                stroke="currentColor"
                strokeWidth="1"
                x1="30"
                x2="750"
                y1="185"
                y2="185"
              />
              <text className="fill-on-surface-variant font-mono text-[10px]" x="5" y="189">
                0
              </text>

              <rect className="fill-primary" height="18" rx="4" width="128" x="622" y="10" />
              <text className="fill-on-primary text-[10px] font-semibold" x="630" y="22">
                Strict Daily Cap: {policies.dailyAggregateLimit.toFixed(0)} XRP
              </text>

              {currentSeries.bars.map((bar, idx) => {
                const x = barXPositions[idx] ?? 75;
                const scaleMax = Math.max(policies.dailyAggregateLimit, 50);
                const maxBarHeight = 165;
                if (bar.blocked) {
                  const h = Math.min(maxBarHeight, Math.max(30, (bar.blocked / scaleMax) * maxBarHeight));
                  const y = 185 - h;
                  return (
                    <g
                      key={bar.xLabel}
                      className="cursor-pointer group"
                      onClick={() => {
                        setDrawerMode('trace');
                        setSelectedTx(transactions.find((t) => t.id === 'REQ-98405') || null);
                      }}
                    >
                      <rect
                        className="fill-error/15 stroke-error stroke-2 transition-all"
                        strokeDasharray="4 2"
                        height={h}
                        rx="3"
                        width="34"
                        x={x}
                        y={y}
                      />
                      <rect className="fill-error" height="22" rx="3" width="34" x={x} y={y} />
                      <text
                        className="fill-on-error text-[9px] font-bold"
                        textAnchor="middle"
                        x={x + 17}
                        y={y + 14}
                      >
                        BLOCKED
                      </text>
                      <text
                        className="fill-error font-mono text-[11px] font-bold"
                        textAnchor="middle"
                        x={x + 17}
                        y={y - 7}
                      >
                        {bar.blocked} XRP
                      </text>
                    </g>
                  );
                }

                if (bar.settled > 0) {
                  const h = Math.min(maxBarHeight, Math.max(12, (bar.settled / scaleMax) * maxBarHeight));
                  const y = 185 - h;
                  return (
                    <g key={bar.xLabel} className="cursor-pointer group">
                      <rect
                        className="fill-primary-container transition-all group-hover:brightness-110"
                        height={h}
                        rx="3"
                        width="34"
                        x={x}
                        y={y}
                      />
                      <text
                        className="fill-on-surface font-mono text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        textAnchor="middle"
                        x={x + 17}
                        y={y - 8}
                      >
                        {bar.settled} XRP
                      </text>
                    </g>
                  );
                }

                return (
                  <rect
                    key={bar.xLabel}
                    className="fill-surface-container-highest"
                    height="2"
                    rx="2"
                    width="34"
                    x={x}
                    y="183"
                  />
                );
              })}
            </svg>

            <div className="flex justify-between pl-8 pr-6 text-on-surface-variant text-[11px] leading-[14px] font-medium">
              {currentSeries.labels.map((lbl) => (
                <span
                  key={lbl}
                  className={
                    lbl.includes('Breach')
                      ? 'text-error font-semibold'
                      : lbl === 'Now' || lbl === 'Today'
                        ? 'text-primary font-semibold'
                        : ''
                  }
                >
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-2 text-[11px] leading-[14px]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-container" />
                <span className="text-on-surface">Settled Autonomous Transfers (18.00 XRP)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-error" />
                <span className="text-on-surface">Blocked Policy Breach (35.00 XRP)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 border-b-2 border-dashed border-primary" />
                <span className="text-on-surface-variant">
                  Hard Ceiling ({policies.dailyAggregateLimit.toFixed(2)} XRP)
                </span>
              </div>
            </div>
            <div className="text-on-surface-variant font-mono text-[11px]">
              Aegis Enclave Latency: <span className="text-tertiary font-semibold">14ms</span>
            </div>
          </div>
        </div>

        {/* Right Side: Two Executive Panels (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Active Agents Control Status Card */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-surface-container">
              <div className="flex items-center gap-1.5">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="text-[16px] leading-6 font-semibold text-on-surface">
                  Active Agents Status
                </h3>
              </div>
              <span
                className={`text-[11px] leading-[14px] px-1.5 py-0.5 rounded font-semibold ${
                  activeAgentCount > 0
                    ? 'text-tertiary bg-tertiary-container/10'
                    : 'text-error bg-error-container'
                }`}
              >
                {activeAgentCount} Live
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {agents.slice(0, 2).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setActivePath('ai-agents')}
                  className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] leading-4 text-on-surface font-semibold">
                      {agent.name} {agent.version.slice(0, 4)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] leading-[14px] px-1.5 py-0.5 rounded font-semibold ${
                        agent.status === 'Paused'
                          ? 'bg-error-container text-error'
                          : agent.readOnly
                            ? 'bg-secondary-container text-on-secondary-fixed'
                            : 'bg-tertiary-container/15 text-tertiary'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'Paused'
                            ? 'bg-error'
                            : agent.readOnly
                              ? 'bg-primary'
                              : 'bg-tertiary-container'
                        }`}
                      />
                      {agent.status === 'Paused'
                        ? 'Paused'
                        : agent.readOnly
                          ? 'Read-Only'
                          : 'Active'}
                    </span>
                  </div>

                  {!agent.readOnly ? (
                    <>
                      <div className="flex items-center justify-between text-on-surface-variant text-[11px] leading-[14px]">
                        <span>Executed: {agent.paymentsToday} payments today</span>
                        <span>Last active: 14m ago</span>
                      </div>
                      <div className="mt-1">
                        <div className="flex justify-between font-mono text-[11px] text-on-surface mb-1 tabular-nums">
                          <span>Budget Consumed</span>
                          <span className="font-semibold">
                            {agent.budgetConsumed} / {policies.dailyAggregateLimit} XRP
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary-container h-full rounded-full"
                            style={{ width: `${spentPct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-on-surface-variant text-[11px] leading-[14px]">
                        <span>Scanned 142 XRPL Ledgers</span>
                        <span className="font-mono text-[11px]">Sync: 100%</span>
                      </div>
                      <p className="text-[11px] leading-[14px] text-on-surface-variant">
                        Zero signing permissions granted. Pure compliance sentinel.
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Policy & Authorization Alerts Card */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col flex-1">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-surface-container">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-error" />
                <h3 className="text-[16px] leading-6 font-semibold text-on-surface">
                  Policy &amp; Audit Alerts
                </h3>
              </div>
              <span className="text-[11px] leading-[14px] text-on-surface-variant font-mono">
                Live Stream
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Alert Item 1: Blocked Breach */}
              <div className="p-3 rounded-lg bg-error-container/20 border-l-4 border-error flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1 text-error text-[13px] leading-4 font-semibold">
                    <Ban className="w-[18px] h-[18px] shrink-0" />
                    <span>Payment Request Rejected (35.00 XRP)</span>
                  </div>
                  <span className="text-[11px] leading-[14px] text-error font-medium shrink-0">
                    14:23 UTC
                  </span>
                </div>
                <p className="text-[13px] leading-[18px] text-on-surface">
                  Target: <strong className="font-semibold">Global Parts Ltd</strong>. Exceeds single tx
                  cap (&le;{policies.maxSingleTxLimit.toFixed(0)} XRP) &amp; daily buffer.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] leading-[14px] text-on-surface-variant">
                    Aegis halted prior to key authorization
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTx(transactions.find((t) => t.id === 'REQ-98405') || null);
                      setDrawerMode('trace');
                    }}
                    className="text-primary text-[12px] leading-4 font-semibold hover:underline"
                  >
                    Inspect Trace &rarr;
                  </button>
                </div>
              </div>

              {/* Alert Item 2: Vendor Verified Notice */}
              <div className="p-3 rounded-lg bg-tertiary-container/10 border-l-4 border-tertiary flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1 text-tertiary text-[13px] leading-4 font-semibold">
                    <BadgeCheck className="w-[18px] h-[18px] shrink-0" />
                    <span>Vendor Allowlist Cleared</span>
                  </div>
                  <span className="text-[11px] leading-[14px] text-on-surface-variant shrink-0">
                    09:15 UTC
                  </span>
                </div>
                <p className="text-[13px] leading-[18px] text-on-surface">
                  Atlas Bearings invoice{' '}
                  <code className="font-mono text-[11px] bg-surface-container px-1 rounded text-primary">
                    #INV-8821
                  </code>{' '}
                  matched cryptographic vendor registry.
                </p>
                <span className="text-[11px] leading-[14px] text-tertiary font-medium">
                  Automatic multi-signature authorized
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Autonomous Transactions Strict Financial Table */}
      <div className="rounded-xl bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden mb-6">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-container">
          <div>
            <h2 className="text-[16px] leading-6 font-semibold text-on-surface">
              Recent Autonomous Transactions
            </h2>
            <p className="text-[11px] leading-[14px] text-on-surface-variant mt-0.5">
              Continuous ledger operations executed or halted under programmed treasury rules
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3 top-2" />
              <input
                type="text"
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                placeholder="Filter transaction or vendor..."
                className="pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low border-0 text-[13px] leading-[18px] text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary outline-none w-56 sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => setActivePath('payments')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-[12px] leading-4 font-medium hover:bg-surface-container-high transition-colors whitespace-nowrap"
            >
              <span>View All Payments</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] leading-[14px] uppercase tracking-wider h-10 border-b border-surface-container">
                <th className="px-4 py-2 font-semibold">Tx ID / Ref</th>
                <th className="px-4 py-2 font-semibold">Vendor &amp; Purpose</th>
                <th className="px-4 py-2 font-semibold">Agent</th>
                <th className="px-4 py-2 font-semibold text-right">Amount</th>
                <th className="px-4 py-2 font-semibold">Time (UTC)</th>
                <th className="px-4 py-2 font-semibold">Policy Decision</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-[13px] leading-[18px] text-on-surface">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                    No matching transactions for &ldquo;{txFilter}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isBlocked = tx.status === 'Blocked';
                  return (
                    <tr
                      key={tx.id}
                      className={
                        isBlocked
                          ? 'bg-error-container/10 hover:bg-error-container/20 transition-colors'
                          : 'hover:bg-surface-container-low/50 transition-colors'
                      }
                    >
                      <td
                        className={`px-4 py-3 font-mono text-[11px] font-semibold ${
                          isBlocked ? 'text-error' : 'text-primary'
                        }`}
                      >
                        {tx.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">{tx.vendor}</span>
                          <span className="text-[11px] leading-[14px] text-on-surface-variant">
                            {tx.purpose}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12px] leading-4 font-medium text-on-surface whitespace-nowrap">
                          <Bot className="w-4 h-4 text-primary" />
                          {tx.agent}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-[13px] tabular-nums ${
                          isBlocked ? 'font-bold text-error' : 'font-semibold text-on-surface'
                        }`}
                      >
                        {tx.amountXrp.toFixed(2)}{' '}
                        <span className="font-normal text-on-surface-variant text-[11px]">XRP</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-[11px] leading-[14px]">
                        {tx.timeDisplay}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isBlocked ? 'bg-error' : 'bg-tertiary-container'
                            }`}
                          />
                          <span
                            className={`text-[12px] leading-4 ${
                              isBlocked ? 'font-semibold text-error' : 'font-medium text-tertiary'
                            }`}
                          >
                            {tx.policySummary}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error text-on-error text-[11px] leading-[14px] font-semibold whitespace-nowrap">
                            <Ban className="w-3 h-3" />
                            Blocked by Aegis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary-container/15 text-tertiary text-[11px] leading-[14px] font-semibold whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTx(tx);
                            setDrawerMode(isBlocked ? 'trace' : 'detail');
                          }}
                          className={`text-[12px] leading-4 font-semibold transition-colors whitespace-nowrap ${
                            isBlocked
                              ? 'text-error hover:text-on-error-container'
                              : 'text-primary hover:text-primary-container'
                          }`}
                        >
                          {isBlocked ? 'View Policy Audit' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Isolated Enclave Architecture Guarantee Callout */}
      <div className="p-4 rounded-xl bg-surface-container-high border-l-4 border-primary-container flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[16px] leading-6 font-semibold text-on-surface">
              Independent Authorization Engine
            </h4>
            <p className="text-[13px] leading-[18px] text-on-surface-variant">
              Running on isolated verification enclaves. Autonomous agents propose payment requests
              but <strong>never possess raw XRPL signing credentials</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] leading-[14px] text-on-surface-variant font-mono">
            Ledger Hash: 0x9f4a...88c2
          </span>
          <button
            type="button"
            onClick={() => setActivePath('audit-trail')}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-[12px] leading-4 font-medium shadow-xs hover:bg-surface-bright transition-colors whitespace-nowrap"
          >
            Audit Architecture &rarr;
          </button>
        </div>
      </div>

      {/* Interactive Slide-over Drawer for Policy Trace / Transaction Details */}
      <AnimatePresence>
        {drawerMode && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerMode(null)}
              className="absolute inset-0 bg-on-surface/40 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-surface-container-lowest h-full shadow-2xl z-10 flex flex-col justify-between"
            >
              <div>
                <div className="p-6 border-b border-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-[22px] h-[22px] text-primary" />
                    <span className="text-[16px] leading-6 font-semibold text-on-surface">
                      {drawerMode === 'trace'
                        ? 'Policy Audit Trace'
                        : `Transaction ${selectedTx?.id ?? ''}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerMode(null)}
                    className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {drawerMode === 'trace' ? (
                  <div className="p-6 flex flex-col gap-5">
                    <div className="p-3 rounded-lg bg-error-container/20">
                      <div className="flex items-center justify-between text-error font-semibold text-[11px] uppercase">
                        <span>Halted at Step 2 (Deterministic)</span>
                        <span>Rule POL-02 Breach</span>
                      </div>
                      <h4 className="text-[16px] leading-6 font-semibold text-on-surface mt-1">
                        Transaction REQ-98405 Blocked
                      </h4>
                      <p className="text-[13px] leading-[18px] text-on-surface-variant mt-1">
                        Procurement Agent requested transfer of 35.00 XRP to Global Parts Ltd.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Evaluation Step Log
                      </span>
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-on-surface">
                            1. Vendor Allowlist Match
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Global Parts Ltd registered on enterprise vendor table (Active).
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-error">
                            2. Single Transaction Cap Check
                          </span>
                          <span className="text-[11px] text-on-surface">
                            Limit is <strong className="font-semibold">20.00 XRP</strong>. Requested
                            amount was <strong className="text-error font-semibold">35.00 XRP</strong>{' '}
                            (+75% above permitted parameter).
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 opacity-45">
                        <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                          <Minus className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-on-surface">
                            3. XRPL Key Signing (Isolated Enclave)
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Aborted prior to cryptographic HSM call. Zero funds released.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  selectedTx && (
                    <div className="p-6 flex flex-col gap-5">
                      <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                        <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Settled Ledger Payload
                        </span>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-[20px] leading-7 font-semibold text-on-surface">
                            {selectedTx.vendor}
                          </span>
                          <span className="font-mono text-[13px] font-bold text-primary tabular-nums">
                            {selectedTx.amountXrp.toFixed(2)} XRP
                          </span>
                        </div>
                        <span className="text-[13px] text-tertiary font-semibold mt-1">
                          Status: {selectedTx.status}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-[13px]">
                        <div className="flex justify-between py-1.5 border-b border-surface-container">
                          <span className="text-on-surface-variant">Executing Agent:</span>
                          <span className="font-semibold text-on-surface">
                            {selectedTx.agent} v2.4
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-surface-container">
                          <span className="text-on-surface-variant">Policy Verification:</span>
                          <span className="font-semibold text-on-surface">
                            {selectedTx.policySummary}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-surface-container">
                          <span className="text-on-surface-variant">Ledger Hash:</span>
                          <span className="font-mono text-[11px] text-primary">0x4b7c...9a02</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-surface-container">
                          <span className="text-on-surface-variant">Enclave Signing Key:</span>
                          <span className="font-mono text-[11px] text-on-surface">
                            ED25519 (Enclave HSM)
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="p-6 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
                <span className="font-mono text-[11px] text-on-surface-variant">
                  Audit Proof ID: #AP-884102
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerMode(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-medium shadow-xs hover:bg-surface-bright"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Pause Confirmation Modal */}
      <AnimatePresence>
        {pauseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPauseModalOpen(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="relative bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
                  <PauseCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-[20px] leading-7 font-semibold text-on-surface">
                    Emergency Treasury Halt
                  </h3>
                  <p className="text-[13px] leading-[18px] text-on-surface-variant">
                    Instantly revokes autonomous dispatch keys on XRPL Testnet.
                  </p>
                </div>
              </div>
              <p className="text-[14px] leading-5 text-on-surface">
                Are you sure you want to suspend all autonomous agents? This will immediately prevent
                Procurement Agent and Treasury Monitor from requesting or broadcasting payments.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPauseModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-[13px] font-medium hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pauseAllAgents();
                    setPauseModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-error text-on-error text-[13px] font-medium hover:bg-error/90 transition-colors"
                >
                  Confirm Emergency Pause
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
