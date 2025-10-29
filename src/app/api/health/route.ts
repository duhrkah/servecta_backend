import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { validateEnv } from '@/lib/env'

export async function GET() {
  try {
    // Validiere Environment Variables
    try {
      validateEnv()
    } catch (envError) {
      console.error('Environment validation failed:', envError)
      // In Production sollte dies einen Fehler zurückgeben
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || process.env.VERCEL_ENV,
          error: 'Environment variables not properly configured',
          details: envError instanceof Error ? envError.message : 'Unknown error'
        }, { status: 503 })
      }
    }
    
    // Test database connection
    const db = await getDatabase()
    await db.admin().ping()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || process.env.VERCEL_ENV || 'unknown',
      vercel: {
        url: process.env.VERCEL_URL || 'not set',
        env: process.env.VERCEL_ENV || 'not set',
      },
      databaseUrl: (process.env.MONGODB_URI || process.env.DATABASE_URL) ? 'Set' : 'Not set',
      mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      nextAuthUrl: process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? 'Set' : 'Not set',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || process.env.VERCEL_ENV || 'unknown',
      databaseUrl: (process.env.MONGODB_URI || process.env.DATABASE_URL) ? 'Set' : 'Not set'
    }, { status: 500 })
  }
}
