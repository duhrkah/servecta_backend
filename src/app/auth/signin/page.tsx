'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'

export default function SignInPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-anthracite to-accent-blue">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (session) {
    router.push('/portal')
    return null
  }

  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      if (provider === 'credentials') {
        const result = await signIn('credentials', { 
          email, 
          password, 
          callbackUrl: '/portal',
          redirect: false 
        })
        
        if (result?.error) {
          console.error('Sign in error:', result.error)
          setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten oder melden Sie sich beim Kundensupport unter support@servecta.de.')
        } else if (result?.ok) {
          setError('')
          router.push('/portal')
        }
      } else {
        await signIn(provider, { callbackUrl: '/portal' })
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-anthracite to-accent-blue p-4">
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo width={192} height={192} className="h-48 w-48" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Servecta Kundenportal
          </CardTitle>
          <CardDescription className="text-gray-300">
            Alles aus einem Guss
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>

          <Button
            onClick={() => handleSignIn('credentials')}
            disabled={isLoading || !email || !password}
            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? 'Anmelden...' : 'Mit E-Mail anmelden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
