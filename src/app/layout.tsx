import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bovenkamer Winterproef 2026',
  description: 'De officiële registratie voor de Bovenkamer Nieuwjaars BBQ - Ter beoordeling van Kandidaat Boy Boom',
  keywords: ['Bovenkamer', 'Winterproef', 'Junior Kamer', 'Venray', 'BBQ'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-deep-green">
        {children}
      </body>
    </html>
  )
}
