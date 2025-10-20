import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'fynqAI — Liquid Glass Copilot',
  description:
    'An Apple-inspired glassmorphism interface for fynqAI, letting students co-create with an intelligent academic copilot.',
  themeColor: '#f6f7fb',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-transparent antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(109,143,255,0.18),transparent),radial-gradient(120%_80%_at_100%_0%,rgba(144,101,255,0.12),transparent)]" />
          <div className="relative z-10 min-h-screen pb-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
