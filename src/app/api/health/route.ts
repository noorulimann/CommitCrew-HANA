import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { initializeServer, isServerInitialized } from '@/lib/server-init';

/**
 * Health check endpoint to verify database connection
 * GET /api/health
 */
export async function GET() {
  try {
    // Initialize server on first health check
    if (!isServerInitialized()) {
      initializeServer();
    }

    // Test database connection
    const mongoose = await connectDB();
    const isConnected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      status: 'ok',
      database: isConnected ? 'connected' : 'disconnected',
      serverInitialized: isServerInitialized(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
