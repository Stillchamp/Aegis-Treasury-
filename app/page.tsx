'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TreasuryProvider, useTreasury } from '@/components/treasury-context';
import { AppShell } from '@/components/app-shell';
import { OverviewScreen } from '@/components/screens/overview-screen';
import { PaymentsScreen } from '@/components/screens/payments-screen';
import { AiAgentsScreen } from '@/components/screens/ai-agents-screen';
import { VendorsScreen } from '@/components/screens/vendors-screen';
import { SpendingPoliciesScreen } from '@/components/screens/spending-policies-screen';
import { AuditTrailScreen } from '@/components/screens/audit-trail-screen';
import { SettingsScreen, HelpSupportScreen } from '@/components/screens/utility-screens';

function ActiveScreenRouter() {
  const { activePath } = useTreasury();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePath}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {activePath === 'overview' && <OverviewScreen />}
        {activePath === 'payments' && <PaymentsScreen />}
        {activePath === 'ai-agents' && <AiAgentsScreen />}
        {activePath === 'spending-policies' && <SpendingPoliciesScreen />}
        {activePath === 'vendors' && <VendorsScreen />}
        {activePath === 'audit-trail' && <AuditTrailScreen />}
        {activePath === 'settings' && <SettingsScreen />}
        {activePath === 'help-support' && <HelpSupportScreen />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function HomePage() {
  return (
    <TreasuryProvider>
      <AppShell>
        <ActiveScreenRouter />
      </AppShell>
    </TreasuryProvider>
  );
}
