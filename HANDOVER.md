# Overdracht Document - Bovenkamer Winterproef

**Datum**: Januari 2026
**Project**: Bovenkamer Winterproef - Nieuwjaars BBQ Platform
**Status**: Basis functioneel, database configuratie nodig

---

## 1. Huidige Status

### ✅ Afgerond
- [x] Landing page met registratie CTA
- [x] 4-stappen registratieformulier
- [x] AI taakomschrijving (Claude API)
- [x] Voorspellingen module
- [x] Persoonlijk dashboard
- [x] Boy Boom beoordeling pagina
- [x] Admin dashboard
- [x] Live Quiz (speler interface)
- [x] Live Quiz (quizmaster interface)
- [x] Alle API routes
- [x] Supabase integratie
- [x] Netlify deployment configuratie

### ⏳ Nog te doen
- [ ] Supabase environment variables in Netlify toevoegen
- [ ] Database tabellen aanmaken (SQL hieronder)
- [ ] RLS policies activeren
- [ ] Quiz vragen toevoegen aan database
- [ ] Testen op productie

---

## 2. Supabase Setup

### Stap 1: Environment Variables in Netlify

Ga naar **Netlify** → **Site configuration** → **Environment variables**

| Variable | Waar te vinden |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → Publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API → Secret key (`sb_secret_...`) |
| `ANTHROPIC_API_KEY` | console.anthropic.com (optioneel) |

> **Let op**: Supabase heeft nieuwe API keys (publishable/secret) die de legacy anon/service_role keys vervangen. De app ondersteunt beide voor backwards compatibility.

### Stap 2: Database Tabellen

Voer dit uit in **Supabase → SQL Editor**:

```sql
-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  birth_year INTEGER,
  has_partner BOOLEAN DEFAULT FALSE,
  partner_name TEXT,
  dietary_requirements TEXT,
  primary_skill TEXT,
  additional_skills TEXT,
  music_decade TEXT,
  music_genre TEXT,
  quiz_answers JSONB DEFAULT '{}',
  ai_assignment JSONB,
  predictions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Ledger
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  hospitality_rating INTEGER CHECK (hospitality_rating BETWEEN 1 AND 5),
  fire_quality_rating INTEGER CHECK (fire_quality_rating BETWEEN 1 AND 5),
  parking_rating INTEGER CHECK (parking_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  best_aspect TEXT,
  improvement_suggestion TEXT,
  is_worthy BOOLEAN,
  worthy_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  category TEXT,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB,
  point_value INTEGER DEFAULT 100,
  time_limit INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Sessions
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'lobby',
  current_question_index INTEGER DEFAULT 0,
  question_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Quiz Players
CREATE TABLE quiz_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Answers
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES quiz_players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  answer TEXT,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Stap 3: RLS Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Allow public access (voor development/klein event)
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON registrations FOR ALL USING (true);
CREATE POLICY "Allow all" ON points_ledger FOR ALL USING (true);
CREATE POLICY "Allow all" ON ratings FOR ALL USING (true);
CREATE POLICY "Allow all" ON quiz_questions FOR ALL USING (true);
CREATE POLICY "Allow all" ON quiz_sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON quiz_players FOR ALL USING (true);
CREATE POLICY "Allow all" ON quiz_answers FOR ALL USING (true);
```

### Stap 4: Voorbeeld Quiz Vragen

```sql
INSERT INTO quiz_questions (type, category, question, correct_answer, options, point_value, time_limit, sort_order) VALUES
('multiple_choice', 'Bovenkamer', 'In welk jaar is de Bovenkamer opgericht?', '2015', '["2013", "2015", "2017", "2019"]', 100, 15, 1),
('multiple_choice', 'Muziek', 'Welke artiest had een hit met "Barbie Girl"?', 'Aqua', '["Vengaboys", "Aqua", "Spice Girls", "Backstreet Boys"]', 100, 15, 2),
('multiple_choice', 'Eten', 'Hoeveel graden is de ideale BBQ temperatuur voor spareribs?', '110-130°C', '["80-100°C", "110-130°C", "150-170°C", "180-200°C"]', 100, 20, 3);
```

---

## 3. Lokaal Ontwikkelen

```bash
# Clone en installeer
git clone [repo-url]
cd Bovenkamer-events
npm install

# Maak .env.local
cp .env.example .env.local
# Vul de Supabase credentials in

# Start development server
npm run dev
```

---

## 4. Belangrijke Bestanden

| Bestand | Functie |
|---------|---------|
| `src/lib/store.ts` | Zustand store met alle state |
| `src/lib/supabase.ts` | Supabase client configuratie |
| `src/types/index.ts` | TypeScript interfaces |
| `src/app/api/assignment/route.ts` | Claude AI integratie |
| `tailwind.config.ts` | Huisstijl kleuren/fonts |

---

## 5. Netlify URLs

- **Site URL**: [nog in te vullen]
- **Netlify Dashboard**: https://app.netlify.com

---

## 6. Contactgegevens

- **Opdrachtgever**: Alwin
- **Event**: 24 januari 2026, 14:00+
- **Locatie**: Bij Boy Boom (adres volgt)
- **Kosten**: €50 p.p.

---

## 7. Bekende Issues / Aandachtspunten

1. **Quiz Realtime**: Gebruikt Supabase Realtime broadcasts. Zorg dat Realtime is ingeschakeld in Supabase dashboard.

2. **AI Fallback**: Als `ANTHROPIC_API_KEY` niet is ingesteld, worden voorgedefinieerde sarcastische toewijzingen gebruikt.

3. **Mobile Testing**: Quiz speler interface is mobile-first ontworpen. Test op echte devices.

4. **LocalStorage**: Als database niet werkt, valt de app terug op localStorage. Data wordt dan niet gedeeld tussen devices.

---

## 8. Na het Event

- [ ] Voorspellingen uitkomsten invullen (admin)
- [ ] Punten automatisch berekenen
- [ ] Boy Boom resultaten bekijken
- [ ] Data exporteren indien nodig

---

*Laatste update: Januari 2026*
