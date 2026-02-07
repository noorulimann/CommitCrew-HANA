'use client';

import { useRouter } from 'next/navigation';
import { RumorFeed } from '@/components/rumors';

export default function FeedPage() {
  const router = useRouter();

  const handleVoteClick = (rumorId: string) => {
    router.push(`/rumor/${rumorId}#vote`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Rumor Feed
          </h1>
          <p className="text-slate-500 mt-1">
            Vote on rumors to determine their truthfulness
          </p>
        </div>
        
        <a 
          href="/submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Submit Rumor
        </a>
      </div>
      
      <RumorFeed onVoteClick={handleVoteClick} />
    </div>
  );
}
