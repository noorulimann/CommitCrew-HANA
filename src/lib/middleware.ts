/**
 * Security & Validation Middleware
 * Handles authentication, rate limiting, input validation, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiter using in-memory store
 * In production, use Redis
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number = 15 * 60 * 1000; // 15 minutes
  private maxRequests: number = 100;

  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

export const globalRateLimiter = new RateLimiter();

/**
 * Input validation helper
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; error?: string } {
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === '') {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Campus email validation (.edu domain)
 */
export function validateCampusEmail(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  return email.toLowerCase().endsWith('.edu');
}

/**
 * Bearer token extraction
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Admin token validation (simple implementation)
 * In production, use JWT verification
 */
export function validateAdminToken(token: string): boolean {
  // This is a placeholder - in production use proper JWT verification
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    console.warn('ADMIN_TOKEN not configured');
    return false;
  }
  return token === adminToken;
}

/**
 * User nullifier validation (hex string)
 */
export function validateNullifier(nullifier: string): boolean {
  // Should be 64 character hex string (SHA256)
  return /^[a-f0-9]{64}$/i.test(nullifier);
}

/**
 * Rumor ID validation (MongoDB ObjectId)
 */
export function validateObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

/**
 * CORS helper
 */
export function setCORSHeaders(response: NextResponse): NextResponse {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

/**
 * Security headers
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Limit length
}

/**
 * Create error response with proper formatting
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse {
  const response = NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
  return setSecurityHeaders(setCORSHeaders(response));
}

/**
 * Create success response with proper formatting
 */
export function createSuccessResponse(
  data: any,
  statusCode: number = 200
): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
  return setSecurityHeaders(setCORSHeaders(response));
}

/**
 * Request logging helper
 */
export function logRequest(
  method: string,
  path: string,
  identifier: string,
  details?: any
): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path} - ${identifier}`, details || '');
}

/**
 * API key validation from environment
 */
export function validateAPIKey(apiKey: string): boolean {
  const validKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);
  return validKeys.includes(apiKey);
}
