import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { env } from '@/lib/env'

// Schützt API-Routen: Zugriff nur mit gültiger NextAuth-Session ODER korrektem x-api-key
export async function middleware(request: NextRequest) {
	// Erlaube CORS Preflight
	if (request.method === 'OPTIONS') {
		return NextResponse.next()
	}
	// 1) API Key Check
	const apiKeyHeader = request.headers.get('x-api-key')
	if (apiKeyHeader && env.API_KEY && apiKeyHeader === env.API_KEY) {
		return NextResponse.next()
	}

	// 2) NextAuth Session Check via JWT Token
	// Benötigt NEXTAUTH_SECRET
	try {
		const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET })
		if (token) {
			return NextResponse.next()
		}
	} catch {
		// Fällt durch zu 401
	}

	// 3) Blockieren
	return new NextResponse(
		JSON.stringify({ error: 'Unauthorized', message: 'Missing valid session or API key' }),
		{ status: 401, headers: { 'content-type': 'application/json' } }
	)
}

// Gilt für alle Business-APIs unter /api/v1/*
export const config = {
	matcher: [
		'/api/v1/:path*',
	]
}


