'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Bell,
  Webhook,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  LifeBuoy,
  Terminal,
  Copy,
} from 'lucide-react';
import { useTreasury } from '@/components/treasury-context';

export function SettingsScreen() {
  const { pushToast } = useTreasury();
  const [slackChannel, setSlackChannel] = useState('#treasury-alerts');
  const [webhookUrl, setWebhookUrl] = useState('https://api.apexautoparts.com/aegis/webhook');
  const [requireDualSign, setRequireDualSign] = useState(true);
  const [autoRotateKeys, setAutoRotateKeys] = useState(true);

  return (
    <div className="flex flex-col w-full gap-6">
      <div>
        <span className="text-[11px] uppercase tracking-widest text-secondary font-semibold">
          Workspace Configuration
        </span>
        <h1 className="text-[24px] leading-8 tracking-[-0.02em] font-semibold text-on-surface mt-0.5">
          Treasury &amp; Enclave Settings
        </h1>
        <p className="text-[14px] text-on-surface-variant mt-0.5">
          Configure HSM hardware attestation, Slack alert webhooks, and FIDO2 operator governance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-on-surface">
                HSM Signing &amp; Key Governance
              </h2>
              <p className="text-[12px] text-on-surface-variant">
                AWS KMS FIPS 140-3 Level 3 Hardware Security Module
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
            <div>
              <span className="text-[13px] font-semibold text-on-surface block">
                Dual-Trustee WebAuthn Sign-Off
              </span>
              <span className="text-[12px] text-on-surface-variant">
                Require 2 hardware keys for policy limit increases and vendor approvals.
              </span>
            </div>
            <input
              type="checkbox"
              checked={requireDualSign}
              onChange={(e) => setRequireDualSign(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
            <div>
              <span className="text-[13px] font-semibold text-on-surface block">
                30-Day Ephemeral Agent Token Rotation
              </span>
              <span className="text-[12px] text-on-surface-variant">
                Automatically cycle Ed25519 daemon credentials every 30 days.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRotateKeys}
              onChange={(e) => setAutoRotateKeys(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-on-surface">
                Alert &amp; Webhook Routing
              </h2>
              <p className="text-[12px] text-on-surface-variant">
                Real-time notification endpoints for Tier-2 and Veto events
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-on-surface">
              Slack Incident Channel
            </label>
            <input
              type="text"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low font-mono text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-on-surface">
              Signed Audit Event Webhook
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low font-mono text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => pushToast('Treasury enclave & webhook configuration saved.', 'success')}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpSupportScreen() {
  const { pushToast, setActivePath } = useTreasury();

  return (
    <div className="flex flex-col w-full gap-6">
      <div>
        <span className="text-[11px] uppercase tracking-widest text-secondary font-semibold">
          Documentation &amp; Diagnostics
        </span>
        <h1 className="text-[24px] leading-8 tracking-[-0.02em] font-semibold text-on-surface mt-0.5">
          Help &amp; Support
        </h1>
        <p className="text-[14px] text-on-surface-variant mt-0.5">
          XRPL Testnet integration guides, deterministic policy specifications, and enclave support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <h3 className="text-[16px] font-semibold text-on-surface">Policy Engine Spec</h3>
            <p className="text-[13px] text-on-surface-variant mt-1">
              Learn how POL-01 daily caps, POL-02 single limits, and vendor allowlists evaluate agent
              SpendProposals before HSM signing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePath('spending-policies')}
            className="text-left text-[13px] font-semibold text-primary hover:underline"
          >
            Open Spending Policies &rarr;
          </button>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <Terminal className="w-6 h-6 text-primary mb-2" />
            <h3 className="text-[16px] font-semibold text-on-surface">XRPL Testnet Faucet</h3>
            <p className="text-[13px] text-on-surface-variant mt-1">
              Vault address{' '}
              <span className="font-mono text-[11px] text-on-surface">rApexTreasury...9kQ2</span>{' '}
              is funded with 1,250.00 Testnet XRP for deterministic simulation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText('rApexTreasuryTestnetVault9kQ2').catch(() => {});
              }
              pushToast('Copied Testnet vault address to clipboard.', 'info');
            }}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Vault Address</span>
          </button>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <LifeBuoy className="w-6 h-6 text-tertiary mb-2" />
            <h3 className="text-[16px] font-semibold text-on-surface">Enclave Health Status</h3>
            <div className="flex items-center gap-1.5 text-[13px] text-tertiary font-medium mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>All 3 XRPL Validator Nodes Operational</span>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-1">
              Average evaluation latency: 14ms &middot; Last Merkle anchor: #89,421,042.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePath('audit-trail')}
            className="text-left text-[13px] font-semibold text-primary hover:underline"
          >
            Inspect Merkle Root &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
