'use client';

/**
 * OTPVerification Component
 * 
 * 6-digit OTP input with auto-focus and paste support
 * Part of the Identity Gateway authentication flow
 */

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPVerificationProps {
  onSubmit: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
  email: string;
  expiresAt?: Date;
}

export default function OTPVerification({
  onSubmit,
  onResend,
  isLoading = false,
  error,
  email,
  expiresAt,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Calculate time left
  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
      setCanResend(diff === 0);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  
  // Auto-submit when all digits are entered
  useEffect(() => {
    const fullOtp = otp.join('');
    if (fullOtp.length === 6 && !otp.includes('')) {
      onSubmit(fullOtp);
    }
  }, [otp, onSubmit]);
  
  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    
    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
    
    // Move between inputs with arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    onResend();
  };
  
  // Mask email for display
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Check your email
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          We sent a 6-digit code to <strong>{maskedEmail}</strong>
        </p>
      </div>
      
      {/* OTP Input */}
      <div className="flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`
              w-12 h-14 text-center text-2xl font-bold rounded-lg
              border-2 transition-all duration-200
              ${error 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                : digit 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            maxLength={1}
          />
        ))}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-center text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
      
      {/* Timer and Resend */}
      <div className="text-center">
        {timeLeft > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Code expires in <span className="font-mono font-medium text-primary-600">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="text-sm text-orange-500 font-medium">
            Code expired
          </p>
        )}
        
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isLoading}
          className={`
            mt-2 text-sm font-medium transition-colors
            ${canResend 
              ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400' 
              : 'text-slate-400 cursor-not-allowed'
            }
          `}
        >
          {canResend ? "Didn't receive a code? Resend" : "Resend code"}
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verifying...
        </div>
      )}
    </div>
  );
}
