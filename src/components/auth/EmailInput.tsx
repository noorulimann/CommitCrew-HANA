'use client';

/**
 * EmailInput Component
 * 
 * Email entry form with .edu domain validation
 * Part of the Identity Gateway authentication flow
 */

import { useState, useEffect } from 'react';
import { validateEmail, getInstitutionFromEmail } from '@/utils/validation/email';

interface EmailInputProps {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  error?: string;
  initialEmail?: string;
}

export default function EmailInput({ 
  onSubmit, 
  isLoading = false, 
  error: externalError,
  initialEmail = '' 
}: EmailInputProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [institution, setInstitution] = useState<string | null>(null);
  
  // Validate email on change
  useEffect(() => {
    if (!email) {
      setError(null);
      setInstitution(null);
      return;
    }
    
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email');
      setInstitution(null);
    } else {
      setError(null);
      setInstitution(getInstitutionFromEmail(email));
    }
  }, [email]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email');
      return;
    }
    
    onSubmit(email.toLowerCase().trim());
  };
  
  const displayedError = externalError || error;
  const isValid = email && !error;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          School Email
        </label>
        
        <div className="relative">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@university.edu"
            disabled={isLoading}
            className={`input pr-10 ${displayedError ? 'input-error' : ''}`}
            autoComplete="email"
            autoFocus
          />
          
          {/* Validation indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isValid ? (
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : email && displayedError ? (
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : null}
          </div>
        </div>
        
        {/* Error message */}
        {displayedError && (
          <p className="mt-1 text-sm text-red-500">{displayedError}</p>
        )}
        
        {/* Institution hint */}
        {institution && !displayedError && (
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
            ✓ {institution.charAt(0).toUpperCase() + institution.slice(1)} email detected
          </p>
        )}
      </div>
      
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <p>📧 Only <strong>.edu</strong> email addresses are accepted</p>
        <p className="mt-1">🔒 Your email is only used for verification and is <strong>never stored</strong></p>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || !isValid}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending Code...
          </span>
        ) : (
          'Send Verification Code'
        )}
      </button>
    </form>
  );
}
