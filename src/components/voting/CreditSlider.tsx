'use client';

/**
 * CreditSlider Component
 * Quadratic credit allocation slider (1-100)
 * Shows the vote weight = √credits
 */

import { cn } from '@/lib/utils';

interface CreditSliderProps {
  credits: number;
  onCreditsChange: (value: number) => void;
  minCredits?: number;
  maxCredits?: number;
  disabled?: boolean;
}

export default function CreditSlider({
  credits,
  onCreditsChange,
  minCredits = 1,
  maxCredits = 100,
  disabled = false,
}: CreditSliderProps) {
  // Calculate quadratic weight
  const voteWeight = Math.sqrt(credits);
  
  // Efficiency: how much weight per credit
  const efficiency = voteWeight / credits;
  
  // Quick select options
  const quickOptions = [1, 4, 9, 16, 25, 49, 100];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Credits to Spend
        </label>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {credits}
          </span>
          <span className="text-sm text-slate-500 ml-1">credits</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={minCredits}
          max={maxCredits}
          value={credits}
          onChange={(e) => onCreditsChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          className={cn(
            'w-full h-3 rounded-full appearance-none cursor-pointer',
            'bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200',
            'dark:from-emerald-900 dark:via-amber-900 dark:to-red-900',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-primary-600',
            '[&::-webkit-slider-thumb]:shadow-lg',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-white',
            '[&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-primary-600',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-white',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Scale markers */}
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{minCredits}</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>{maxCredits}</span>
        </div>
      </div>

      {/* Quick Select */}
      <div>
        <span className="text-xs text-slate-500 mb-2 block">Quick select:</span>
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onCreditsChange(val)}
              disabled={disabled}
              className={cn(
                'px-3 py-1 text-sm rounded-full transition-colors',
                credits === val
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Vote Weight Display */}
      <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Your Vote Weight
            </div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {voteWeight.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Formula</div>
            <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
              √{credits} = {voteWeight.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Efficiency indicator */}
        <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Efficiency:</span>
            <div className="flex-1 h-1.5 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  efficiency > 0.5 ? 'bg-emerald-500' :
                  efficiency > 0.2 ? 'bg-amber-500' :
                  'bg-red-500'
                )}
                style={{ width: `${efficiency * 100}%` }}
              />
            </div>
            <span className={cn(
              'text-xs font-medium',
              efficiency > 0.5 ? 'text-emerald-600' :
              efficiency > 0.2 ? 'text-amber-600' :
              'text-red-600'
            )}>
              {(efficiency * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {efficiency > 0.5 
              ? 'High efficiency - great value!'
              : efficiency > 0.2 
              ? 'Moderate efficiency'
              : 'Low efficiency - consider using fewer credits'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
