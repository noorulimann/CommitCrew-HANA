'use client';

/**
 * TruthMeter Component
 * Visual indicator showing the truth score of a rumor
 * 
 * Score interpretation:
 * - Positive score = Leaning towards TRUE
 * - Negative score = Leaning towards LIE
 * - Near zero = Undetermined
 */

import { cn } from '@/lib/utils';

interface TruthMeterProps {
  score: number;
  totalVotes: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function TruthMeter({ 
  score, 
  totalVotes, 
  size = 'md',
  showLabel = true 
}: TruthMeterProps) {
  // Normalize score to percentage (assuming max reasonable score is around ±50)
  const maxScore = 50;
  const normalizedScore = Math.max(-1, Math.min(1, score / maxScore));
  const percentage = ((normalizedScore + 1) / 2) * 100; // Convert -1 to 1 => 0 to 100
  
  // Determine status
  const getStatus = () => {
    if (totalVotes < 5) return { label: 'Undetermined', color: 'bg-slate-400' };
    if (score > 10) return { label: 'Likely True', color: 'bg-emerald-500' };
    if (score > 0) return { label: 'Leaning True', color: 'bg-emerald-400' };
    if (score < -10) return { label: 'Likely False', color: 'bg-red-500' };
    if (score < 0) return { label: 'Leaning False', color: 'bg-red-400' };
    return { label: 'Contested', color: 'bg-amber-400' };
  };
  
  const status = getStatus();
  
  const sizes = {
    sm: { bar: 'h-2', text: 'text-xs' },
    md: { bar: 'h-3', text: 'text-sm' },
    lg: { bar: 'h-4', text: 'text-base' },
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className={cn('font-medium', sizes[size].text, 
            score > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
            score < 0 ? 'text-red-600 dark:text-red-400' : 
            'text-slate-600 dark:text-slate-400'
          )}>
            {status.label}
          </span>
          <span className={cn('text-slate-500', sizes[size].text)}>
            Score: {score > 0 ? '+' : ''}{score.toFixed(1)}
          </span>
        </div>
      )}
      
      {/* Progress bar */}
      <div className={cn(
        'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
        sizes[size].bar
      )}>
        <div className="h-full flex">
          {/* False side (red) */}
          <div 
            className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${Math.max(0, 50 - percentage / 2)}%` }}
          />
          
          {/* Center marker */}
          <div className="w-px bg-slate-400 dark:bg-slate-500" />
          
          {/* True side (green) */}
          <div 
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(0, percentage / 2 - 50)}%` }}
          />
          
          {/* Fill remaining space */}
          <div className="flex-1" />
        </div>
      </div>
      
      {/* Labels */}
      <div className={cn('flex justify-between mt-1', sizes[size].text)}>
        <span className="text-red-500">False</span>
        <span className="text-emerald-500">True</span>
      </div>
    </div>
  );
}
