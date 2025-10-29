/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // Vercel optimierte Bilddomains können hier hinzugefügt werden
  },
  // Environment Variables die an den Client weitergegeben werden sollen
  // Wichtig: Nur nicht-sensitive Variablen hier hinzufügen!
  env: {
    // Fügen Sie hier nur öffentliche Environment Variables hinzu
    // Sensitive Variablen (z.B. DATABASE_URL, SECRETS) sollten NICHT hier sein
  },
  // Optimierungen für Vercel
  // Standalone Build für bessere Performance
  output: 'standalone',
  // TypeScript und ESLint werden während des Builds geprüft
  typescript: {
    // Bei Fehlern kann das Deployment verhindert werden
    ignoreBuildErrors: false,
  },
  eslint: {
    // Bei Fehlern kann das Deployment verhindert werden
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
