'use client';

/**
 * RumorCard Component
 * Display a single rumor with its score and voting actions
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import TruthMeter from './TruthMeter';
import RumorStats from './RumorStats';
import { formatRelativeTime } from '@/lib/utils';

export interface RumorData {
  _id: string;
  content: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: string | Date;
  ageHours?: number;
  rankScore?: number;
  trueVotes?: number;
  falseVotes?: number;
}

interface RumorCardProps {
  rumor: RumorData;
  userVote?: {
    hasVoted: boolean;
    voteValue?: boolean;
  } | null;
  onVoteClick?: (rumorId: string) => void;
  showFullStats?: boolean;
}

export default function RumorCard({ 
  rumor, 
  userVote, 
  onVoteClick,
  showFullStats = false,
}: RumorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const createdDate = new Date(rumor.createdAt);
  const timeAgo = formatRelativeTime(createdDate);
  
  // Truncate long content
  const maxLength = 200;
  const shouldTruncate = rumor.content.length > maxLength && !isExpanded;
  const displayContent = shouldTruncate 
    ? rumor.content.slice(0, maxLength) + '...' 
    : rumor.content;

  return (
    <Card variant="hover" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <Link 
            href={`/rumor/${rumor._id}`}
            className="text-lg font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <p className="whitespace-pre-wrap">{displayContent}</p>
          </Link>
          
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-primary-600 dark:text-primary-400 text-sm mt-1 hover:underline"
            >
              Read more
            </button>
          )}
        </div>
        
        {/* Vote Status Badge */}
        {userVote?.hasVoted && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            userVote.voteValue 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            You voted {userVote.voteValue ? 'True' : 'False'}
          </div>
        )}
      </div>

      {/* Truth Meter */}
      <div className="mb-4">
        <TruthMeter 
          score={rumor.truthScore} 
          totalVotes={rumor.totalVotes}
          size="sm"
        />
      </div>

      {/* Stats */}
      <RumorStats
        trueVotes={rumor.trueVotes ?? 0}
        falseVotes={rumor.falseVotes ?? 0}
        totalVotes={rumor.totalVotes}
        compact={true}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <span className="text-sm text-slate-500">
          {timeAgo}
        </span>
        
        <div className="flex gap-2">
          {!userVote?.hasVoted && onVoteClick && (
            <button
              onClick={() => onVoteClick(rumor._id)}
              className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              Vote
            </button>
          )}
          
          <Link
            href={`/rumor/${rumor._id}`}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </Card>
  );
}
