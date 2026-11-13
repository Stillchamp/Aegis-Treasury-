'use client';

import React, { useState } from 'react';
import {
  LockKeyhole,
  History,
  BadgeCheck,
  Scale,
  RefreshCw,
  Wallet,
  Info,
  Minus,
  Plus,
  Shield,
  Ban,
  ListChecks,
  GitBranch,
  Zap,
  BellRing,
  KeyRound,
  CheckCircle2,
  X,
  ArrowUp,
  Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '@/components/treasury-context';

export function SpendingPoliciesScreen() {
  const { policies, updatePolicies, setActivePath, spentTodayXrp, pushToast } = useTreasury();

  const [draftDaily, setDraftDaily] = useState(policies.dailyAggregateLimit);
  const [draftSingle, setDraftSingle] = useState(policies.maxSingleTxLimit);
  const [draftWhitelist, setDraftWhitelist] = useState(policies.strictWhitelist);
  const [draftFreeze, setDraftFreeze] = useState(policies.emergencyFreeze);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [territoryInputOpen, setTerritoryInputOpen] = useState(false);
  const [newTerritory, setNewTerritory] = useState('');

  const utilizationPct =
    draftDaily > 0 ? Math.min(100, Math.round((spentTodayXrp / draftDaily) * 100)) : 0;
  const remainingCap = Math.max(0, draftDaily - spentTodayXrp);

  const handleApplyChanges = () => {
    updatePolicies({
      dailyAggregateLimit: draftDaily,
      maxSingleTxLimit: draftSingle,
      strictWhitelist: draftWhitelist,
      emergencyFreeze: draftFreeze,
    });
    setConfirmModalOpen(false);
  };

  const handleAddTerritory = () => {
    const trimmed = newTerritory.trim();
    if (!trimmed) return;
    const code = trimmed.slice(0, 2).toUpperCase();
    updatePolicies({
      jurisdictions: [
        ...policies.jurisdictions,
        { code, name: `${trimmed} (${code})`, regId: `#${code}-REG-09` },
      ],
    });
    setNewTerritory('');
    setTerritoryInputOpen(false);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Action & Policy Enclave Notice Bar */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] uppercase tracking-widest mb-0.5">
              <span>Treasury Governance</span>
              <span>/</span>
              <span className="text-primary font-semibold">Autonomous Guardrails</span>
            </div>
            <h1 className="text-[36px] leading-[44px] tracking-[-0.025em] text-on-surface font-semibold">
              Spending Policies
            </h1>
            <p className="text-[14px] leading-5 text-on-surface-variant mt-0.5">
              Set the deterministic rules your AI agents must strictly follow before signing and
              moving corporate funds on ledger.
            </p>
          </div>

          {/* Action Suite */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDraftFreeze(true);
                setConfirmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error-container text-error hover:bg-error/20 transition-all text-[13px] font-semibold shadow-xs whitespace-nowrap"
            >
              <LockKeyhole className="w-[18px] h-[18px]" />
              <span>Emergency Kill Switch: Freeze All Outflows</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePath('audit-trail')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-[13px] font-medium whitespace-nowrap"
            >
              <History className="w-[18px] h-[18px] text-on-surface-variant" />
              <span>Audit Policy History</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all text-[13px] font-semibold shadow-sm whitespace-nowrap"
            >
              <BadgeCheck className="w-[18px] h-[18px]" />
              <span>Save Policy Changes</span>
            </button>
          </div>
        </div>

        {/* Independent Authorization Service Banner */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-4 shadow-xs">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-primary-fixed-dim/20 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary text-on-primary shrink-0 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] leading-6 text-on-surface font-semibold">
                    Enforced by Independent Aegis Policy Engine
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] bg-tertiary text-on-tertiary font-medium uppercase tracking-wider">
                    Isolated Verification Enclave
                  </span>
                </div>
                <p className="text-[13px] text-on-surface-variant mt-0.5 max-w-4xl">
                  These policies are managed exclusively by authorized human operators. Autonomous AI
                  agents cannot modify, override, or bypass these rules under any operational state.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pl-4 md:pl-0">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-xs">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                <span>SGX Hardware Attested</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Sync & Status Strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 bg-surface-container-lowest p-3 rounded-xl shadow-xs mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
            <RefreshCw className="w-[18px] h-[18px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-on-surface font-semibold">
              Active Synchronization Active
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Policy rules currently synchronized with XRPL authorization worker. 0 active
              discrepancies.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="font-mono text-[11px] text-on-surface-variant">
            <span>Hash: </span>
            <span className="text-primary font-semibold">0x7f4e92a...c8901b</span>
          </div>
          <span className="text-outline-variant">|</span>
          <span className="text-[11px] text-tertiary font-semibold uppercase tracking-wider">
            {draftFreeze ? 'State: Emergency Freeze' : 'State: Fully Compliant'}
          </span>
        </div>
      </div>

      {/* Primary Configuration Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left Column: Core Limits & Thresholds (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Card 1: Spending Thresholds & Limits */}
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-xs flex flex-col">
            <div className="flex items-start justify-between pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <Wallet className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <h2 className="text-[16px] leading-6 text-on-surface font-semibold">
                    Spending Thresholds &amp; Outflow Caps
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Configure quantitative guardrails for autonomous multi-agent treasury drawdowns.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface font-medium">
                Daily Cadence
              </span>
            </div>

            {/* Section 1.1: Daily Spending Limit */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="dailyLimit"
                  className="text-[13px] text-on-surface font-semibold flex items-center gap-1.5"
                >
                  <span>Daily Aggregate Spending Limit</span>
                  <Info className="w-4 h-4 text-on-surface-variant" />
                </label>
                <span className="font-mono text-[11px] text-on-surface-variant tabular-nums">
                  &approx; ${(draftDaily * 0.57).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="dailyLimit"
                    type="number"
                    step="1"
                    value={draftDaily}
                    onChange={(e) => setDraftDaily(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-surface-container-low text-on-surface font-mono text-[20px] leading-7 font-semibold px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-high transition-colors tabular-nums"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono text-[11px] font-semibold">
                      XRP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDraftDaily((v) => Math.max(0, v - 5))}
                    className="w-9 h-9 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                    aria-label="Decrease daily spending limit"
                  >
                    <Minus className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftDaily((v) => v + 5)}
                    className="w-9 h-9 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                    aria-label="Increase daily spending limit"
                  >
                    <Plus className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                Total cumulative amount all autonomous agents combined can spend in any rolling
                24-hour UTC window.
              </p>

              {/* Current Window Utilization Progress */}
              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-on-surface-variant font-medium">24h Limit Utilization</span>
                  <span className="font-mono text-[11px] text-on-surface font-semibold tabular-nums">
                    {spentTodayXrp.toFixed(2)} / {draftDaily.toFixed(2)} XRP ({utilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded transition-all duration-300"
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                  <span className="flex items-center gap-1 text-tertiary font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    {spentTodayXrp.toFixed(2)} XRP spent today
                  </span>
                  <span className="tabular-nums">{remainingCap.toFixed(2)} XRP remaining capacity</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-container-high w-full my-3" />

            {/* Section 1.2: Maximum Single Transaction Limit */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="singleLimit"
                  className="text-[13px] text-on-surface font-semibold flex items-center gap-1.5"
                >
                  <span>Maximum Single Transaction Cap</span>
                  <Shield className="w-4 h-4 text-on-surface-variant" />
                </label>
                <span className="font-mono text-[11px] text-on-surface-variant tabular-nums">
                  &approx; ${(draftSingle * 0.57).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="singleLimit"
                    type="number"
                    step="1"
                    value={draftSingle}
                    onChange={(e) => setDraftSingle(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-surface-container-low text-on-surface font-mono text-[20px] leading-7 font-semibold px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-high transition-colors tabular-nums"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono text-[11px] font-semibold">
                      XRP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDraftSingle((v) => Math.max(0, v - 2))}
                    className="w-9 h-9 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                    aria-label="Decrease single transaction cap"
                  >
                    <Minus className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftSingle((v) => v + 2)}
                    className="w-9 h-9 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                    aria-label="Increase single transaction cap"
                  >
                    <Plus className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                Any single invoice or payment request exceeding this amount is automatically blocked,
                requiring human dual-authorization before signature compilation.
              </p>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-container-high text-on-surface">
                <Ban className="w-[18px] h-[18px] text-error shrink-0 mt-0.5" />
                <div className="flex flex-col text-[11px]">
                  <span className="font-semibold text-on-surface">Enforcement In Action:</span>
                  <span className="text-on-surface-variant">
                    Blocked Global Parts REQ-98405 (35.00 XRP) today because it exceeded the 20.00 XRP
                    single transaction limit. Transferred to manual review queue.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Vendor Whitelist & Recipient Controls */}
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-xs flex flex-col">
            <div className="flex items-start justify-between pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <ListChecks className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <h2 className="text-[16px] leading-6 text-on-surface font-semibold">
                    Vendor Whitelist &amp; Destination Controls
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Restrict agent settlement privileges to cryptographically verified counterparts.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                {draftWhitelist ? 'Zero-Trust Active' : 'Permissive Mode'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low mb-4">
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-on-surface font-semibold">
                    Strict Whitelist Enforcement
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      draftWhitelist
                        ? 'bg-tertiary text-on-tertiary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {draftWhitelist ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  Agents can ONLY execute payments to XRP Ledger addresses registered in the Approved
                  Vendors directory. Unlisted addresses are rejected instantly prior to payload
                  compilation.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={draftWhitelist}
                  onChange={(e) => setDraftWhitelist(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-fixed-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-on-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-primary after:border-surface-dim after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-on-surface font-semibold">
                Authorized Supplier Jurisdictions
              </label>
              <p className="text-[13px] text-on-surface-variant">
                Cross-border payments will only clear through bank conduits or registered business
                entities physically registered in the permitted regulatory jurisdictions below:
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {policies.jurisdictions.map((j) => (
                  <div
                    key={j.regId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-[13px]"
                  >
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span className="font-semibold">{j.name}</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {j.regId}
                    </span>
                  </div>
                ))}

                {territoryInputOpen ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTerritory}
                      onChange={(e) => setNewTerritory(e.target.value)}
                      placeholder="e.g. Rwanda"
                      className="px-2.5 py-1 rounded-lg bg-surface-container-low text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-32"
                    />
                    <button
                      type="button"
                      onClick={handleAddTerritory}
                      className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[12px] font-medium"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTerritoryInputOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[12px] font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Territory</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Approval Tiers & Emergency Safeguards (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-xs flex flex-col">
            <div className="flex items-start justify-between pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <GitBranch className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <h2 className="text-[16px] leading-6 text-on-surface font-semibold">
                    Tiered Approval Governance
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Step-up authorization matrix based on value.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Tier 1 */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    Tier 1: Micro-Expenses
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-surface-container-highest text-on-surface font-semibold">
                    0.01 - 10.00 XRP
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-tertiary font-bold tracking-wide uppercase">
                    Full Autonomous Execution
                  </span>
                  <Zap className="w-[18px] h-[18px] text-tertiary" />
                </div>
                <p className="text-[13px] text-on-surface-variant">
                  Instant policy evaluation &amp; signature settlement. AI agents settle validated
                  supplier recurring fees with zero human intervention.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Tier 2: Intermediate Outflow
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-surface-container-highest text-on-surface font-semibold">
                    10.01 - {draftSingle.toFixed(2)} XRP
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-primary font-bold tracking-wide uppercase">
                    Autonomous + Real-Time CFO Alert
                  </span>
                  <BellRing className="w-[18px] h-[18px] text-primary" />
                </div>
                <p className="text-[13px] text-on-surface-variant">
                  Executes automatically while broadcasting a synchronous cryptographic receipt
                  notification to Slack (#treasury-alerts) and Amara Okafor&apos;s email.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="p-3 rounded-lg bg-surface-container-high/60 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    Tier 3: Significant Capital
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-surface-container-highest text-on-surface font-semibold">
                    &gt; {draftSingle.toFixed(2)} XRP
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-error font-bold tracking-wide uppercase">
                    Mandatory Human Dual-Key Approval
                  </span>
                  <KeyRound className="w-[18px] h-[18px] text-error" />
                </div>
                <p className="text-[13px] text-on-surface-variant">
                  Agent execution disabled. Invoices are committed to an on-ledger escrow condition
                  requiring WebAuthn sign-off by 2 authorized finance trustees.
                </p>
              </div>
            </div>

            <div className="h-px bg-surface-container-high w-full my-4" />

            {/* Emergency Agent Freeze Toggle */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-on-surface font-semibold">
                    Emergency Agent Freeze
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      draftFreeze
                        ? 'bg-error text-on-error'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {draftFreeze ? 'Activated (ON)' : 'Standby (OFF)'}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  When activated, all AI agent payment signing operations are immediately suspended.
                  Pending requests fall automatically into safe treasury holding escrow.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={draftFreeze}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraftFreeze(checked);
                    updatePolicies({ emergencyFreeze: checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-fixed-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-on-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-primary after:border-surface-dim after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error" />
              </label>
            </div>
          </section>

          {/* Hardware Enclave Proof */}
          <section className="rounded-xl bg-surface-container-lowest p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-on-surface font-semibold">
                Hardware Enclave Proof
              </span>
              <span className="text-[11px] text-on-surface-variant font-mono">
                Ledger Check: Pass
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low font-mono text-[11px] text-on-surface-variant flex flex-col gap-1">
              <div className="flex items-center justify-between text-on-surface font-semibold">
                <span>POLICY_ROOT_HASH</span>
                <span className="text-tertiary">MATCH_VERIFIED</span>
              </div>
              <span className="truncate">sha256:88fb39048a12de405bc762b9a78120e8d01...</span>
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                <span>Cryptographic signature validated across 3 validator nodes</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => pushToast('SGX enclave attestation verified across 3 validator nodes.', 'success')}
              className="text-left text-[12px] text-primary font-semibold hover:underline"
            >
              Re-verify Enclave Attestation &rarr;
            </button>
          </section>
        </div>
      </div>

      {/* Confirm Spending Policy Revision Modal */}
      <AnimatePresence>
        {confirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModalOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl rounded-xl bg-surface-container-lowest p-6 shadow-xl flex flex-col gap-4 z-10"
            >
              <div className="flex items-start justify-between pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[20px] leading-7 text-on-surface font-semibold">
                      Confirm Spending Policy Revision
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Hardware-enforced treasury parameter update
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Policy Change Summary
                </span>
                <div className="rounded-lg bg-surface-container-low overflow-hidden">
                  <div className="grid grid-cols-3 px-3 py-1.5 bg-surface-container-high text-[11px] font-semibold text-on-surface-variant">
                    <span>PARAMETER</span>
                    <span className="text-center">CURRENT LIMIT</span>
                    <span className="text-right">PROPOSED LIMIT</span>
                  </div>
                  <div className="grid grid-cols-3 items-center px-3 py-2 text-[13px]">
                    <span className="font-medium text-on-surface">Daily Aggregate Limit</span>
                    <span className="text-center font-mono text-[11px] text-on-surface-variant tabular-nums">
                      {policies.dailyAggregateLimit.toFixed(2)} XRP
                    </span>
                    <span className="text-right font-mono text-[11px] text-primary font-semibold flex items-center justify-end gap-1 tabular-nums">
                      <span>{draftDaily.toFixed(2)} XRP</span>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="grid grid-cols-3 items-center px-3 py-2 text-[13px] bg-surface-container-lowest/50">
                    <span className="font-medium text-on-surface">Max Single Outflow</span>
                    <span className="text-center font-mono text-[11px] text-on-surface-variant tabular-nums">
                      {policies.maxSingleTxLimit.toFixed(2)} XRP
                    </span>
                    <span className="text-right font-mono text-[11px] text-primary font-semibold flex items-center justify-end gap-1 tabular-nums">
                      <span>{draftSingle.toFixed(2)} XRP</span>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-high/60 flex items-start gap-2 text-on-surface">
                <Info className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Effective Policy Notice</span>
                  <span>
                    Effective immediately upon confirmation. Active autonomous agents will be
                    evaluated against these updated thresholds on their next transaction heartbeat
                    cycle.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Authorizing Human Operator
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold">
                      AO
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] text-on-surface font-semibold">Amara Okafor</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Finance Administrator &middot; Apex Auto Parts Ltd.
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-tertiary font-semibold">
                    <Fingerprint className="w-4 h-4" />
                    <span>FIDO2 / WebAuthn Ready</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyChanges}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all text-[13px] font-semibold shadow-sm"
                >
                  <BadgeCheck className="w-[18px] h-[18px]" />
                  <span>Confirm &amp; Apply Policy</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
