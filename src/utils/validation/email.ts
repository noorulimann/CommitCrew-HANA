/**
 * Email Validation Utilities
 * 
 * Validates that emails meet the educational domain requirement
 * for campus-only access to the Citadel of Truth
 * 
 * Supported domains:
 * - .edu (US universities)
 * - .edu.xx (international - .edu.pk, .edu.au, .edu.in, etc.)
 * - .ac.xx (UK and others - .ac.uk, .ac.jp, etc.)
 */

// Regex pattern for educational email domains
const EDU_DOMAIN_PATTERN = /\.(edu|edu\.[a-z]{2,3}|ac\.[a-z]{2,3})$/i;

/**
 * Check if an email is a valid educational email address
 * @param email - The email to validate
 * @returns boolean - Whether the email is valid
 */
export function isValidEduEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Must match educational domain pattern
  const domain = trimmedEmail.split('@')[1];
  return EDU_DOMAIN_PATTERN.test(domain);
}

/**
 * Get the domain from an email address
 * @param email - The email address
 * @returns string | null - The domain or null if invalid
 */
export function getEmailDomain(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return null;
  }
  
  return parts[1];
}

/**
 * Get the institution name from an educational email
 * @param email - The email address
 * @returns string | null - The institution name or null
 */
export function getInstitutionFromEmail(email: string): string | null {
  const domain = getEmailDomain(email);
  if (!domain || !EDU_DOMAIN_PATTERN.test(domain)) {
    return null;
  }
  
  // Remove edu suffix (.edu, .edu.pk, .ac.uk, etc.) and get institution
  const parts = domain
    .replace(/\.(edu|edu\.[a-z]{2,3}|ac\.[a-z]{2,3})$/i, '')
    .split('.');
  // Return the last part (e.g., "nu" from "nu.edu.pk" or "stanford" from "stanford.edu")
  return parts[parts.length - 1] || null;
}

/**
 * Validation result with error message
 */
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email with detailed error message
 * @param email - The email to validate
 * @returns EmailValidationResult - Validation result with error if any
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check basic format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  // Check for educational domain
  const domain = trimmedEmail.split('@')[1];
  if (!EDU_DOMAIN_PATTERN.test(domain)) {
    return { 
      isValid: false, 
      error: 'Only educational email addresses are allowed (.edu, .edu.pk, .ac.uk, etc.)' 
    };
  }
  
  return { isValid: true };
}

export default isValidEduEmail;
