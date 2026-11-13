'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Bot,
  ShieldCheck,
  Store,
  History,
  Settings,
  HelpCircle,
  ChevronsUpDown,
  Gauge,
  Shield,
  Bell,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  PauseCircle,
} from 'lucide-react';
import { useTreasury } from '@/components/treasury-context';
import { HOTLINK_ASSETS, NavPath } from '@/lib/treasury-data';

const PRIMARY_NAV: { path: NavPath; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'payments', label: 'Payments', icon: ArrowLeftRight },
  { path: 'ai-agents', label: 'AI Agents', icon: Bot },
  { path: 'spending-policies', label: 'Spending Policies', icon: ShieldCheck },
  { path: 'vendors', label: 'Vendors', icon: Store },
  { path: 'audit-trail', label: 'Audit Trail', icon: History },
];

const SECONDARY_NAV: { path: NavPath; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { path: 'settings', label: 'Settings', icon: Settings },
  { path: 'help-support', label: 'Help & Support', icon: HelpCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activePath,
    setActivePath,
    selectedEntity,
    setSelectedEntity,
    policies,
    agents,
    toasts,
    dismissToast,
    pushToast,
  } = useTreasury();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entityMenuOpen, setEntityMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const activeAgentCount = agents.filter((a) => a.status === 'Active').length;
  const isFrozen = policies.emergencyFreeze || activeAgentCount === 0;

  const entityLabel =
    selectedEntity === 'apex-auto'
      ? { name: 'Apex Auto Parts Ltd.', sub: 'Wholesale & Distribution (Nairobi / Lagos)' }
      : { name: 'Apex Logistics East Africa', sub: 'Freight & Customs Corridor (Mombasa / Kigali)' };

  const handleNavClick = (path: NavPath) => {
    setActivePath(path);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <>
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center gap-2.5 border-b border-outline-variant/20">
          {!logoError ? (
            <Image
              src={HOTLINK_ASSETS.aegisLogo}
              alt="Aegis Shield Logo"
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[16px] leading-6 text-on-surface font-semibold tracking-tight truncate">
              Aegis Treasury
            </span>
            <span className="text-[11px] leading-[14px] text-on-surface-variant truncate uppercase tracking-wider font-medium">
              Autonomous Finance Control
            </span>
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="px-2 py-1 text-[11px] leading-[14px] text-on-surface-variant/70 uppercase tracking-widest font-medium">
            Treasury Operations
          </div>
          <nav className="flex flex-col gap-0.5 mt-0.5" aria-label="Treasury Operations">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] leading-4 transition-colors text-left whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-on-primary font-medium shadow-sm'
                      : 'font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex flex-col border-t border-outline-variant/20 p-3 gap-1 bg-surface-container-lowest">
        <nav className="flex flex-col gap-0.5 mb-1" aria-label="System Navigation">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] leading-4 transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-on-primary font-medium shadow-sm'
                    : 'font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant/30">
          {!avatarError ? (
            <Image
              src={HOTLINK_ASSETS.amaraAvatar}
              alt="Amara Okafor"
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
              AO
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] leading-4 text-on-surface font-semibold truncate">
              Amara Okafor
            </span>
            <span className="text-[11px] leading-[14px] text-on-surface-variant truncate">
              Finance Administrator
            </span>
            <span className="text-[11px] leading-[14px] text-primary font-medium truncate">
              {entityLabel.name}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex-col justify-between select-none">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-on-surface/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[85vw] h-full bg-surface-container-lowest border-r border-outline-variant/30 z-10 flex flex-col justify-between">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-2 top-3 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="lg:pl-64 min-h-screen flex flex-col bg-surface">
        {/* Top Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 z-40 px-4 lg:px-6 flex items-center justify-between shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEntityMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                  setProfileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-surface-container-low border border-outline-variant/40 cursor-pointer transition-colors text-left"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] leading-4 text-on-surface font-semibold whitespace-nowrap">
                      {entityLabel.name}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <span className="hidden sm:block text-[11px] leading-[14px] text-on-surface-variant">
                    {entityLabel.sub}
                  </span>
                </div>
              </button>

              {entityMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-lg p-1.5 z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Corporate Treasury Entity
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntity('apex-auto');
                      setEntityMenuOpen(false);
                      pushToast('Switched active treasury workspace to Apex Auto Parts Ltd.', 'info');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex flex-col transition-colors ${
                      selectedEntity === 'apex-auto'
                        ? 'bg-surface-container-low text-primary'
                        : 'hover:bg-surface-container-low/60 text-on-surface'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Apex Auto Parts Ltd.</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Wholesale &amp; Distribution (Nairobi / Lagos)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntity('apex-logistics');
                      setEntityMenuOpen(false);
                      pushToast('Switched active treasury workspace to Apex Logistics East Africa.', 'info');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex flex-col transition-colors ${
                      selectedEntity === 'apex-logistics'
                        ? 'bg-surface-container-low text-primary'
                        : 'hover:bg-surface-container-low/60 text-on-surface'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Apex Logistics East Africa</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Freight &amp; Customs Corridor (Mombasa / Kigali)
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-fixed/50 border border-outline-variant/40 text-on-secondary-fixed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] leading-[14px] font-semibold tracking-wide uppercase whitespace-nowrap">
                  XRPL TESTNET · Demo Environment
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-mono text-[11px] leading-4 tabular-nums whitespace-nowrap">
                <Gauge className="w-[15px] h-[15px] text-tertiary" />
                <span>18ms · Ledger #89,421,042</span>
              </div>
            </div>

            <div className="h-4 w-px bg-outline-variant/30 hidden xl:block" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePath('spending-policies')}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                  isFrozen
                    ? 'bg-error-container border-error/30 text-error'
                    : 'bg-surface-container-high border-outline-variant/40 text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {isFrozen ? (
                  <PauseCircle className="w-4 h-4 text-error" />
                ) : (
                  <Shield className="w-4 h-4 text-tertiary-container" />
                )}
                <span className="text-[11px] leading-[14px] font-semibold">
                  {isFrozen ? 'Emergency Freeze Active' : 'Enforcement Active · 0 Breaches'}
                </span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotificationsOpen((v) => !v);
                    setEntityMenuOpen(false);
                    setProfileMenuOpen(false);
                  }}
                  className="relative p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                      <span className="text-[13px] font-semibold text-on-surface">
                        Treasury Alerts
                      </span>
                      <span className="text-[11px] text-primary font-medium">Live Feed</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setActivePath('payments');
                        }}
                        className="text-left p-2 rounded-lg bg-error-container/25 hover:bg-error-container/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-error">
                          <span>REQ-98405 Blocked</span>
                          <span>14:23 UTC</span>
                        </div>
                        <p className="text-[12px] text-on-surface mt-0.5">
                          Global Parts Ltd (35.00 XRP) exceeded 20.00 XRP single tx cap.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setActivePath('vendors');
                        }}
                        className="text-left p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                          <span>Pending Vendor Verification</span>
                          <span>Horizon Lubricants</span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant mt-0.5">
                          Awaiting Finance Administrator dual-sign approval.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((v) => !v);
                    setEntityMenuOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-1 pl-2 border-l border-outline-variant/30 cursor-pointer"
                >
                  {!avatarError ? (
                    <Image
                      src={HOTLINK_ASSETS.amaraAvatar}
                      alt="Amara Okafor"
                      width={32}
                      height={32}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                      AO
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-2 z-50">
                    <div className="px-2.5 py-2 border-b border-surface-container">
                      <p className="text-[13px] font-semibold text-on-surface">Amara Okafor</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Finance Administrator · FIDO2 Active
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setActivePath('settings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 mt-1 rounded-lg text-[13px] text-on-surface hover:bg-surface-container-low"
                    >
                      Security &amp; Enclave Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setActivePath('audit-trail');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] text-on-surface hover:bg-surface-container-low"
                    >
                      View Operator Audit Trail
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="w-full pt-16 flex-1">
          <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {toast.tone === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-tertiary-fixed shrink-0" />
            )}
            {toast.tone === 'error' && (
              <AlertCircle className="w-5 h-5 text-error-container shrink-0" />
            )}
            {toast.tone === 'info' && (
              <Info className="w-5 h-5 text-primary-fixed shrink-0" />
            )}
            <span className="text-[13px] leading-[18px] flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
