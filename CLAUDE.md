# Bovenkamer Winterproef

Een registratie- en live quiz platform voor de Bovenkamer Winterproef nieuwjaars-BBQ.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structuur

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── register/          # 4-stappen registratie
│   ├── dashboard/         # Persoonlijk dashboard
│   ├── predictions/       # Voorspellingen module
│   ├── rate/              # Boy Boom beoordeling
│   ├── quiz/              # Live quiz (speler)
│   │   └── master/        # Quizmaster interface
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
│       ├── registration/  # POST: registratie opslaan
│       ├── predictions/   # POST: voorspellingen opslaan
│       ├── participants/  # GET: deelnemers ophalen
│       ├── rating/        # POST/GET: beoordelingen
│       └── assignment/    # POST: AI taakomschrijving
├── components/
│   ├── ui/                # Herbruikbare UI componenten
│   └── forms/             # Registratie stappen
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── store.ts           # Zustand state management
└── types/
    └── index.ts           # TypeScript types
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand (met localStorage persistentie)
- **Animaties**: Framer Motion
- **AI**: Anthropic Claude API (voor sarcastische taakomschrijvingen)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...  # Optioneel
```

## Database

Supabase tabellen:
- `users` - Gebruikers
- `registrations` - Registraties met quiz antwoorden en AI toewijzing
- `points_ledger` - Punten tracking
- `ratings` - Boy Boom beoordelingen
- `quiz_questions` - Quiz vragen
- `quiz_sessions` - Quiz sessies
- `quiz_players` - Quiz deelnemers
- `quiz_answers` - Quiz antwoorden

## Huisstijl

Kleuren (in `tailwind.config.ts`):
- `deep-green`: #1B4332 (achtergrond)
- `gold`: #D4AF37 (accent)
- `cream`: #F5F5DC (tekst)
- `dark-wood`: #2C1810 (kaarten)
- `warm-red`: #8B0000 (errors)
- `success-green`: #2D5A27

Fonts:
- Titels: Playfair Display
- Body: Source Sans Pro

## Belangrijke Pagina's

| Route | Beschrijving |
|-------|-------------|
| `/` | Landing page met registratie CTA |
| `/register` | 4-stappen registratie flow |
| `/dashboard` | Persoonlijk dashboard na registratie |
| `/predictions` | Voorspellingen doen |
| `/rate` | Boy Boom beoordelen |
| `/quiz` | Live quiz voor spelers (mobiel) |
| `/quiz/master` | Quizmaster control panel |
| `/admin` | Admin overzicht registraties |

## Deployment

Gehost op Netlify. Push naar `main` triggert automatische deploy.

Build command: `npm run build`
Publish directory: `out`
