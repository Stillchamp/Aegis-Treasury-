'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  Download,
  Plus,
  ShieldAlert,
  TrendingUp,
  Copy,
  ExternalLink,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  X,
  Save,
  Info,
  Warehouse,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '@/components/treasury-context';
import { HOTLINK_ASSETS, VendorRecord } from '@/lib/treasury-data';

export function VendorsScreen() {
  const {
    vendors,
    addVendor,
    updateVendorStatus,
    updateVendorLimit,
    pushToast,
    setActivePath,
  } = useTreasury();

  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('20.00');

  // Add vendor form state
  const [vendorName, setVendorName] = useState('');
  const [walletAddress, setWalletAddress] = useState('rKigaliSpares901248Kla77qM2');
  const [vendorCategory, setVendorCategory] = useState('Auto Parts');
  const [paymentLimit, setPaymentLimit] = useState('15.00');
  const [taxId, setTaxId] = useState('KRA-PIN-P05128919Z');
  const [justificationNote, setJustificationNote] = useState(
    'Authorized for Q2 gasket restocking'
  );

  const [warehouseImgErr, setWarehouseImgErr] = useState(false);
  const [mapImgErr, setMapImgErr] = useState(false);

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.categoryLocation.toLowerCase().includes(q) ||
      v.walletFull.toLowerCase().includes(q) ||
      v.walletShort.toLowerCase().includes(q)
    );
  });

  const pendingCount = vendors.filter((v) => v.status === 'Pending Verification').length;

  const handleCopyWallet = (wallet: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet).catch(() => {});
    }
    pushToast(`Wallet address copied: ${wallet.substring(0, 14)}...`, 'info');
  };

  const handleExportDirectory = () => {
    const json = JSON.stringify(vendors, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegis-approved-vendors.json';
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Exported approved vendor directory (JSON).', 'success');
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      pushToast('Please enter a vendor business name.', 'error');
      return;
    }
    const parsedLimit = parseFloat(paymentLimit) || 15.0;
    addVendor({
      name: vendorName.trim(),
      categoryLocation: `${vendorCategory} Supplier (${justificationNote.slice(0, 28)})`,
      category: vendorCategory,
      walletShort:
        walletAddress.length > 22
          ? `${walletAddress.slice(0, 16)}...${walletAddress.slice(-4)}`
          : walletAddress,
      walletFull: walletAddress.trim(),
      singleLimitXrp: parsedLimit,
      status: 'Pending Verification',
      taxId: taxId.trim(),
    });
    setVendorName('');
    setAddModalOpen(false);
  };

  const isValidWalletFormat = walletAddress.trim().startsWith('r') && walletAddress.trim().length >= 16;

  return (
    <div className="flex flex-col w-full">
      {/* Top Command & Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-[36px] leading-[44px] tracking-[-0.025em] font-semibold text-on-surface">
              Approved Vendors
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed/30 text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              {vendors.length} Registered
            </span>
          </div>
          <p className="text-[14px] leading-5 text-on-surface-variant">
            Control which supplier wallets your autonomous agents are allowed to pay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name, category, or wallet..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
            />
          </div>
          <button
            type="button"
            onClick={handleExportDirectory}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] font-medium rounded-lg shadow-sm hover:bg-surface-container-low transition-colors whitespace-nowrap"
          >
            <Download className="w-[18px] h-[18px]" />
            <span>Export Directory</span>
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary text-[13px] font-medium rounded-lg shadow-sm hover:bg-primary-container transition-colors whitespace-nowrap"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>Add Approved Vendor</span>
          </button>
        </div>
      </div>

      {/* Security & Allowlist Enforcement Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-amber-500/10 text-on-surface mb-6 shadow-xs gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-800">
            <ShieldAlert className="w-[22px] h-[22px]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[16px] leading-6 font-semibold text-amber-950">
                Strict Allowlist Mode Active
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 font-semibold uppercase tracking-wider">
                Level 1 Policy
              </span>
            </div>
            <p className="text-[13px] text-amber-900 mt-0.5">
              AI agents attempting to send funds to any unregistered wallet address are blocked
              automatically by the Aegis Policy Engine before on-chain signing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="font-mono text-[11px] text-amber-800 bg-surface-container-lowest/80 px-2 py-1 rounded">
            Engine Ruleset: v4.12
          </span>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
            Total Disbursed (XRPL)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-[20px] leading-7 text-on-surface font-semibold tabular-nums">
              582.00 XRP
            </span>
            <span className="text-[11px] text-tertiary font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +12.4%
            </span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '58%' }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
            Completed Transactions
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-[20px] leading-7 text-on-surface font-semibold tabular-nums">
              44 Settlements
            </span>
            <span className="text-[11px] text-on-surface-variant">Avg 3.2s on Ledger</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-tertiary-container h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
            Blocked Violations (30d)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-[20px] leading-7 text-error font-semibold tabular-nums">
              1 Interception
            </span>
            <span className="text-[11px] text-error font-medium">Over-limit auto-halt</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-error h-full rounded-full" style={{ width: '15%' }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">
            Pending KYC / Compliance
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-[20px] leading-7 text-amber-700 font-semibold tabular-nums">
              {pendingCount} Verification{pendingCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-amber-800 font-medium truncate max-w-[115px]">
              {pendingCount > 0 ? 'Horizon Lubricants' : 'All Cleared'}
            </span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, pendingCount * 20)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vendors Strict Financial Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col mb-8">
        <div className="px-6 py-3 bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[16px] leading-6 font-semibold text-on-surface">
              Allowlisted Counterparties
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
              Active Policy Matrix
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant text-[11px]">
            <span>Deterministic Rule: Max 20.00 XRP standard limit</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant text-[11px] tracking-wider uppercase">
                <th className="py-3 px-4 font-semibold">Vendor Name &amp; Category</th>
                <th className="py-3 px-4 font-semibold">XRP Ledger Wallet Address</th>
                <th className="py-3 px-4 font-semibold text-right">Single Payment Limit</th>
                <th className="py-3 px-4 font-semibold text-right">Cumulative Paid</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Date Added</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-[13px]">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    No vendors match &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => {
                  const rowBg = v.breachFlag
                    ? 'bg-red-50/20'
                    : v.status === 'Pending Verification'
                      ? 'bg-amber-500/5'
                      : '';
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-surface-container-low/50 transition-colors group ${rowBg}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded ${v.avatarBg} ${v.avatarText} flex items-center justify-center text-[14px] font-semibold shrink-0`}
                          >
                            {v.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {v.name}
                            </span>
                            <span className="text-[11px] text-on-surface-variant truncate">
                              {v.categoryLocation}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded font-mono text-[11px] text-on-surface">
                          <span>{v.walletShort}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyWallet(v.walletFull)}
                            title="Copy Wallet"
                            className="text-on-surface-variant hover:text-on-surface"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              pushToast(`XRPL Testnet Explorer check verified for ${v.walletShort}`, 'info')
                            }
                            title="View in XRPL Explorer"
                            className="text-on-surface-variant hover:text-primary"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[13px] font-semibold text-on-surface tabular-nums">
                            {v.singleLimitXrp.toFixed(2)}{' '}
                            <span className="text-on-surface-variant text-[11px]">XRP / tx</span>
                          </span>
                          {v.breachFlag && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-error font-medium bg-error-container/60 px-1.5 py-0.5 rounded mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {v.breachFlag}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[13px] font-semibold text-on-surface tabular-nums">
                            {v.cumulativePaidXrp.toFixed(2)} XRP
                          </span>
                          <span
                            className={`text-[11px] ${
                              v.status === 'Pending Verification'
                                ? 'text-amber-800 font-medium'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {v.orderCountLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {v.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Approved
                          </span>
                        )}
                        {v.status === 'Pending Verification' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Pending Verification
                          </span>
                        )}
                        {v.status === 'Deactivated' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant whitespace-nowrap">
                            Deactivated
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-on-surface-variant whitespace-nowrap">
                        {v.dateAdded}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-[12px]">
                          {v.status === 'Pending Verification' && (
                            <button
                              type="button"
                              onClick={() => updateVendorStatus(v.id, 'Approved')}
                              className="px-2.5 py-1 text-on-primary bg-primary hover:bg-primary-container rounded transition-colors font-semibold shadow-xs"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVendor(v);
                              setEditLimitValue(v.singleLimitXrp.toFixed(2));
                            }}
                            className="px-2 py-1 text-primary hover:bg-primary-fixed/40 rounded transition-colors font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateVendorStatus(
                                v.id,
                                v.status === 'Deactivated' ? 'Approved' : 'Deactivated'
                              )
                            }
                            className="px-2 py-1 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded transition-colors"
                          >
                            {v.status === 'Deactivated' ? 'Activate' : 'Deactivate'}
                          </button>
                          {v.status !== 'Pending Verification' && (
                            <button
                              type="button"
                              onClick={() => setActivePath('payments')}
                              className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-low rounded transition-colors whitespace-nowrap"
                            >
                              View History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-2.5 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-on-surface-variant">
            Showing {filteredVendors.length} of {vendors.length} approved enterprise supply
            counterparties
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="p-1 rounded text-on-surface-variant/40 cursor-not-allowed"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
            <span className="px-2 py-1 text-[11px] font-semibold bg-surface-container rounded text-on-surface">
              1
            </span>
            <button
              type="button"
              disabled
              className="p-1 rounded text-on-surface-variant/40 cursor-not-allowed"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Operational Flow & Governance Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Visual: Warehouse Logistics Flow */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] leading-6 font-semibold text-on-surface">
                Real-Time XRPL Clearing
              </span>
              <span className="text-[11px] text-tertiary font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary" /> Active
              </span>
            </div>
            <div className="h-44 w-full rounded-lg overflow-hidden relative mb-3 shadow-xs bg-surface-container">
              {!warehouseImgErr ? (
                <Image
                  src={HOTLINK_ASSETS.warehouseImage}
                  alt="Nairobi automated spare-parts logistics warehouse"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                  onError={() => setWarehouseImgErr(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                  <Warehouse className="w-8 h-8 text-primary" />
                  <span className="text-[12px] font-medium">Nairobi Logistics Hub</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-[12px] text-white font-medium">
                  Nairobi Hub &middot; 12 Pallets En Route
                </span>
              </div>
            </div>
            <p className="text-[13px] text-on-surface-variant">
              Autonomous purchase orders trigger automated ledger settlements instantly upon bill of
              lading receipt.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Average settlement speed</span>
            <span className="font-mono font-semibold text-on-surface">3.82s</span>
          </div>
        </div>

        {/* Distribution Map Graphic */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] leading-6 font-semibold text-on-surface">
                Regional Supplier Footprint
              </span>
              <span className="text-[11px] text-on-surface-variant">East &amp; West Africa</span>
            </div>
            <div className="relative w-full h-44 rounded-lg overflow-hidden mb-3 shadow-xs bg-surface-container">
              {!mapImgErr ? (
                <Image
                  src={HOTLINK_ASSETS.regionalMapImage}
                  alt="Regional Supplier Footprint East and West Africa"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                  onError={() => setMapImgErr(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                  <MapPin className="w-8 h-8 text-primary" />
                  <span className="text-[12px] font-medium">Nairobi &middot; Lagos Corridors</span>
                </div>
              )}
            </div>
            <p className="text-[13px] text-on-surface-variant">
              Verified counterparties operating across Nairobi, Mombasa, Kisumu, Eldoret, and Lagos
              distribution nodes.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Cross-border corridors</span>
            <span className="font-mono font-semibold text-on-surface">2 Active Routes</span>
          </div>
        </div>

        {/* Policy Guardrails Summary */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] leading-6 font-semibold text-on-surface">
                Guardrail Enforcement
              </span>
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 mb-3">
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-[18px] h-[18px] text-tertiary" />
                  <span className="text-[13px] text-on-surface">Wallet Format Validation</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">Base58 RFC</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-[18px] h-[18px] text-tertiary" />
                  <span className="text-[13px] text-on-surface">Dual-Sign Admin Approval</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">Enforced</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-[18px] h-[18px] text-tertiary" />
                  <span className="text-[13px] text-on-surface">Automatic Rate Limiting</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">Max 20 XRP</span>
              </div>
            </div>
            <p className="text-[13px] text-on-surface-variant">
              Changes to vendor records require verification by the finance director before autonomous
              access activates.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Policy revision</span>
            <span className="font-mono font-semibold text-on-surface">#2025-05-A</span>
          </div>
        </div>
      </div>

      {/* Add Approved Supplier Wallet Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="absolute inset-0 bg-[#0f172a]/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="relative bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 bg-surface-container-lowest flex items-center justify-between border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-on-surface">
                      Add Approved Supplier Wallet
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Authorize automated AI agent liquidity settlements
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="p-6 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-on-surface font-semibold" htmlFor="vendorName">
                    Vendor Business Name
                  </label>
                  <input
                    id="vendorName"
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Kigali Spares International"
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-[13px] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-on-surface font-semibold" htmlFor="walletAddress">
                      XRP Ledger Wallet Address
                    </label>
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        isValidWalletFormat ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isValidWalletFormat
                        ? 'Valid XRPL Testnet Address format'
                        : 'Must begin with "r" (Base58)'}
                    </span>
                  </div>
                  <input
                    id="walletAddress"
                    type="text"
                    required
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="r..."
                    className="w-full px-3 py-2 font-mono text-[11px] bg-surface-container-low text-on-surface rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-on-surface font-semibold" htmlFor="vendorCategory">
                      Vendor Category
                    </label>
                    <select
                      id="vendorCategory"
                      value={vendorCategory}
                      onChange={(e) => setVendorCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-[13px] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      <option value="Auto Parts">Auto Parts</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Utilities">Utilities</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-on-surface font-semibold" htmlFor="paymentLimit">
                      Single Transaction Limit (XRP)
                    </label>
                    <div className="relative">
                      <input
                        id="paymentLimit"
                        type="number"
                        step="0.01"
                        required
                        value={paymentLimit}
                        onChange={(e) => setPaymentLimit(e.target.value)}
                        className="w-full pl-3 pr-12 py-2 font-mono text-[11px] bg-surface-container-low text-on-surface rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-semibold">
                        XRP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-on-surface font-semibold" htmlFor="taxId">
                    Supplier Invoice Contact / Tax ID
                  </label>
                  <input
                    id="taxId"
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-[13px] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-on-surface font-semibold" htmlFor="justificationNote">
                    Business Justification Note
                  </label>
                  <textarea
                    id="justificationNote"
                    rows={2}
                    value={justificationNote}
                    onChange={(e) => setJustificationNote(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-[13px] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2">
                  <Info className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-on-surface-variant">
                    Payments to this wallet will be permitted up to the specified limit once signed
                    by an authorized Finance Administrator.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-3 py-2 rounded-lg text-on-surface text-[13px] font-medium hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium hover:bg-primary-container shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Approved Vendor</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Vendor Limit Modal */}
      <AnimatePresence>
        {editingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingVendor(null)}
              className="absolute inset-0 bg-[#0f172a]/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-surface-container-lowest rounded-xl max-w-md w-full p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-on-surface">
                    Edit Vendor Cap — {editingVendor.name}
                  </h3>
                  <p className="font-mono text-[11px] text-on-surface-variant">
                    {editingVendor.walletShort}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="p-1 text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-on-surface">
                  Single Payment Limit (XRP)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low font-mono text-[14px] font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const num = Math.max(1, parseFloat(editLimitValue) || 15);
                    updateVendorLimit(editingVendor.id, num);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium"
                >
                  Update Limit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
