import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Servecta Portal - Alles aus einem Guss',
  description: 'Kundenportal für Servecta UG - Datenschutz & DSGVO, IT-Security, IT-Infrastruktur',
  keywords: ['Servecta', 'Admin', 'DSGVO', 'Datenschutz', 'IT-Security', 'Kundenportal', 'Customer Portal'],
  authors: [{ name: 'Servecta UG (haftungsbeschränkt) i.G.' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0E0E12',
  icons: {
    icon: '/assets/logo.svg',
    shortcut: '/assets/logo.svg',
    apple: '/assets/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
