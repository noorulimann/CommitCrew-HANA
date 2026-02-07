'use client';

/**
 * TrustScoreDisplay Component
 * Display a user's earned trust score after voting
 */

import { cn } from '@/lib/utils';

interface TrustScoreDisplayProps {
  baseScore: number;
  bayesianBonus?: number;
  finalScore: number;
  isCorrect?: boolean | null;  // null = pending consensus
  consensus?: 'truth' | 'lie' | 'undetermined';
}

export default function TrustScoreDisplay({
  baseScore,
  bayesianBonus = 0,
  finalScore,
  isCorrect,
  consensus,
}: TrustScoreDisplayProps) {
  const isPending = isCorrect === null || consensus === 'undetermined';

  return (
    <div className={cn(
      'p-6 rounded-xl',
      isPending 
        ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
        : isCorrect
        ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50'
        : 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50'
    )}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">
          {isPending ? '⏳' : isCorrect ? '🎉' : '😔'}
        </div>
        <h3 className={cn(
          'text-lg font-semibold',
          isPending 
            ? 'text-slate-700 dark:text-slate-300'
            : isCorrect
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-red-700 dark:text-red-300'
        )}>
          {isPending 
            ? 'Awaiting Consensus'
            : isCorrect
            ? 'Correct Vote!'
            : 'Incorrect Vote'
          }
        </h3>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600">
          <span className="text-slate-600 dark:text-slate-400">Base Score</span>
          <span className="font-mono font-medium text-slate-900 dark:text-white">
            {baseScore.toFixed(2)}
          </span>
        </div>
        
        {bayesianBonus > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600">
            <span className="text-slate-600 dark:text-slate-400">
              Bayesian Bonus
            </span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              +{bayesianBonus.toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-slate-900 dark:text-white">
            Total Trust Score
          </span>
          <span className={cn(
            'font-mono font-bold text-2xl',
            isPending 
              ? 'text-slate-600 dark:text-slate-400'
              : isCorrect
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          )}>
            {isPending ? '?' : (isCorrect ? '+' : '') + finalScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status Message */}
      {isPending && (
        <div className="mt-4 p-3 bg-slate-200/50 dark:bg-slate-600/50 rounded-lg">
          <p className="text-sm text-center text-slate-600 dark:text-slate-400">
            Your trust score will be finalized once consensus is reached 
            (minimum 10 votes required)
          </p>
        </div>
      )}

      {!isPending && (
        <div className={cn(
          'mt-4 p-3 rounded-lg',
          isCorrect 
            ? 'bg-emerald-200/50 dark:bg-emerald-700/30'
            : 'bg-red-200/50 dark:bg-red-700/30'
        )}>
          <p className={cn(
            'text-sm text-center',
            isCorrect 
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-red-700 dark:text-red-300'
          )}>
            {isCorrect 
              ? 'Great job! Your vote matched the community consensus.'
              : 'Your vote differed from the community consensus.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
