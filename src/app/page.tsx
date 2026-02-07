import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              <span className="block">The</span>
              <span className="block gradient-text">Citadel of Truth</span>
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
              A decentralized, anonymous verification protocol for campus rumors.
              Where mathematics ensures truth rises above manipulation.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/feed" className="btn-primary text-lg px-8 py-3">
                Browse Rumors
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-3">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Four core modules ensure truth prevails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Module 1 */}
            <div className="card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-3xl">🔐</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Identity Gateway</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Anonymous yet unique. Verify your .edu email, create a secret phrase, 
                and your identity stays yours forever.
              </p>
            </div>

            {/* Module 2 */}
            <div className="card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Trust Scoring</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Quadratic voting makes bots expensive. Bayesian scoring rewards 
                those who find surprising truths.
              </p>
            </div>

            {/* Module 3 */}
            <div className="card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-3xl">⛓️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Merkle Integrity</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hourly state commitments prevent retroactive tampering. 
                History cannot be rewritten.
              </p>
            </div>

            {/* Module 4 */}
            <div className="card-hover text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-3xl">🕸️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Graph Isolation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Deleted rumors have zero influence. Ghost content cannot 
                haunt new discoveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Math Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Mathematical Resistance</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Why manipulation is mathematically expensive
            </p>
          </div>

          <div className="max-w-3xl mx-auto card">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Quadratic Voting Cost</h4>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 font-mono text-center">
                  <p className="text-lg">Vote Weight = √(Credits Spent)</p>
                  <p className="text-sm text-slate-500 mt-2">
                    To double your influence, you must quadruple your cost
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Anti-Collusion Proof</h4>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm mb-3">
                    If 10 coordinated liars try to overwhelm 100 honest students:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                      <p className="text-red-600 dark:text-red-400 font-bold">Liars</p>
                      <p className="font-mono">10 × √100 = 100</p>
                    </div>
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">Honest</p>
                      <p className="font-mono">100 × √1 = 100</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    Equal power at 10× the cost for attackers!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find the Truth?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join your campus community in separating fact from fiction.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Start Now →
          </Link>
        </div>
      </section>
    </div>
  );
}
