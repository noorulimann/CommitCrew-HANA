'use client';

/**
 * SecretPhraseCreator Component
 * 
 * Creates a new secret phrase for first-time users
 * Includes strength indicator and phrase generation
 * Part of the Identity Gateway "brain wallet" system
 */

import { useState, useEffect } from 'react';
import {
  validateSecretPhrase,
  getStrengthColor,
  SECRET_PHRASE_REQUIREMENTS,
} from '@/utils/validation/secretPhrase';

interface SecretPhraseCreatorProps {
  onSubmit: (phrase: string) => void;
  isLoading?: boolean;
  error?: string;
}

// Word lists for random phrase generation
const ADJECTIVES = [
  'blue', 'green', 'red', 'silver', 'golden', 'swift', 'quiet', 'brave',
  'calm', 'dark', 'bright', 'wild', 'gentle', 'fierce', 'proud', 'humble',
];

const NOUNS = [
  'forest', 'mountain', 'river', 'ocean', 'thunder', 'eagle', 'lion', 'wolf',
  'phoenix', 'dragon', 'castle', 'garden', 'sunset', 'storm', 'crystal', 'shadow',
];

const VERBS = [
  'runs', 'flies', 'dreams', 'shines', 'rises', 'falls', 'dances', 'whispers',
  'roars', 'glides', 'soars', 'blooms', 'echoes', 'awakens', 'wanders', 'blazes',
];

export default function SecretPhraseCreator({
  onSubmit,
  isLoading = false,
  error: externalError,
}: SecretPhraseCreatorProps) {
  const [phrase, setPhrase] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof validateSecretPhrase> | null>(null);
  
  // Validate phrase on change
  useEffect(() => {
    if (!phrase) {
      setValidation(null);
      return;
    }
    setValidation(validateSecretPhrase(phrase));
  }, [phrase]);
  
  // Generate random phrase
  const generateRandomPhrase = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
    const num = Math.floor(Math.random() * 100);
    
    setPhrase(`${adj}-${noun}-${verb}-${num}`);
    setConfirmPhrase('');
    setShowPhrase(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation?.isValid) return;
    
    if (phrase !== confirmPhrase) {
      return;
    }
    
    if (!understood) {
      return;
    }
    
    onSubmit(phrase);
  };
  
  const strength = validation?.strength ?? 0;
  const strengthColor = getStrengthColor(strength);
  const canSubmit = validation?.isValid && phrase === confirmPhrase && understood && !isLoading;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Remember This Phrase!
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This phrase is like your password. If you forget it, you <strong>cannot recover</strong> your account.
              Write it down somewhere safe!
            </p>
          </div>
        </div>
      </div>
      
      {/* Secret Phrase Input */}
      <div>
        <label 
          htmlFor="phrase" 
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Create Secret Phrase
        </label>
        
        <div className="relative">
          <input
            type={showPhrase ? 'text' : 'password'}
            id="phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="e.g., blue-forest-runs-42"
            disabled={isLoading}
            className={`input pr-20 font-mono ${validation && !validation.isValid ? 'input-error' : ''}`}
            autoComplete="off"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => setShowPhrase(!showPhrase)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showPhrase ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Strength indicator */}
        {validation && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">
                {validation.wordCount} words, {validation.charCount} characters
              </span>
              <span className={`font-medium ${
                strength < 25 ? 'text-red-500' :
                strength < 50 ? 'text-orange-500' :
                strength < 75 ? 'text-yellow-600' : 'text-emerald-500'
              }`}>
                {validation.strengthLabel}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${strengthColor}`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Error message */}
        {validation && !validation.isValid && (
          <p className="mt-1 text-sm text-red-500">{validation.error}</p>
        )}
        
        {/* Requirements hint */}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Minimum: {SECRET_PHRASE_REQUIREMENTS.MIN_WORDS} words or {SECRET_PHRASE_REQUIREMENTS.MIN_CHARACTERS} characters
        </p>
        
        {/* Generate button */}
        <button
          type="button"
          onClick={generateRandomPhrase}
          disabled={isLoading}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
        >
          🎲 Generate random phrase
        </button>
      </div>
      
      {/* Confirm Phrase */}
      <div>
        <label 
          htmlFor="confirmPhrase" 
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Confirm Secret Phrase
        </label>
        
        <input
          type={showPhrase ? 'text' : 'password'}
          id="confirmPhrase"
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
          placeholder="Re-enter your secret phrase"
          disabled={isLoading}
          className={`input font-mono ${
            confirmPhrase && confirmPhrase !== phrase ? 'input-error' : ''
          }`}
          autoComplete="off"
        />
        
        {confirmPhrase && confirmPhrase !== phrase && (
          <p className="mt-1 text-sm text-red-500">Phrases do not match</p>
        )}
        
        {confirmPhrase && confirmPhrase === phrase && validation?.isValid && (
          <p className="mt-1 text-sm text-emerald-500">✓ Phrases match</p>
        )}
      </div>
      
      {/* External error */}
      {externalError && (
        <p className="text-sm text-red-500 font-medium">{externalError}</p>
      )}
      
      {/* Acknowledgment */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          I understand that I must remember this phrase. If I forget it, I will <strong>permanently lose access</strong> to my account.
        </span>
      </label>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Identity...
          </span>
        ) : (
          'Create My Identity'
        )}
      </button>
    </form>
  );
}
