'use client';

/**
 * PredictionInput Component
 * Input for predicting what percentage of others will vote True
 * Used for Bayesian Truth Serum bonus calculation
 */

import { cn } from '@/lib/utils';

interface PredictionInputProps {
  prediction: number;
  onPredictionChange: (value: number) => void;
  disabled?: boolean;
}

export default function PredictionInput({
  prediction,
  onPredictionChange,
  disabled = false,
}: PredictionInputProps) {
  // Quick select options
  const quickOptions = [10, 25, 50, 75, 90];

  return (
    <div className="space-y-4">
      {/* Header with explanation */}
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Prediction: What % will vote True?
        </label>
        <p className="text-xs text-slate-500 mt-1">
          Predict accurately to earn bonus trust score (Bayesian Truth Serum)
        </p>
      </div>

      {/* Visual prediction display */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
          {/* True portion */}
          <div 
            className="h-full bg-emerald-500 transition-all duration-200"
            style={{ width: `${prediction}%` }}
          />
          
          {/* Labels overlay */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className={cn(
              'text-sm font-medium transition-colors',
              prediction > 30 ? 'text-white' : 'text-emerald-600'
            )}>
              True
            </span>
            <span className={cn(
              'text-sm font-medium transition-colors',
              prediction < 70 ? 'text-slate-700 dark:text-slate-300' : 'text-white'
            )}>
              False
            </span>
          </div>
        </div>
        
        {/* Percentage display */}
        <div className="text-center min-w-[80px]">
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {prediction}
          </span>
          <span className="text-lg text-slate-400">%</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={prediction}
        onChange={(e) => onPredictionChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className={cn(
          'w-full h-2 rounded-full appearance-none cursor-pointer',
          'bg-gradient-to-r from-red-300 via-slate-300 to-emerald-300',
          'dark:from-red-800 dark:via-slate-700 dark:to-emerald-800',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary-600',
          '[&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-primary-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />

      {/* Quick Select */}
      <div className="flex justify-between">
        {quickOptions.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onPredictionChange(val)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-all',
              prediction === val
                ? 'bg-primary-600 text-white scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {val}%
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Tip:</strong> If you correctly predict that few people will vote True 
            but you also vote True (a &quot;surprising truth&quot;), you&apos;ll earn a 50% bonus!
          </div>
        </div>
      </div>
    </div>
  );
}
