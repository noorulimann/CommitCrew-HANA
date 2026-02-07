'use client';

/**
 * RumorSubmitForm Component
 * Form to submit a new rumor for verification
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getNullifierHash } from '@/lib/storage';

interface RumorSubmitFormProps {
  onSuccess?: (rumorId: string) => void;
}

export default function RumorSubmitForm({ onSuccess }: RumorSubmitFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const minLength = 10;
  const maxLength = 1000;
  const charCount = content.length;
  const isValid = charCount >= minLength && charCount <= maxLength;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check if logged in
    const nullifier = getNullifierHash();
    if (!nullifier) {
      setError('Please log in to submit a rumor');
      router.push('/login');
      return;
    }
    
    // Validate content
    if (!isValid) {
      setError(`Rumor must be between ${minLength} and ${maxLength} characters`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/rumors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          submitterNullifier: nullifier,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setContent('');
        if (onSuccess) {
          onSuccess(result.data._id);
        } else {
          router.push(`/rumor/${result.data._id}`);
        }
      } else {
        setError(result.error || 'Failed to submit rumor');
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
        <CardTitle>Submit a Rumor</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Share a rumor you&apos;ve heard. The community will vote to determine its truthfulness.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div>
            <label 
              htmlFor="content" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              What&apos;s the rumor?
            </label>
            
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="I heard that..."
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
            />
            
            {/* Character Count */}
            <div className="flex justify-between mt-1">
              <span className={`text-sm ${
                charCount < minLength ? 'text-red-500' :
                charCount > maxLength ? 'text-red-500' :
                'text-slate-500'
              }`}>
                {charCount < minLength 
                  ? `${minLength - charCount} more characters needed`
                  : charCount > maxLength
                  ? `${charCount - maxLength} characters over limit`
                  : `${maxLength - charCount} characters remaining`
                }
              </span>
              <span className="text-sm text-slate-500">
                {charCount}/{maxLength}
              </span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Guidelines
            </h4>
            <ul className="text-sm text-slate-500 space-y-1">
              <li>• Be specific and factual in your description</li>
              <li>• Don&apos;t include personal identifying information</li>
              <li>• Only submit rumors you&apos;ve actually heard</li>
              <li>• Respect community standards</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!isValid}
            >
              Submit Rumor
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
