import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

            try {
              // Search in both staff and consumers collections
              const [staffCollection, consumersCollection] = await Promise.all([
                collections.staff(),
                collections.consumers()
              ])
              
              const [staffUser, consumerUser] = await Promise.all([
                staffCollection.findOne({
                  email: credentials.email,
                  status: 'ACTIVE'
                }),
                consumersCollection.findOne({
                  email: credentials.email,
                  status: 'ACTIVE'
                })
              ])
              
              const user = staffUser || consumerUser

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          status: user.status,
          userType: user.userType || 'STAFF', // Standard für Staff-Benutzer
          customerId: user.customerId?.toString(),
          customerName: user.customerName
        }
        } catch (error) {
          console.error('Auth error:', error)
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
          })
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userType = (user as any).userType
        token.customerId = (user as any).customerId
        token.customerName = (user as any).customerName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        ;(session.user as any).userType = token.userType as string
        ;(session.user as any).customerId = token.customerId as string
        ;(session.user as any).customerName = token.customerName as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Bei Logout immer zur Anmeldeseite weiterleiten
      if (url.includes('/api/auth/signout')) {
        return `${baseUrl}/auth/signin`
      }
      // Bei anderen Weiterleitungen die ursprüngliche URL verwenden oder zur Basis-URL
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}
