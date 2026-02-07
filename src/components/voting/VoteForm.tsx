'use client';

/**
 * VoteForm Component
 * Complete voting form combining all voting components
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import VoteButtons from './VoteButtons';
import CreditSlider from './CreditSlider';
import PredictionInput from './PredictionInput';
import VoteSummary from './VoteSummary';
import { getNullifierHash } from '@/lib/storage';

interface VoteFormProps {
  rumorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VoteForm({ rumorId, onSuccess, onCancel }: VoteFormProps) {
  const [voteValue, setVoteValue] = useState<boolean | null>(null);
  const [credits, setCredits] = useState(4); // Default to 4 (weight = 2)
  const [prediction, setPrediction] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const canProgress = () => {
    if (step === 1) return voteValue !== null;
    if (step === 2) return credits >= 1;
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    const nullifier = getNullifierHash();
    if (!nullifier) {
      setError('Please log in to vote');
      return;
    }

    if (voteValue === null) {
      setError('Please select True or False');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rumorId,
          voterNullifier: nullifier,
          voteValue,
          creditsSpent: credits,
          predictionPercent: prediction,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to submit vote');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step 
                  ? 'bg-primary-500' 
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Step {step} of 3: {
            step === 1 ? 'Select your vote' :
            step === 2 ? 'Choose credit amount' :
            'Your prediction'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Vote Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Do you believe this rumor is true or false?
            </p>
            <VoteButtons
              selectedVote={voteValue}
              onVoteChange={setVoteValue}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Step 2: Credit Allocation */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              How many credits do you want to spend on this vote? 
              More credits = stronger vote influence.
            </p>
            <CreditSlider
              credits={credits}
              onCreditsChange={setCredits}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Step 3: Prediction */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400">
              What percentage of voters do you think will vote True?
            </p>
            <PredictionInput
              prediction={prediction}
              onPredictionChange={setPrediction}
              disabled={isSubmitting}
            />
            
            <VoteSummary
              voteValue={voteValue}
              credits={credits}
              prediction={prediction}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-3">
        {step > 1 ? (
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}

        {step < 3 ? (
          <Button
            variant="primary"
            onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
            disabled={!canProgress()}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant={voteValue ? 'truth' : 'lie'}
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canProgress() || voteValue === null}
          >
            Submit Vote
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
