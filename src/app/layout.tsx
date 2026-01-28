import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://bovenkamer.netlify.app'),
  title: 'Bovenkamer Winterproef 2026',
  description: 'De officiële registratie voor de Bovenkamer Nieuwjaars BBQ - Ter beoordeling van Kandidaat Boy Boom',
  keywords: ['Bovenkamer', 'Winterproef', 'Junior Kamer', 'Venray', 'BBQ'],
  openGraph: {
    title: '🔥 Bovenkamer Winterproef 2026',
    description: 'Boy Boom op de proef. Registreer nu en help de Rechtsraad!',
    url: 'https://bovenkamer.netlify.app',
    siteName: 'Bovenkamer Winterproef',
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔥 Bovenkamer Winterproef 2026',
    description: 'Boy Boom op de proef. Registreer nu!',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-deep-green">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
