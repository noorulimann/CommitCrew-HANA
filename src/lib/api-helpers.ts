// API Helper utilities for consistent responses and error handling
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse, ERROR_CODES, ErrorCode } from '@/types/api';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
  status: number = 500,
  details?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ApiResponse> {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return errorResponse(
    'Validation failed',
    ERROR_CODES.VALIDATION_ERROR,
    400,
    details
  );
}

/**
 * Handle generic errors
 */
export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof Error) {
    // Check for known error types
    if (error.message.includes('duplicate key')) {
      return errorResponse(
        'Resource already exists',
        ERROR_CODES.USER_ALREADY_EXISTS,
        409
      );
    }

    if (error.message.includes('not found')) {
      return errorResponse(
        'Resource not found',
        ERROR_CODES.RUMOR_NOT_FOUND,
        404
      );
    }

    return errorResponse(error.message, ERROR_CODES.INTERNAL_ERROR, 500);
  }

  return errorResponse(
    'An unexpected error occurred',
    ERROR_CODES.INTERNAL_ERROR,
    500
  );
}

/**
 * Wrap an API handler with error handling
 */
export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiResponse>> {
  try {
    return await handler();
  } catch (error) {
    return handleError(error) as NextResponse<T | ApiResponse>;
  }
}

/**
 * Parse and validate request body with Zod schema
 */
export async function parseBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Get search params from request
 */
export function getSearchParams(request: Request): URLSearchParams {
  const { searchParams } = new URL(request.url);
  return searchParams;
}

/**
 * Get pagination params from request
 */
export function getPaginationParams(request: Request): {
  page: number;
  limit: number;
  skip: number;
} {
  const searchParams = getSearchParams(request);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}
