import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

/**
 * Merkle Tree Service
 * Handles Merkle tree operations for state commitment
 */

interface RumorScore {
  id: string;
  score: number;
}

export class MerkleService {
  /**
   * Hash function using keccak256 (Ethereum standard)
   */
  private static hashFunction(data: any): Buffer {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(stringData));
    return Buffer.from(hash.slice(2), 'hex');
  }

  /**
   * Create a leaf node for a rumor score
   */
  static createLeaf(rumorId: string, score: number): Buffer {
    const data = {
      id: rumorId,
      score: score,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
    };
    return this.hashFunction(JSON.stringify(data));
  }

  /**
   * Calculate Merkle root from rumor scores
   * @param rumors Array of rumor ID and score pairs
   * @returns Merkle root hash as hex string
   */
  static calculateMerkleRoot(rumors: RumorScore[]): {
    rootHash: string;
    tree: MerkleTree;
  } {
    if (rumors.length === 0) {
      // Return hash of empty state
      const emptyHash = this.hashFunction('[]');
      return {
        rootHash: '0x' + emptyHash.toString('hex'),
        tree: new MerkleTree([], this.hashFunction),
      };
    }

    // Create leaves from rumor scores
    const leaves = rumors.map((rumor) => this.createLeaf(rumor.id, rumor.score));

    // Build Merkle tree
    const tree = new MerkleTree(leaves, this.hashFunction, { sortPairs: true });

    // Get root hash
    const rootHash = tree.getRoot().toString('hex');

    return {
      rootHash: '0x' + rootHash,
      tree,
    };
  }

  /**
   * Verify a rumor score against the Merkle tree
   * @param tree Merkle tree instance
   * @param rumorId Rumor ID
   * @param score Score at time of commitment
   * @returns Is valid and proof
   */
  static verifyScore(
    tree: MerkleTree,
    rumorId: string,
    score: number
  ): {
    isValid: boolean;
    proof: string[];
  } {
    const leaf = this.createLeaf(rumorId, score);
    const proof = tree.getHexProof(leaf);

    const isValid = tree.verify(proof, leaf, tree.getRoot());

    return {
      isValid,
      proof,
    };
  }

  /**
   * Detect state violation by comparing current score with committed score
   * @param currentScore Current rumor score in database
   * @param committedScore Score at time of commitment
   * @param threshold Allowed variance percentage (default 5%)
   * @returns Is violation detected
   */
  static detectViolation(
    currentScore: number,
    committedScore: number,
    threshold: number = 5
  ): boolean {
    const variance = Math.abs(currentScore - committedScore);
    const percentVariance = (variance / Math.abs(committedScore || 1)) * 100;
    return percentVariance > threshold;
  }

  /**
   * Create hourly key for state commitment uniqueness
   */
  static getHourKey(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}`;
  }
}
