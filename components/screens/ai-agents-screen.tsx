'use client';

import React, { useState } from 'react';
import {
  Terminal,
  PlusCircle,
  Lock,
  BadgeCheck,
  Bot,
  Gauge,
  ShieldAlert,
  Ban,
  ShoppingCart,
  Eye,
  SlidersHorizontal,
  Wallet,
  CheckCircle2,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  Radio,
  ListChecks,
  CheckCheck,
  X,
  Info,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '@/components/treasury-context';
import { AgentRecord } from '@/lib/treasury-data';

export function AiAgentsScreen() {
  const { agents, policies, toggleAgentStatus, addAgent, pushToast, setActivePath } = useTreasury();

  const [detailsAgent, setDetailsAgent] = useState<AgentRecord | null>(null);
  const [pauseTarget, setPauseTarget] = useState<AgentRecord | null>(null);
  const [pauseConfirmInput, setPauseConfirmInput] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);

  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPolicy, setNewAgentPolicy] = useState('Global Default v1.2 (50 XRP/day)');
  const [newAgentWebhook, setNewAgentWebhook] = useState('');

  const activeCount = agents.filter((a) => a.status === 'Active').length;
  const pausedCount = agents.length - activeCount;

  const handleConfirmPause = () => {
    if (!pauseTarget) return;
    if (pauseConfirmInput.trim().toUpperCase() !== 'PAUSE') {
      pushToast('Please type PAUSE to confirm operator intent.', 'error');
      return;
    }
    toggleAgentStatus(pauseTarget.key);
    setPauseTarget(null);
    setPauseConfirmInput('');
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Utility Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] leading-[14px] text-secondary uppercase tracking-widest font-semibold">
              Autonomous Systems
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-mono text-[11px] text-primary font-medium">
              HSM-ISOLATED DAEMONS
            </span>
          </div>
          <h1 className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface">
            AI Agents
          </h1>
          <p className="text-[14px] leading-5 text-secondary mt-0.5 max-w-2xl">
            Manage autonomous agent routines authorized for algorithmic liquidity settlement and
            real-time XRPL state verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => pushToast('Agent SDK CLI snippets copied (npm i @aegis-treasury/sdk).', 'info')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-[13px] font-medium transition-all shadow-sm whitespace-nowrap"
          >
            <Terminal className="w-[18px] h-[18px]" />
            <span>Agent CLI &amp; SDK</span>
          </button>
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary text-[13px] font-medium transition-all shadow-sm whitespace-nowrap"
          >
            <PlusCircle className="w-[18px] h-[18px]" />
            <span>Register New Agent (Dev API)</span>
          </button>
        </div>
      </div>

      {/* Key Security Notice Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-tertiary-container text-on-tertiary shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-on-surface font-semibold">
                Aegis Deterministic Sandbox
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] uppercase tracking-wider font-semibold">
                Enclave Sealed
              </span>
            </div>
            <p className="text-[13px] text-secondary mt-0.5">
              Autonomous agents operate with{' '}
              <span className="font-medium text-on-surface">zero direct access</span> to business
              master private keys. Spending petitions require policy consensus before cryptographic
              dispatch via XRPL multi-sign vaults.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-on-surface shrink-0">
          <span className="font-mono text-[11px] text-secondary">POLICY_HASH: 0x98f4...b201</span>
          <BadgeCheck className="w-[18px] h-[18px] text-secondary" />
        </div>
      </div>

      {/* Summary Metrics Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[12px] uppercase tracking-wider font-medium">
              Authorized Agents
            </span>
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] font-semibold text-on-surface tabular-nums">
                {activeCount}
              </span>
              <span className="text-[13px] text-secondary font-medium">Active Workers</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              <span className="text-[11px] text-secondary">
                {pausedCount} Paused &middot; 0 Deprecated
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[12px] uppercase tracking-wider font-medium">
              Total Daily Velocity
            </span>
            <Gauge className="w-5 h-5 text-tertiary-container" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[20px] leading-7 font-semibold text-on-surface tabular-nums">
                18.00{' '}
                <span className="text-[12px] text-secondary font-normal">
                  / {policies.dailyAggregateLimit.toFixed(2)} XRP
                </span>
              </span>
              <span className="font-mono text-[11px] text-primary font-semibold tabular-nums">
                {Math.round((18 / policies.dailyAggregateLimit) * 100)}%
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((18 / policies.dailyAggregateLimit) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[12px] uppercase tracking-wider font-medium">
              Intercepted Breaches
            </span>
            <ShieldAlert className="w-5 h-5 text-on-error-container" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] leading-[44px] font-semibold text-on-surface tabular-nums">
                2
              </span>
              <span className="text-[13px] text-secondary">prevented this week</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-error">
              <Ban className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">100% Policy Protection</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[12px] uppercase tracking-wider font-medium">
              Signing Security
            </span>
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-[16px] leading-6 font-semibold text-on-surface block">
              HSM Enclave
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="font-mono text-[11px] text-secondary truncate">
                AWS KMS &middot; FIPS 140-3 Level 3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Registry Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const isPaused = agent.status === 'Paused';
          const pct =
            policies.dailyAggregateLimit > 0
              ? Math.min(100, Math.round((agent.budgetConsumed / policies.dailyAggregateLimit) * 100))
              : 0;
          const remaining = Math.max(0, policies.dailyAggregateLimit - agent.budgetConsumed);

          return (
            <div
              key={agent.id}
              className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4">
                {/* Card Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                      {agent.readOnly ? (
                        <Eye className="w-6 h-6" />
                      ) : (
                        <ShoppingCart className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[20px] leading-7 font-semibold text-on-surface">
                          {agent.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isPaused
                              ? 'bg-error-container text-error'
                              : agent.readOnly
                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                : 'bg-tertiary-fixed text-on-tertiary-fixed'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaused
                                ? 'bg-error'
                                : agent.readOnly
                                  ? 'bg-primary animate-pulse'
                                  : 'bg-tertiary'
                            }`}
                          />
                          {isPaused ? 'Paused · Execution Halted' : `Active · ${agent.modeLabel}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-secondary mt-0.5">
                        <span>{agent.version}</span>
                        <span>&middot;</span>
                        <span>Host: {agent.host}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsAgent(agent)}
                    title="Agent Telemetry Config"
                    className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Purpose */}
                <p className="text-[14px] leading-5 text-secondary">{agent.purpose}</p>

                {/* Budget or Observer Stream Visual */}
                {!agent.readOnly ? (
                  <div className="rounded-lg bg-surface p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-secondary" />
                        <span className="text-[12px] font-semibold">Daily Budget Utilization</span>
                      </div>
                      <span className="font-mono text-[11px] text-secondary">
                        Ceiling: {policies.maxSingleTxLimit.toFixed(2)} XRP/tx
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-mono text-[13px] font-medium text-on-surface tabular-nums">
                        {agent.budgetConsumed.toFixed(2)} XRP{' '}
                        <span className="text-secondary font-normal text-[13px]">consumed</span>
                      </span>
                      <span className="font-mono text-[11px] text-primary font-medium tabular-nums">
                        {remaining.toFixed(2)} XRP remaining ({100 - pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className="bg-primary-container h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-surface p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-tertiary" />
                        <span className="text-[12px] font-semibold">
                          XRPL Testnet Observer Stream
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-tertiary-container font-medium">
                        Latency: 12ms
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-[13px] font-medium text-on-surface tabular-nums">
                        {(agent.ledgersScanned ?? 184200).toLocaleString()}{' '}
                        <span className="text-secondary font-normal text-[13px]">
                          Ledgers Scanned
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-secondary">
                        Listening: ws://xrpl-test.aegis
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full w-full ${
                          isPaused ? 'bg-outline-variant' : 'bg-tertiary-fixed-dim animate-pulse'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Permissions & Scopes */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] text-secondary uppercase tracking-wider font-medium">
                    Cryptographic Scopes &amp; Enforcements
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                    {agent.allowedScopes.map((scope) => (
                      <div
                        key={scope}
                        className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low text-on-surface"
                      >
                        <CheckCircle2 className="w-[18px] h-[18px] text-tertiary-container shrink-0" />
                        <span className="text-[13px] truncate">{scope}</span>
                      </div>
                    ))}
                    {agent.blockedScopes.map((scope) => (
                      <div
                        key={scope}
                        className={`flex items-center gap-1.5 p-2 rounded bg-error-container text-on-error-container ${
                          agent.blockedScopes.length === 1 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <Lock className="w-[18px] h-[18px] text-error shrink-0" />
                        <span className="text-[13px] font-medium truncate">{scope}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Telemetry */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface-container-low">
                  <div>
                    <span className="text-[11px] text-secondary uppercase block">
                      {agent.readOnly ? 'State Sync' : 'Payments Executed'}
                    </span>
                    <span className="font-mono text-[13px] text-on-surface font-semibold">
                      {agent.readOnly ? 'Real-Time' : `${agent.paymentsTotal} settled`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-secondary uppercase block">
                      {agent.readOnly ? 'Ledger Sync' : 'Success Rate'}
                    </span>
                    <span
                      className={`font-mono text-[13px] font-semibold ${
                        agent.readOnly ? 'text-on-surface' : 'text-tertiary-container'
                      }`}
                    >
                      {agent.successRate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-secondary uppercase block">
                      {agent.readOnly ? 'Last Active' : 'Telemetry Heartbeat'}
                    </span>
                    <span className="text-[11px] text-on-surface block mt-0.5">
                      {agent.lastActive}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls Bottom Bar */}
              <div className="flex items-center justify-between pt-4 mt-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setDetailsAgent(agent)}
                    className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{agent.readOnly ? 'Stream Raw Telemetry' : 'Activity Log'}</span>
                    {agent.readOnly ? (
                      <Terminal className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                  {!agent.readOnly && (
                    <button
                      type="button"
                      onClick={() => setActivePath('settings')}
                      className="text-[13px] font-medium text-secondary hover:text-on-surface"
                    >
                      Webhooks
                    </button>
                  )}
                </div>

                {isPaused ? (
                  <button
                    type="button"
                    onClick={() => toggleAgentStatus(agent.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary-container text-[13px] font-medium transition-colors shadow-xs"
                  >
                    <PlayCircle className="w-[18px] h-[18px]" />
                    <span>Resume {agent.readOnly ? 'Monitor' : 'Agent'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPauseTarget(agent);
                      setPauseConfirmInput('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim text-[13px] font-medium transition-colors shadow-xs"
                  >
                    <PauseCircle className="w-[18px] h-[18px]" />
                    <span>{agent.readOnly ? 'Pause Monitor' : 'Pause Agent'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deterministic Policy Sandbox Architecture Diagram */}
      <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-[16px] leading-6 font-semibold text-on-surface">
              Deterministic Policy Sandbox Architecture
            </h3>
            <p className="text-[13px] text-secondary">
              Visualizing the isolation pipeline between AI agent intents and XRPL signature execution.
            </p>
          </div>
          <span className="font-mono text-[11px] text-secondary bg-surface-container px-2.5 py-1 rounded">
            ISOLATION LEVEL: FIPS 140-3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-secondary uppercase font-semibold">
                01. Autonomous Routine
              </span>
              <Bot className="w-[18px] h-[18px] text-primary" />
            </div>
            <span className="text-[13px] text-on-surface font-semibold">
              Agent Intent Generation
            </span>
            <p className="text-[13px] text-secondary">
              Scans NetSuite ERP for matched POs. Emits structured JSON payload.
            </p>
            <span className="font-mono text-[11px] text-secondary mt-1">
              Output: SpendProposal
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-secondary uppercase font-semibold">
                02. Static Rule Engine
              </span>
              <ListChecks className="w-[18px] h-[18px] text-primary" />
            </div>
            <span className="text-[13px] text-on-surface font-semibold">
              Aegis Policy Interceptor
            </span>
            <p className="text-[13px] text-secondary">
              Evaluates daily cap ({policies.dailyAggregateLimit.toFixed(0)} XRP), velocity rate
              limits, and vendor whitelists.
            </p>
            <span className="font-mono text-[11px] text-tertiary-container mt-1">
              Status: 2 Breaches Caught
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-secondary uppercase font-semibold">
                03. Key Isolation
              </span>
              <Lock className="w-[18px] h-[18px] text-primary" />
            </div>
            <span className="text-[13px] text-on-surface font-semibold">HSM Multi-Sign Vault</span>
            <p className="text-[13px] text-secondary">
              Private keys reside in physical enclave. Signs only verified payloads.
            </p>
            <span className="font-mono text-[11px] text-secondary mt-1">Enclave: AWS KMS FIPS</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-secondary uppercase font-semibold">
                04. Finality
              </span>
              <CheckCheck className="w-[18px] h-[18px] text-tertiary" />
            </div>
            <span className="text-[13px] text-on-surface font-semibold">
              XRPL Testnet Execution
            </span>
            <p className="text-[13px] text-secondary">
              Deterministic finality in 3-5 seconds. Ledger immutable state logged.
            </p>
            <span className="font-mono text-[11px] text-tertiary mt-1">Ledger: #89,421,042</span>
          </div>
        </div>
      </div>

      {/* Agent Details & Configuration Slide-Over Drawer */}
      <AnimatePresence>
        {detailsAgent && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsAgent(null)}
              className="absolute inset-0 bg-inverse-surface/40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-screen max-w-xl bg-surface-container-lowest shadow-2xl flex flex-col justify-between z-10"
            >
              <div className="p-6 bg-surface-container-low flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                      Worker Node Configuration
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold">
                      {detailsAgent.status === 'Paused'
                        ? 'PAUSED'
                        : detailsAgent.readOnly
                          ? 'ACTIVE · READ ONLY'
                          : 'ACTIVE · EXECUTION'}
                    </span>
                  </div>
                  <h2 className="text-[24px] leading-8 font-semibold text-on-surface mt-1">
                    {detailsAgent.name}
                  </h2>
                  <p className="font-mono text-[11px] text-secondary mt-1">
                    Host: {detailsAgent.host} &middot; Node ID: {detailsAgent.nodeId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsAgent(null)}
                  className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                <div className="rounded-xl bg-surface p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-secondary uppercase font-semibold">
                      Bound Spending Policy
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsAgent(null);
                        setActivePath('spending-policies');
                      }}
                      className="text-[11px] text-primary font-medium hover:underline"
                    >
                      Modify Binding
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-surface-container text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[13px] text-on-surface font-semibold block">
                        Global Default v1.2
                      </span>
                      <span className="text-[13px] text-secondary">
                        Limits aggregate agent outflow to {policies.dailyAggregateLimit.toFixed(2)}{' '}
                        XRP/day. Whitelisted vendors only.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] text-secondary uppercase tracking-wider font-medium">
                    API Authentication &amp; Ephemeral Tokens
                  </span>
                  <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-on-surface font-medium block">
                        Daemon Ed25519 Token
                      </span>
                      <span className="text-[11px] text-secondary">
                        Rotated 4 days ago &middot; Auto-rotation active (every 30d)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        pushToast(`Rotated Ed25519 signing token for ${detailsAgent.name}.`, 'success')
                      }
                      className="px-2.5 py-1.5 rounded bg-surface text-on-surface hover:bg-surface-container text-[12px] font-medium"
                    >
                      Rotate Now
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-on-surface font-medium block">
                        Audit Verification Signature
                      </span>
                      <span className="font-mono text-[11px] text-secondary">
                        SIG: 0x4f82a9...d3c901
                      </span>
                    </div>
                    <BadgeCheck className="w-5 h-5 text-tertiary-container" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-secondary uppercase tracking-wider font-medium">
                      Autonomous Execution Feed
                    </span>
                    <span className="text-[11px] text-primary">Live streaming</span>
                  </div>
                  <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                    {detailsAgent.activityFeed.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded flex flex-col gap-1 ${
                          ev.verdict === 'INTERCEPTED_BREACH'
                            ? 'bg-error-container/40'
                            : 'bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center justify-between text-secondary">
                          <span>{ev.time}</span>
                          <span
                            className={
                              ev.verdict === 'INTERCEPTED_BREACH'
                                ? 'text-error font-semibold'
                                : 'text-tertiary-container font-semibold'
                            }
                          >
                            {ev.verdict}
                          </span>
                        </div>
                        <div className="text-on-surface font-medium">{ev.title}</div>
                        <div className="text-secondary">{ev.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDetailsAgent(null)}
                  className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-container text-on-surface text-[13px] font-medium"
                >
                  Close Panel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailsAgent;
                    setDetailsAgent(null);
                    if (target.status === 'Paused') {
                      toggleAgentStatus(target.key);
                    } else {
                      setPauseTarget(target);
                      setPauseConfirmInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim text-[13px] font-semibold"
                >
                  {detailsAgent.status === 'Paused' ? 'Resume Execution' : 'Pause Execution'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pause Confirmation Modal */}
      <AnimatePresence>
        {pauseTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPauseTarget(null)}
              className="fixed inset-0 bg-inverse-surface/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative rounded-xl bg-surface-container-lowest shadow-2xl sm:w-full sm:max-w-lg p-6 flex flex-col gap-4 z-10"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error-container text-error">
                  <PauseCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[16px] leading-6 font-semibold text-on-surface">
                    Pause {pauseTarget.name}?
                  </h3>
                  <p className="text-[13px] text-secondary mt-1">
                    Pausing this agent will immediately suspend all autonomous invoice settlement
                    workflows. Pending ERP requests will queue in backlog without XRPL execution.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-on-surface text-[12px] font-semibold">
                  <Info className="w-4 h-4 text-secondary" />
                  <span>Immediate Operational Impact</span>
                </div>
                <ul className="text-[11px] text-secondary list-disc pl-4 flex flex-col gap-0.5">
                  <li>ERP polling daemon transitions to passive queue accumulation</li>
                  <li>Zero automated transactions will be sent to HSM multi-sign vault</li>
                  <li>Can be safely resumed at any time by authorized Finance Administrators</li>
                </ul>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-on-surface font-semibold" htmlFor="pause-confirm-input">
                  Type <span className="font-mono text-error font-bold">PAUSE</span> to verify
                  operator intent:
                </label>
                <input
                  id="pause-confirm-input"
                  type="text"
                  value={pauseConfirmInput}
                  onChange={(e) => setPauseConfirmInput(e.target.value)}
                  placeholder="PAUSE"
                  className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPauseTarget(null)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPause}
                  className="px-3 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 text-[13px] font-semibold shadow-xs"
                >
                  Confirm Pause
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register Agent Dev API Drawer */}
      <AnimatePresence>
        {registerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRegisterOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-screen max-w-lg bg-surface-container-lowest p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[20px] leading-7 font-semibold text-on-surface">
                    Provision Autonomous Agent
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(false)}
                    className="p-1.5 rounded-lg text-secondary hover:text-on-surface"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-[13px] text-secondary">
                  Generate an isolated execution sandbox and Ed25519 signing keypair for
                  programmatic finance daemons.
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[12px] text-on-surface font-semibold block mb-1">
                      Agent Identifier
                    </label>
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g. Payroll Disburser Agent"
                      className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] text-on-surface font-semibold block mb-1">
                      Assigned Spending Policy
                    </label>
                    <select
                      value={newAgentPolicy}
                      onChange={(e) => setNewAgentPolicy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                    >
                      <option>Global Default v1.2 (50 XRP/day)</option>
                      <option>Restricted Logistics Policy (20 XRP/day)</option>
                      <option>Read-Only Auditor Policy (0 XRP/day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-on-surface font-semibold block mb-1">
                      Daemon Webhook Callback URL
                    </label>
                    <input
                      type="text"
                      value={newAgentWebhook}
                      onChange={(e) => setNewAgentWebhook(e.target.value)}
                      placeholder="https://api.apexautoparts.com/treasury/agent"
                      className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addAgent(newAgentName, newAgentPolicy, newAgentWebhook);
                    setNewAgentName('');
                    setNewAgentWebhook('');
                    setRegisterOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-primary-container text-on-primary text-[13px] font-semibold"
                >
                  Provision Credentials
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
