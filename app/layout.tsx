import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aegis Treasury — Autonomous Finance Control',
  description: 'Autonomous corporate treasury control and deterministic XRPL policy enforcement dashboard.',
  openGraph: {
    title: 'Aegis Treasury — Autonomous Finance Control',
    description: 'Autonomous corporate treasury control and deterministic XRPL policy enforcement dashboard.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aegis Treasury — Autonomous Finance Control',
    description: 'Autonomous corporate treasury control and deterministic XRPL policy enforcement dashboard.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-surface font-sans text-sm text-on-surface antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
