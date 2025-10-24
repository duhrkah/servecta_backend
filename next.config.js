/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Set custom port
  serverRuntimeConfig: {
    port: process.env.PORT || 3001,
  },
}

module.exports = nextConfig
