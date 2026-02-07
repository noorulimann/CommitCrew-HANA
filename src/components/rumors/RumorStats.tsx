'use client';

/**
 * RumorStats Component
 * Displays vote breakdown and statistics for a rumor
 */

import { cn } from '@/lib/utils';

interface RumorStatsProps {
  trueVotes: number;
  falseVotes: number;
  totalVotes: number;
  avgCreditsSpent?: number;
  consensus?: 'truth' | 'lie' | 'undetermined';
  compact?: boolean;
}

export default function RumorStats({
  trueVotes,
  falseVotes,
  totalVotes,
  avgCreditsSpent,
  consensus,
  compact = false,
}: RumorStatsProps) {
  // Ensure all values are valid numbers
  const safeTrueVotes = Number.isFinite(trueVotes) ? trueVotes : 0;
  const safeFalseVotes = Number.isFinite(falseVotes) ? falseVotes : 0;
  const safeTotalVotes = Number.isFinite(totalVotes) ? totalVotes : 0;
  const safeAvgCredits = Number.isFinite(avgCreditsSpent) ? avgCreditsSpent : 0;
  
  // Calculate percentages safely
  const total = safeTrueVotes + safeFalseVotes || safeTotalVotes || 1;
  const truePercent = (safeTrueVotes / total) * 100;
  const falsePercent = (safeFalseVotes / total) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-emerald-500">✓</span>
          <span>{safeTrueVotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500">✗</span>
          <span>{safeFalseVotes}</span>
        </div>
        <span className="text-slate-400">|</span>
        <span className="text-slate-500">{safeTotalVotes} votes</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vote Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            True ({safeTrueVotes})
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium">
            False ({safeFalseVotes})
          </span>
        </div>
        
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${truePercent}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${falsePercent}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{truePercent.toFixed(0)}%</span>
          <span>{falsePercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {safeTotalVotes}
          </div>
          <div className="text-xs text-slate-500">Total Votes</div>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {Number.isFinite(safeAvgCredits) ? safeAvgCredits.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Credits</div>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className={cn(
            'text-2xl font-bold',
            consensus === 'truth' ? 'text-emerald-500' :
            consensus === 'lie' ? 'text-red-500' :
            'text-slate-400'
          )}>
            {consensus === 'truth' ? '✓' :
             consensus === 'lie' ? '✗' :
             '?'}
          </div>
          <div className="text-xs text-slate-500">Consensus</div>
        </div>
      </div>
    </div>
  );
}
