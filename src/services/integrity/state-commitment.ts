import StateCommitment, { IStateCommitment } from '../../../database/schemas/StateCommitment';
import Rumor from '../../../database/schemas/Rumor';
import { MerkleService } from './merkle';
import { initializeDatabase } from '../../lib/db';

/**
 * State Commitment Service
 * Manages blockchain-backed state commitments and integrity checks
 */

export class StateCommitmentService {
  /**
   * Create an hourly state commitment
   * This should be called by a cron job every hour
   */
  static async createHourlyCommitment(): Promise<IStateCommitment | null> {
    try {
      await initializeDatabase();

      const hourKey = MerkleService.getHourKey();

      // Check if commitment already exists for this hour
      const existing = await StateCommitment.findOne({ hourKey });
      if (existing) {
        console.log(`State commitment already exists for ${hourKey}`);
        return existing;
      }

      // Fetch all active rumors with their current scores
      const rumors = await Rumor.find({ status: { $ne: 'deleted' } }).select(
        '_id truthScore'
      ) as any[];

      if (rumors.length === 0) {
        console.log('No active rumors found for commitment');
      }

      // Prepare rumor scores for Merkle tree
      const rumorScores = rumors.map((rumor: any) => ({
        id: rumor._id?.toString() || rumor._id,
        score: rumor.truthScore || 0,
      }));

      // Calculate Merkle root
      const { rootHash } = MerkleService.calculateMerkleRoot(rumorScores);

      // Store commitment in database
      const commitment = await StateCommitment.create({
        timestamp: new Date(),
        hourKey,
        rootHash,
        rumorCount: rumors.length,
        rumors: rumors.map((rumor: any) => ({
          id: rumor._id?.toString() || rumor._id,
          score: rumor.truthScore || 0,
          hash: MerkleService.createLeaf(
            rumor._id?.toString() || rumor._id,
            rumor.truthScore || 0
          ).toString('hex'),
        })),
        verified: true,
      });

      console.log(
        `✅ State commitment created for ${hourKey}: ${rootHash}`
      );
      return commitment;
    } catch (error) {
      console.error('Error creating state commitment:', error);
      return null;
    }
  }

  /**
   * Check for state violations
   * Compare current database scores with committed scores
   * @param rumorId Specific rumor to check, or null for all
   * @param hoursBack How many hours back to check (default: 24 hours)
   */
  static async checkStateViolations(
    rumorId?: string,
    hoursBack: number = 24
  ): Promise<Array<{
    violation: boolean;
    rumorId: string;
    currentScore: number;
    committedScore: number;
    commitment: any;
    variance: number;
  }>> {
    try {
      await initializeDatabase();

      const cutoffTime = new Date(Date.now() - hoursBack * 3600000);

      // Get recent commitments
      const commitments = await StateCommitment.find({
        timestamp: { $gte: cutoffTime },
        verified: true,
      }).sort({ timestamp: -1 });

      if (commitments.length === 0) {
        console.log('No verified commitments found in specified timeframe');
        return [];
      }

      const violations: Array<any> = [];

      for (const commitment of commitments) {
        for (const rumorData of commitment.rumors) {
          // Filter by specific rumor if provided
          if (rumorId && rumorData.id !== rumorId) {
            continue;
          }

          // Get current score from database
          const currentRumor = await Rumor.findById(rumorData.id).select(
            'truthScore status'
          ) as any;

          if (!currentRumor) {
            continue;
          }

          const currentScore = currentRumor.truthScore || 0;
          const committedScore = rumorData.score;

          // Check for violation
          const isViolation = MerkleService.detectViolation(
            currentScore,
            committedScore
          );

          if (isViolation) {
            violations.push({
              violation: true,
              rumorId: rumorData.id,
              currentScore,
              committedScore,
              commitment: {
                id: commitment._id?.toString() || commitment.id,
                hourKey: commitment.hourKey,
                rootHash: commitment.rootHash,
                timestamp: commitment.timestamp,
              },
              variance: Math.abs(currentScore - committedScore),
            });
          }
        }
      }

      return violations;
    } catch (error) {
      console.error('Error checking state violations:', error);
      return [];
    }
  }

  /**
   * Revert rumor to its committed state
   * Called when a state violation is detected
   * @param rumorId Rumor to revert
   * @param commitmentId Commitment to revert to
   */
  static async revertToCommittedState(
    rumorId: string,
    commitmentId: string
  ): Promise<{ success: boolean; message: string; revertedScore?: number }> {
    try {
      await initializeDatabase();

      // Get the commitment
      const commitment = await StateCommitment.findById(commitmentId);
      if (!commitment) {
        return {
          success: false,
          message: 'Commitment not found',
        };
      }

      // Find the rumor score in the commitment
      const rumorData = commitment.rumors.find((r: any) => r.id === rumorId);
      if (!rumorData) {
        return {
          success: false,
          message: 'Rumor not found in commitment',
        };
      }

      // Revert the rumor score
      const updatedRumor = await Rumor.findByIdAndUpdate(
        rumorId,
        { truthScore: rumorData.score },
        { new: true }
      ) as any;

      return {
        success: true,
        message: `Rumor ${rumorId} reverted to score ${rumorData.score} from commitment ${commitment.hourKey}`,
        revertedScore: rumorData.score,
      };
    } catch (error) {
      console.error('Error reverting to committed state:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get commitment history
   */
  static async getCommitmentHistory(
    limit: number = 24
  ): Promise<IStateCommitment[]> {
    try {
      await initializeDatabase();

      return await StateCommitment.find()
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching commitment history:', error);
      return [];
    }
  }

  /**
   * Verify a specific rumor against a commitment
   */
  static async verifyRumorIntegrity(
    rumorId: string,
    commitmentId: string
  ): Promise<{
    isValid: boolean;
    commitmentHash: string;
    rumorScore: number;
    currentScore: number;
  }> {
    try {
      await initializeDatabase();

      const commitment = await StateCommitment.findById(commitmentId);
      if (!commitment) {
        throw new Error('Commitment not found');
      }

      const rumorData = commitment.rumors.find((r: any) => r.id === rumorId);
      if (!rumorData) {
        throw new Error('Rumor not found in commitment');
      }

      const currentRumor = await Rumor.findById(rumorId).select('truthScore') as any;
      if (!currentRumor) {
        throw new Error('Rumor not found in database');
      }

      const isValid = rumorData.score === (currentRumor.truthScore || 0);

      return {
        isValid,
        commitmentHash: commitment.rootHash,
        rumorScore: rumorData.score,
        currentScore: currentRumor.truthScore || 0,
      };
    } catch (error) {
      console.error('Error verifying rumor integrity:', error);
      throw error;
    }
  }
}
