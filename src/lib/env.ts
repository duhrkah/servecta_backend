/**
 * Environment Variable Validierung und Konfiguration
 * 
 * Diese Datei stellt sicher, dass alle benötigten Environment Variables
 * korrekt gesetzt sind und bietet Helper-Funktionen für Vercel-spezifische
 * Konfigurationen.
 */

/**
 * Validiert, ob eine Environment Variable gesetzt ist
 */
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please set ${key} in your Vercel project settings or .env.local file.`
    )
  }
  return value
}

/**
 * Holt eine Environment Variable mit Fallback
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

/**
 * Gibt die korrekte NEXTAUTH_URL zurück
 * In Vercel wird VERCEL_URL automatisch gesetzt und verwendet
 */
export function getNextAuthUrl(): string {
  // Vercel setzt automatisch VERCEL_URL für jede Deployment
  const vercelUrl = process.env.VERCEL_URL
  
  // Wenn NEXTAUTH_URL explizit gesetzt ist, nutze diese (höchste Priorität)
  if (process.env.NEXTAUTH_URL) {
    // Stelle sicher, dass sie ein Protokoll hat
    const url = process.env.NEXTAUTH_URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    // Falls kein Protokoll, füge https:// hinzu (Production) oder http:// (Development)
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
    return isProd ? `https://${url}` : `http://${url}`
  }
  
  // In Vercel: Verwende VERCEL_URL automatisch
  if (vercelUrl) {
    // VERCEL_URL hat kein Protokoll, also fügen wir https:// hinzu
    return `https://${vercelUrl}`
  }
  
  // Fallback für lokale Entwicklung
  return 'http://localhost:3001'
}

/**
 * Environment Variables Konfiguration
 */
// Lazy evaluation für NEXTAUTH_URL, um Fehler beim Modul-Import zu vermeiden
function getEnvConfig() {
  return {
    // Datenbank
    get DATABASE_URL() {
      return requireEnv('DATABASE_URL')
    },
    
    // NextAuth
    get NEXTAUTH_URL() {
      return getNextAuthUrl()
    },
    get NEXTAUTH_SECRET() {
      return requireEnv('NEXTAUTH_SECRET')
    },
    
    // Cron Jobs
    get CRON_SECRET() {
      return getEnv('CRON_SECRET')
    },
    
    // Node.js Umgebung
    get NODE_ENV() {
      return (getEnv('NODE_ENV', 'development') || 'development') as 'development' | 'production' | 'test'
    },
    
    // Vercel-spezifische Variablen (optional)
    get VERCEL_URL() {
      return getEnv('VERCEL_URL')
    },
    get VERCEL_ENV() {
      return getEnv('VERCEL_ENV')
    },
    
    // Helper-Funktionen
    isDevelopment: () => process.env.NODE_ENV === 'development',
    isProduction: () => process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
    isVercel: () => !!process.env.VERCEL_URL,
  }
}

export const env = getEnvConfig()

/**
 * Validiert alle kritischen Environment Variables beim Start
 * Sollte beim App-Start aufgerufen werden
 */
export function validateEnv(): void {
  try {
    requireEnv('DATABASE_URL')
    requireEnv('NEXTAUTH_SECRET')
    
    // Validiere NEXTAUTH_SECRET Länge
    const secret = process.env.NEXTAUTH_SECRET
    if (secret && secret.length < 32) {
      console.warn(
        '⚠️  WARNING: NEXTAUTH_SECRET should be at least 32 characters long for security.'
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Environment validation failed:', error.message)
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
    }
  }
}

