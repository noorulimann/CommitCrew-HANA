'use client';

/**
 * VoteButtons Component
 * True/False vote selection buttons
 */

import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  selectedVote: boolean | null;
  onVoteChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function VoteButtons({ 
  selectedVote, 
  onVoteChange, 
  disabled = false 
}: VoteButtonsProps) {
  return (
    <div className="flex gap-4">
      {/* True Button */}
      <button
        type="button"
        onClick={() => onVoteChange(true)}
        disabled={disabled}
        className={cn(
          'flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200',
          'flex items-center justify-center gap-2',
          selectedVote === true
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-2xl">✓</span>
        <span>True</span>
      </button>

      {/* False Button */}
      <button
        type="button"
        onClick={() => onVoteChange(false)}
        disabled={disabled}
        className={cn(
          'flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200',
          'flex items-center justify-center gap-2',
          selectedVote === false
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-2xl">✗</span>
        <span>False</span>
      </button>
    </div>
  );
}
