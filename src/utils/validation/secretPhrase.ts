/**
 * Secret Phrase Validation Utilities
 * 
 * Validates that secret phrases meet security requirements:
 * - Minimum 3 words OR 12 characters
 * - Used for brain wallet / deterministic identity
 */

/**
 * Minimum requirements for secret phrases
 */
export const SECRET_PHRASE_REQUIREMENTS = {
  MIN_WORDS: 3,
  MIN_CHARACTERS: 12,
  MAX_CHARACTERS: 256,
};

/**
 * Count words in a phrase
 * @param phrase - The phrase to count words in
 * @returns number - The word count
 */
export function countWords(phrase: string): number {
  if (!phrase || typeof phrase !== 'string') {
    return 0;
  }
  
  // Split by whitespace and filter empty strings
  const words = phrase.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Check if a secret phrase meets the requirements
 * Must have at least 3 words OR at least 12 characters
 * 
 * @param phrase - The phrase to validate
 * @returns boolean - Whether the phrase is valid
 */
export function isValidSecretPhrase(phrase: string): boolean {
  if (!phrase || typeof phrase !== 'string') {
    return false;
  }
  
  const trimmedPhrase = phrase.trim();
  
  // Check max length
  if (trimmedPhrase.length > SECRET_PHRASE_REQUIREMENTS.MAX_CHARACTERS) {
    return false;
  }
  
  // Check minimum requirements (3 words OR 12 characters)
  const wordCount = countWords(trimmedPhrase);
  const charCount = trimmedPhrase.length;
  
  return wordCount >= SECRET_PHRASE_REQUIREMENTS.MIN_WORDS || 
         charCount >= SECRET_PHRASE_REQUIREMENTS.MIN_CHARACTERS;
}

/**
 * Calculate phrase strength for UI feedback
 * Returns a score from 0-100
 * 
 * @param phrase - The phrase to evaluate
 * @returns number - Strength score (0-100)
 */
export function calculatePhraseStrength(phrase: string): number {
  if (!phrase || typeof phrase !== 'string') {
    return 0;
  }
  
  const trimmedPhrase = phrase.trim();
  let score = 0;
  
  // Base score from length
  const charCount = trimmedPhrase.length;
  score += Math.min(30, charCount * 2); // Up to 30 points for length
  
  // Word count bonus
  const wordCount = countWords(trimmedPhrase);
  score += Math.min(30, wordCount * 10); // Up to 30 points for words
  
  // Variety bonus (different character types)
  const hasLowercase = /[a-z]/.test(trimmedPhrase);
  const hasUppercase = /[A-Z]/.test(trimmedPhrase);
  const hasNumbers = /[0-9]/.test(trimmedPhrase);
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(trimmedPhrase);
  
  if (hasLowercase) score += 10;
  if (hasUppercase) score += 10;
  if (hasNumbers) score += 10;
  if (hasSpecial) score += 10;
  
  return Math.min(100, score);
}

/**
 * Get strength label for UI display
 * @param strength - The strength score (0-100)
 * @returns string - Human-readable strength label
 */
export function getStrengthLabel(strength: number): string {
  if (strength < 25) return 'Weak';
  if (strength < 50) return 'Fair';
  if (strength < 75) return 'Good';
  return 'Strong';
}

/**
 * Get strength color for UI display
 * @param strength - The strength score (0-100)
 * @returns string - Tailwind color class
 */
export function getStrengthColor(strength: number): string {
  if (strength < 25) return 'bg-red-500';
  if (strength < 50) return 'bg-orange-500';
  if (strength < 75) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

/**
 * Validation result with detailed feedback
 */
export interface SecretPhraseValidationResult {
  isValid: boolean;
  error?: string;
  wordCount: number;
  charCount: number;
  strength: number;
  strengthLabel: string;
}

/**
 * Validate secret phrase with detailed feedback
 * @param phrase - The phrase to validate
 * @returns SecretPhraseValidationResult - Detailed validation result
 */
export function validateSecretPhrase(phrase: string): SecretPhraseValidationResult {
  const trimmedPhrase = phrase?.trim() || '';
  const wordCount = countWords(trimmedPhrase);
  const charCount = trimmedPhrase.length;
  const strength = calculatePhraseStrength(trimmedPhrase);
  const strengthLabel = getStrengthLabel(strength);
  
  // Check if phrase is provided
  if (!phrase || trimmedPhrase === '') {
    return {
      isValid: false,
      error: 'Secret phrase is required',
      wordCount,
      charCount,
      strength,
      strengthLabel,
    };
  }
  
  // Check max length
  if (charCount > SECRET_PHRASE_REQUIREMENTS.MAX_CHARACTERS) {
    return {
      isValid: false,
      error: `Secret phrase must be ${SECRET_PHRASE_REQUIREMENTS.MAX_CHARACTERS} characters or less`,
      wordCount,
      charCount,
      strength,
      strengthLabel,
    };
  }
  
  // Check minimum requirements
  const meetsWordReq = wordCount >= SECRET_PHRASE_REQUIREMENTS.MIN_WORDS;
  const meetsCharReq = charCount >= SECRET_PHRASE_REQUIREMENTS.MIN_CHARACTERS;
  
  if (!meetsWordReq && !meetsCharReq) {
    return {
      isValid: false,
      error: `Must have at least ${SECRET_PHRASE_REQUIREMENTS.MIN_WORDS} words or ${SECRET_PHRASE_REQUIREMENTS.MIN_CHARACTERS} characters`,
      wordCount,
      charCount,
      strength,
      strengthLabel,
    };
  }
  
  return {
    isValid: true,
    wordCount,
    charCount,
    strength,
    strengthLabel,
  };
}

export default isValidSecretPhrase;
