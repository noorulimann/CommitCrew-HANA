'use client';

/**
 * VoteSummary Component
 * Shows summary of the vote before submission
 */

import { cn } from '@/lib/utils';

interface VoteSummaryProps {
  voteValue: boolean | null;
  credits: number;
  prediction: number;
}

export default function VoteSummary({ 
  voteValue, 
  credits, 
  prediction 
}: VoteSummaryProps) {
  const voteWeight = Math.sqrt(credits);
  
  // Estimate potential trust score range
  const baseScore = voteWeight;
  const maxBayesianBonus = baseScore * 0.5; // 50% bonus for surprising truth
  const potentialMaxScore = baseScore + maxBayesianBonus;

  if (voteValue === null) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
        <p className="text-slate-500">Select your vote to see the summary</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4">
      <h4 className="font-medium text-slate-900 dark:text-white">
        Vote Summary
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Vote Selection */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">Your Vote</div>
          <div className={cn(
            'font-semibold text-lg flex items-center gap-2',
            voteValue ? 'text-emerald-600' : 'text-red-600'
          )}>
            <span>{voteValue ? '✓' : '✗'}</span>
            <span>{voteValue ? 'True' : 'False'}</span>
          </div>
        </div>
        
        {/* Credits */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">Credits Spent</div>
          <div className="font-semibold text-lg text-slate-900 dark:text-white">
            {credits}
          </div>
        </div>
        
        {/* Vote Weight */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">Vote Weight</div>
          <div className="font-semibold text-lg text-primary-600 dark:text-primary-400">
            {voteWeight.toFixed(2)}
          </div>
        </div>
        
        {/* Prediction */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-500 mb-1">Your Prediction</div>
          <div className="font-semibold text-lg text-slate-900 dark:text-white">
            {prediction}% True
          </div>
        </div>
      </div>
      
      {/* Potential Trust Score */}
      <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-primary-600 dark:text-primary-400">
              Potential Trust Score
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              (if you&apos;re correct)
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl text-primary-600 dark:text-primary-400">
              {baseScore.toFixed(2)} - {potentialMaxScore.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              base + bonuses
            </div>
          </div>
        </div>
      </div>
      
      {/* Bonus Explanation */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <strong>Base score:</strong> √{credits} = {voteWeight.toFixed(2)} points
        </p>
        <p>
          <strong>+50% bonus</strong> for &quot;surprising truth&quot; (vote true when others don&apos;t)
        </p>
        <p>
          <strong>+30% bonus</strong> for correct minority vote
        </p>
      </div>
    </div>
  );
}
