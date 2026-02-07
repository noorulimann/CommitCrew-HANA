'use client';

/**
 * Login Page - Identity Gateway
 * 
 * Full authentication flow:
 * 1. Enter .edu email
 * 2. Verify OTP sent to email
 * 3. Create secret phrase (new users) or enter existing phrase (returning users)
 * 4. Generate identity hash client-side
 * 5. Register/Login with hash
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EmailInput,
  OTPVerification,
  SecretPhraseCreator,
  SecretPhraseInput,
} from '@/components/auth';
import { generateNullifier } from '@/utils/crypto/nullifier';
import { setNullifierHash, setSession } from '@/lib/storage';

// Authentication steps
type AuthStep = 'email' | 'otp' | 'phrase-new' | 'phrase-existing' | 'success';

interface AuthState {
  step: AuthStep;
  email: string;
  emailHash: string;
  otpExpiresAt: Date | null;
  isNewUser: boolean;
  nullifierHash: string;
}

export default function LoginPage() {
  const router = useRouter();
  
  const [state, setState] = useState<AuthState>({
    step: 'email',
    email: '',
    emailHash: '',
    otpExpiresAt: null,
    isNewUser: true,
    nullifierHash: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Check if user is returning or new
  const handleEmailSubmit = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to process email');
        return;
      }
      
      // Check if returning user
      if (data.data.isReturningUser) {
        // Skip OTP for returning users, go directly to phrase input
        setState(prev => ({
          ...prev,
          step: 'phrase-existing',
          email,
          isNewUser: false,
        }));
      } else {
        // New user - proceed to OTP
        setState(prev => ({
          ...prev,
          step: 'otp',
          email,
          otpExpiresAt: new Date(data.data.expiresAt),
          isNewUser: true,
        }));
      }
      
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 2: Verify OTP
  const handleOTPSubmit = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, otp }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Invalid verification code');
        return;
      }
      
      // Check if user already exists (for determining new vs returning user flow)
      // We'll ask the user directly since we can't check without the hash
      setState(prev => ({
        ...prev,
        step: 'phrase-new', // Start with new user flow, they can switch
        emailHash: data.data.emailHash,
      }));
      
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend OTP
  const handleResendOTP = async () => {
    await handleEmailSubmit(state.email);
  };
  
  // Step 3a: Create new secret phrase
  const handleCreatePhrase = async (phrase: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate nullifier hash client-side
      const nullifierHash = await generateNullifier(state.email, phrase);
      
      // Register with server
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nullifierHash,
          emailHash: state.emailHash,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }
      
      // Store hash in localStorage
      setNullifierHash(nullifierHash);
      setSession({
        nullifierHash,
        loggedInAt: new Date().toISOString(),
      });
      
      setState(prev => ({
        ...prev,
        step: 'success',
        nullifierHash,
        isNewUser: data.data.isNewUser,
      }));
      
      // Redirect to feed after short delay
      setTimeout(() => {
        router.push('/feed');
      }, 2000);
      
    } catch {
      setError('Failed to create identity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 3b: Enter existing secret phrase
  const handleLoginPhrase = async (phrase: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Regenerate nullifier hash client-side
      const nullifierHash = await generateNullifier(state.email, phrase);
      
      // Verify with server
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nullifierHash }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Provide specific error message for wrong secret phrase
        setError('Incorrect secret phrase. Your identity does not match this email.');
        return;
      }
      
      // Store hash in localStorage
      setNullifierHash(nullifierHash);
      setSession({
        nullifierHash,
        loggedInAt: new Date().toISOString(),
        reputationScore: data.data.user.reputationScore,
      });
      
      setState(prev => ({
        ...prev,
        step: 'success',
        nullifierHash,
        isNewUser: false,
      }));
      
      // Redirect to feed after short delay
      setTimeout(() => {
        router.push('/feed');
      }, 2000);
      
    } catch {
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle between new and existing user
  const toggleUserType = () => {
    // Go back to email step so the system can properly check if they're a returning user
    setState(prev => ({
      ...prev,
      step: 'email' as AuthStep,
      email: '', // Clear email for re-entry
    }));
    setError(null);
  };
  
  // Go back to previous step
  const goBack = () => {
    setState(prev => {
      switch (prev.step) {
        case 'otp':
          return { ...prev, step: 'email' as AuthStep };
        case 'phrase-existing':
          // For returning users, go back to email (they skipped OTP)
          return { ...prev, step: prev.isNewUser ? 'otp' : 'email' as AuthStep };
        case 'phrase-new':
          return { ...prev, step: 'otp' as AuthStep };
        default:
          return prev;
      }
    });
    setError(null);
  };
  
  // Render current step
  const renderStep = () => {
    switch (state.step) {
      case 'email':
        return (
          <EmailInput
            onSubmit={handleEmailSubmit}
            isLoading={isLoading}
            error={error || undefined}
            initialEmail={state.email}
          />
        );
        
      case 'otp':
        return (
          <OTPVerification
            onSubmit={handleOTPSubmit}
            onResend={handleResendOTP}
            isLoading={isLoading}
            error={error || undefined}
            email={state.email}
            expiresAt={state.otpExpiresAt ?? undefined}
          />
        );
        
      case 'phrase-new':
        return (
          <div className="space-y-4">
            <SecretPhraseCreator
              onSubmit={handleCreatePhrase}
              isLoading={isLoading}
              error={error || undefined}
            />
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button
                onClick={toggleUserType}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Login instead
              </button>
            </p>
          </div>
        );
        
      case 'phrase-existing':
        return (
          <div className="space-y-4">
            <SecretPhraseInput
              onSubmit={handleLoginPhrase}
              isLoading={isLoading}
              error={error || undefined}
              email={state.email}
            />
            <p className="text-center text-sm text-slate-500">
              New to Citadel?{' '}
              <button
                onClick={toggleUserType}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create account
              </button>
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {state.isNewUser ? 'Welcome to the Citadel!' : 'Welcome back!'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {state.isNewUser 
                ? 'Your anonymous identity has been created.'
                : 'You have been authenticated successfully.'
              }
            </p>
            <p className="text-sm text-slate-400">
              Redirecting to feed...
            </p>
          </div>
        );
    }
  };
  
  // Get step number for progress indicator
  const getStepNumber = (): number => {
    switch (state.step) {
      case 'email': return 1;
      case 'otp': return 2;
      case 'phrase-new':
      case 'phrase-existing': return 3;
      case 'success': return 4;
    }
  };
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Citadel of Truth
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Anonymous. Secure. Truthful.
          </p>
        </div>
        
        {/* Progress indicator */}
        {state.step !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      transition-colors duration-200
                      ${getStepNumber() >= step 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }
                    `}
                  >
                    {getStepNumber() > step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step}
                  </div>
                  {step < 3 && (
                    <div 
                      className={`
                        w-12 h-0.5 mx-1
                        ${getStepNumber() > step 
                          ? 'bg-primary-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8 mt-2 text-xs text-slate-500">
              <span>Email</span>
              <span>Verify</span>
              <span>Identity</span>
            </div>
          </div>
        )}
        
        {/* Main card */}
        <div className="card">
          {/* Back button */}
          {state.step !== 'email' && state.step !== 'success' && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          
          {renderStep()}
        </div>
        
        {/* Privacy notice */}
        {state.step !== 'success' && (
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>🔒 Your email and secret phrase are never stored.</p>
            <p>Only an irreversible hash identifies you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
