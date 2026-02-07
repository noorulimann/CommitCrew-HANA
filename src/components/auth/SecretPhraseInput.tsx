'use client';

/**
 * SecretPhraseInput Component
 * 
 * Input for returning users to enter their existing secret phrase
 * Part of the Identity Gateway "brain wallet" login flow
 */

import { useState } from 'react';

interface SecretPhraseInputProps {
  onSubmit: (phrase: string) => void;
  isLoading?: boolean;
  error?: string;
  email: string;
}

export default function SecretPhraseInput({
  onSubmit,
  isLoading = false,
  error,
  email,
}: SecretPhraseInputProps) {
  const [phrase, setPhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phrase.trim()) return;
    
    onSubmit(phrase);
  };
  
  // Mask email for display
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Welcome back!
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter your secret phrase for <strong>{maskedEmail}</strong>
        </p>
      </div>
      
      {/* Phrase Input */}
      <div>
        <label 
          htmlFor="phrase" 
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Secret Phrase
        </label>
        
        <div className="relative">
          <input
            type={showPhrase ? 'text' : 'password'}
            id="phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter your secret phrase"
            disabled={isLoading}
            className={`input pr-12 font-mono ${error ? 'input-error' : ''}`}
            autoComplete="off"
            autoFocus
          />
          
          <button
            type="button"
            onClick={() => setShowPhrase(!showPhrase)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
      
      {/* Helper text */}
      <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
          🔐 How it works
        </p>
        <p>
          Your identity is generated from your email + secret phrase. 
          The same combination will always produce the same identity, 
          allowing you to login from any device.
        </p>
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || !phrase.trim()}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
        ) : (
          'Login'
        )}
      </button>
      
      {/* Forgot phrase notice */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Forgot your phrase? Unfortunately, it cannot be recovered.
        You&apos;ll need to create a new account with the same email.
      </p>
    </form>
  );
}
