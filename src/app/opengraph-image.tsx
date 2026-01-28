import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Bovenkamer Winterproef 2026'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2C1810 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Fire emoji decoration */}
        <div style={{ fontSize: 80, marginBottom: 20, display: 'flex' }}>
          🔥🥩🍷🔥
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#D4AF37',
            marginBottom: 20,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Bovenkamer Winterproef
        </div>

        {/* Year */}
        <div
          style={{
            fontSize: 48,
            color: '#F5F5DC',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          2026
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#F5F5DC',
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 800,
            display: 'flex',
          }}
        >
          Ter beoordeling van Kandidaat Boy Boom
        </div>

        {/* Call to action */}
        <div
          style={{
            marginTop: 40,
            padding: '16px 48px',
            background: '#D4AF37',
            borderRadius: 12,
            fontSize: 28,
            fontWeight: 'bold',
            color: '#1B4332',
            display: 'flex',
          }}
        >
          Registreer Nu!
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
