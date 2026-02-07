/**
 * Validation Utilities Index
 * Re-exports all validation functions
 */

export { 
  isValidEduEmail, 
  validateEmail, 
  getEmailDomain, 
  getInstitutionFromEmail,
  type EmailValidationResult 
} from './email';

export { 
  isValidSecretPhrase, 
  validateSecretPhrase,
  countWords,
  calculatePhraseStrength,
  getStrengthLabel,
  getStrengthColor,
  SECRET_PHRASE_REQUIREMENTS,
  type SecretPhraseValidationResult 
} from './secretPhrase';
