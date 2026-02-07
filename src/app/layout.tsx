import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Citadel of Truth',
  description: 'A decentralized, anonymous verification protocol for campus rumors',
  keywords: ['rumors', 'verification', 'anonymous', 'campus', 'truth'],
  authors: [{ name: 'Citadel of Truth Team' }],
  openGraph: {
    title: 'Citadel of Truth',
    description: 'A decentralized, anonymous verification protocol for campus rumors',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <a href="/" className="flex items-center space-x-2">
                  <span className="text-2xl">🏰</span>
                  <span className="font-bold text-xl gradient-text">Citadel of Truth</span>
                </a>
                
                <div className="flex items-center space-x-4">
                  <a 
                    href="/feed" 
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    Feed
                  </a>
                  <a 
                    href="/submit" 
                    className="btn-primary text-sm"
                  >
                    Submit Rumor
                  </a>
                  <a 
                    href="/login" 
                    className="btn-secondary text-sm"
                  >
                    Login
                  </a>
                </div>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                    🏰 Citadel of Truth
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    A decentralized, anonymous verification protocol for campus rumors.
                    Zero central authority, absolute anonymity.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                    How It Works
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <li>✓ Anonymous voting with .edu email verification</li>
                    <li>✓ Quadratic cost prevents bot manipulation</li>
                    <li>✓ Bayesian scoring rewards truth-tellers</li>
                    <li>✓ Merkle anchoring prevents tampering</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                    Security
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <li>🔒 Email never stored</li>
                    <li>🔒 Client-side hashing only</li>
                    <li>🔒 Mathematical Sybil resistance</li>
                    <li>🔒 Immutable score history</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
                <p>© 2026 Citadel of Truth. Built for campus communities.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
