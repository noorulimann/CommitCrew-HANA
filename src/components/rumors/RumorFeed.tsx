'use client';

/**
 * RumorFeed Component
 * Scrollable list of rumors with filtering and sorting
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import RumorCard, { type RumorData } from './RumorCard';
import { getNullifierHash } from '@/lib/storage';

interface RumorFeedProps {
  initialRumors?: RumorData[];
  onVoteClick?: (rumorId: string) => void;
}

type SortOption = 'newest' | 'trending' | 'most-voted' | 'controversial';

export default function RumorFeed({ initialRumors = [], onVoteClick }: RumorFeedProps) {
  const [rumors, setRumors] = useState<RumorData[]>(initialRumors);
  const [userVotes, setUserVotes] = useState<Record<string, { hasVoted: boolean; voteValue?: boolean }>>({});
  const [isLoading, setIsLoading] = useState(!initialRumors.length);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  
  // Refs to prevent duplicate fetches
  const fetchedRef = useRef(false);
  const votesCheckedRef = useRef<Set<string>>(new Set());
  
  // Fetch rumors - only once on mount
  useEffect(() => {
    if (initialRumors.length > 0) {
      setRumors(initialRumors);
      return;
    }
    
    // Prevent duplicate fetches
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    fetchRumors();
  }, []); // Empty dependency - only run once
  
  // Check user votes - batch and only for new rumors
  useEffect(() => {
    const nullifier = getNullifierHash();
    if (!nullifier || rumors.length === 0 || isLoading) return;
    
    // Filter to only check rumors we haven't checked yet
    const uncheckedRumors = rumors.filter(r => !votesCheckedRef.current.has(r._id));
    if (uncheckedRumors.length === 0) return;
    
    checkUserVotes(nullifier, uncheckedRumors);
  }, [rumors, isLoading]);
  
  const fetchRumors = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rumors');
      const result = await response.json();
      
      if (result.success && result.data?.data) {
        setRumors(result.data.data);
      } else {
        setError(result.error || 'Failed to load rumors');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUserVotes = useCallback(async (nullifier: string, rumorsToCheck: RumorData[]) => {
    // Mark all as being checked to prevent duplicate requests
    rumorsToCheck.forEach(r => votesCheckedRef.current.add(r._id));
    
    const votes: Record<string, { hasVoted: boolean; voteValue?: boolean }> = {};
    
    // Check votes in small batches to avoid overwhelming the browser
    const batchSize = 5;
    for (let i = 0; i < rumorsToCheck.length; i += batchSize) {
      const batch = rumorsToCheck.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (rumor) => {
          try {
            const response = await fetch(
              `/api/votes/check?rumorId=${rumor._id}&voterNullifier=${nullifier}`
            );
            const result = await response.json();
            
            if (result.success && result.data) {
              votes[rumor._id] = {
                hasVoted: result.data.hasVoted,
                voteValue: result.data.vote?.voteValue,
              };
            }
          } catch {
            // Ignore errors for individual vote checks
          }
        })
      );
    }
    
    setUserVotes(prev => ({ ...prev, ...votes }));
  }, []);
  
  // Sort rumors based on selected option
  const sortedRumors = [...rumors].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'trending':
        // Rank score already considers age decay
        return (b.rankScore || 0) - (a.rankScore || 0);
      case 'most-voted':
        return b.totalVotes - a.totalVotes;
      case 'controversial':
        // Controversial = high votes but close to 0 score
        const aControversy = a.totalVotes / (Math.abs(a.truthScore) + 1);
        const bControversy = b.totalVotes / (Math.abs(b.truthScore) + 1);
        return bControversy - aControversy;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Error Loading Rumors
        </h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button 
          onClick={fetchRumors}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (rumors.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🏰</div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No Rumors Yet
        </h3>
        <p className="text-slate-500 mb-4">
          Be the first to submit a rumor for the community to verify!
        </p>
        <a href="/submit" className="btn-primary">
          Submit a Rumor
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {rumors.length} rumor{rumors.length !== 1 ? 's' : ''}
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="most-voted">Most Voted</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>
      </div>

      {/* Rumors List */}
      <div className="space-y-4">
        {sortedRumors.map((rumor) => (
          <RumorCard
            key={rumor._id}
            rumor={rumor}
            userVote={userVotes[rumor._id]}
            onVoteClick={onVoteClick}
          />
        ))}
      </div>
    </div>
  );
}
