'use client';

/**
 * Rumor Detail Page
 * Display a single rumor with full stats and voting interface
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TruthMeter, RumorStats } from '@/components/rumors';
import { VoteForm, TrustScoreDisplay } from '@/components/voting';
import { getNullifierHash } from '@/lib/storage';
import { formatRelativeTime } from '@/lib/utils';

interface RumorDetail {
  _id: string;
  content: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: string;
  trueVotes: number;
  falseVotes: number;
  avgCredits: number;
  consensus: 'truth' | 'lie' | 'undetermined';
}

interface UserVote {
  hasVoted: boolean;
  vote?: {
    voteValue: boolean;
    creditsSpent: number;
    predictionPercent: number;
    quadraticWeight: number;
    bayesianBonus: number;
    finalTrustScore: number;
  };
}

export default function RumorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rumorId = params.id as string;
  
  const [rumor, setRumor] = useState<RumorDetail | null>(null);
  const [userVote, setUserVote] = useState<UserVote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoteForm, setShowVoteForm] = useState(false);

  // Fetch rumor details and user vote
  useEffect(() => {
    fetchRumorDetails();
  }, [rumorId]);

  const fetchRumorDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nullifier = getNullifierHash();
      let url = `/api/rumors/${rumorId}`;
      if (nullifier) {
        url += `?voterNullifier=${nullifier}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setRumor(result.data.rumor);
        setUserVote(result.data.userVote || null);
        
        // Check for #vote hash in URL
        if (window.location.hash === '#vote' && !result.data.userVote?.hasVoted) {
          setShowVoteForm(true);
        }
      } else {
        setError(result.error || 'Failed to load rumor');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSuccess = () => {
    setShowVoteForm(false);
    fetchRumorDetails();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !rumor) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {error || 'Rumor not found'}
            </h2>
            <p className="text-slate-500 mb-6">
              The rumor you&apos;re looking for might have been deleted or doesn&apos;t exist.
            </p>
            <Link href="/feed">
              <Button variant="primary">Back to Feed</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link 
        href="/feed"
        className="inline-flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feed
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rumor Content */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl text-slate-900 dark:text-white whitespace-pre-wrap mb-6">
                {rumor.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  Posted {formatRelativeTime(new Date(rumor.createdAt))}
                </span>
                <span>ID: {rumor._id.slice(-8)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Truth Meter */}
          <Card>
            <CardHeader>
              <CardTitle>Community Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <TruthMeter 
                score={rumor.truthScore} 
                totalVotes={rumor.totalVotes}
                size="lg"
              />
            </CardContent>
          </Card>

          {/* Vote Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Vote Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RumorStats
                trueVotes={rumor.trueVotes}
                falseVotes={rumor.falseVotes}
                totalVotes={rumor.totalVotes}
                avgCreditsSpent={rumor.avgCredits}
                consensus={rumor.consensus}
              />
            </CardContent>
          </Card>

          {/* Vote Form (Expanded) */}
          {showVoteForm && !userVote?.hasVoted && (
            <VoteForm
              rumorId={rumorId}
              onSuccess={handleVoteSuccess}
              onCancel={() => setShowVoteForm(false)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vote Action */}
          {!userVote?.hasVoted ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">🗳️</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Cast Your Vote
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Help determine if this rumor is true or false
                </p>
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setShowVoteForm(true)}
                >
                  Vote Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* User's Vote */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Vote</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vote:</span>
                      <span className={`font-semibold ${
                        userVote.vote?.voteValue 
                          ? 'text-emerald-600' 
                          : 'text-red-600'
                      }`}>
                        {userVote.vote?.voteValue ? '✓ True' : '✗ False'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credits:</span>
                      <span className="font-medium">{userVote.vote?.creditsSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weight:</span>
                      <span className="font-medium">
                        {userVote.vote?.quadraticWeight.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prediction:</span>
                      <span className="font-medium">
                        {userVote.vote?.predictionPercent}% True
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Score */}
              {userVote.vote && (
                <TrustScoreDisplay
                  baseScore={userVote.vote.quadraticWeight}
                  bayesianBonus={userVote.vote.bayesianBonus}
                  finalScore={userVote.vote.finalTrustScore}
                  isCorrect={
                    rumor.consensus === 'undetermined' 
                      ? null 
                      : (userVote.vote.voteValue === (rumor.consensus === 'truth'))
                  }
                  consensus={rumor.consensus}
                />
              )}
            </>
          )}

          {/* How Scoring Works */}
          <Card>
            <CardHeader>
              <CardTitle>How Scoring Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500 space-y-3">
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Quadratic Voting:</strong>
                <p>Vote weight = √(credits spent)</p>
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Bayesian Truth Serum:</strong>
                <p>Bonus for &quot;surprising truth&quot; predictions</p>
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Consensus:</strong>
                <p>Requires minimum 10 votes to determine</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
