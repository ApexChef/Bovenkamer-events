# PACT Analyse - Bovenkamer Winterproef

> **PACT Framework**: Prepare, Architecture, Code, Test
>
> Dit document bevat de technische analyse van alle user stories volgens het PACT framework.

---

## Inhoudsopgave

1. [US-007: Progressieve Registratie](#us-007-progressieve-registratie) ⭐ NIEUW - Hoogste prioriteit
2. [US-001: Skill Categorieën](#us-001-skill-categorieën)
3. [US-002: Uitgebreide Profielvelden](#us-002-uitgebreide-profielvelden)
4. [US-003: Sarcastisch Dashboard](#us-003-sarcastisch-dashboard)
5. [US-005: Burger Stack Mini-Game](#us-005-burger-stack-mini-game)
6. [US-006: Einde-Avond Awards](#us-006-einde-avond-awards)

---

## US-007: Progressieve Registratie

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Lage drempel registratie met puntenbeloning voor complete profielen |
| **Scope** | Registratie flow, punten systeem, herinneringen |
| **Prioriteit** | Hoogste (#1) |
| **Complexiteit** | Medium-Hoog |

#### Functionele Requirements
1. **FR-007.1**: Minimale registratie met alleen naam, e-mail, PIN
2. **FR-007.2**: 6 profiel secties, elk apart invulbaar
3. **FR-007.3**: Punten toekenning per voltooide sectie (totaal 250)
4. **FR-007.4**: Dashboard prompt met compleetheid percentage
5. **FR-007.5**: Gepersonaliseerde "passeer X" berekening
6. **FR-007.6**: In-app notificaties bij incomplete profiel
7. **FR-007.7**: E-mail herinneringen (automatisch + handmatig)
8. **FR-007.8**: Admin dashboard voor reminder beheer
9. **FR-007.9**: Leaderboard integratie met profiel-punten

#### Profiel Secties & Punten
| Sectie | Velden | Punten | Prioriteit |
|--------|--------|--------|------------|
| Persoonlijk | Geboortedatum, geslacht, partner | 50 | Hoog |
| JKV Historie | JKV/Bovenkamer jaren | 30 | Medium |
| Skills | 8 skill categorieën | 40 | Hoog |
| Muziek | Decennium, genre | 20 | Laag |
| Borrel Stats | 2025 geweest, 2026 planning | 30 | Medium |
| Fun Quiz | 15 grappige vragen | 80 | Hoog |
| **Totaal** | | **250** | |

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Minimale registratie flow | Social login (Google, etc.) |
| Sectie-gebaseerde punten | Punten voor andere acties |
| In-app + e-mail reminders | Push notificaties |
| Leaderboard impact berekening | Real-time leaderboard updates |
| Admin reminder beheer | AI-gegenereerde reminder teksten |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| Bestaande auth flow (JWT, PIN) | Intern | Beschikbaar |
| Resend API (e-mail) | Extern | Geconfigureerd |
| Users tabel (punten velden) | Database | Aan te passen |
| Registrations tabel | Database | Aan te passen |
| Zustand stores | State | Aan te passen |

#### Impact op Andere US
| User Story | Impact |
|------------|--------|
| US-001 (Skills) | Wordt onderdeel van profiel secties |
| US-002 (Profielvelden) | Wordt onderdeel van profiel secties |
| US-003 (Dashboard) | Moet wachten op profiel data |
| US-005 (Game) | Grill Guru heeft minder data bij incomplete profielen |
| US-006 (Awards) | Rapporten minder persoonlijk bij incomplete profielen |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Te veel e-mail = spam klachten | Hoog | Medium | Max 6 e-mails, opt-out per type |
| Niemand vult profiel aan | Hoog | Laag | Gamification, sociale druk (leaderboard) |
| Complexe state management | Medium | Medium | Clear sectie boundaries, unit tests |
| Database migratie issues | Medium | Laag | JSONB voor flexibiliteit |

#### Aannames
1. Gebruikers zijn gemotiveerd door punten/competitie
2. 250 punten is significant genoeg vs. game/quiz punten
3. E-mail herinneringen worden gelezen
4. Leaderboard is publiek zichtbaar

#### User Flows

**Flow 1: Snelle Registratie**
```
Landing → Naam/Email/PIN → Verificatie Email → Dashboard (32%)
```

**Flow 2: Direct Compleet**
```
Landing → Naam/Email/PIN → [Optional: Vul alles in] → Dashboard (100%)
```

**Flow 3: Geleidelijk Aanvullen**
```
Dashboard (32%) → Reminder zien → Skills invullen → Dashboard (48%)
                                 ↓
                     E-mail reminder → Fun Quiz invullen → Dashboard (80%)
```

#### E-mail Strategie
| Trigger | Timing | Personalisatie |
|---------|--------|----------------|
| 24h na registratie | Automatisch | Basis (welkom + status) |
| Wekelijks (ma 10:00) | Automatisch | Leaderboard positie, "passeer X" |
| Handmatig (admin) | On-demand | Grill Guru toon |
| Laatste kans | 48h voor event | Urgentie, alle missende secties |
| 100% compleet | Automatisch | Felicitatie + waarschuwing (Grill Guru) |

#### Success Metrics
| Metric | Target | Meting |
|--------|--------|--------|
| Conversie naar 100% compleet | >80% | `profile_percentage = 100` count |
| Gemiddelde tijd tot compleet | <7 dagen | `last_section_completed_at - created_at` |
| E-mail open rate | >50% | `opened_at / sent_at` ratio |
| Click-through rate | >25% | `clicked_at / opened_at` ratio |

### ARCHITECTURE

#### Systeem Overzicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Next.js)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │   Landing    │   │  Dashboard   │   │   Profiel    │                │
│  │   /register  │──►│  /dashboard  │◄──│   Secties    │                │
│  │   (minimal)  │   │  (progress)  │   │  /profile/*  │                │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│         │                  │                  │                         │
│         ▼                  ▼                  ▼                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    Zustand Store                             │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │       │
│  │  │ AuthStore   │  │ProfileStore │  │LeaderStore  │         │       │
│  │  │ user, token │  │ sections,   │  │ rankings,   │         │       │
│  │  │             │  │ points      │  │ myPosition  │         │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /api/registration/quick     POST   → Minimale registratie              │
│  /api/registration/section/* POST   → Sectie opslaan                    │
│  /api/profile/completeness   GET    → Status ophalen                    │
│  /api/profile/next-reward    GET    → Volgende beloning berekenen       │
│  /api/leaderboard            GET    → Rankings ophalen                  │
│  /api/admin/reminders/*      POST   → Reminder beheer                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │  Supabase   │ │   Resend    │ │   Cron      │
            │  Database   │ │   E-mail    │ │   Jobs      │
            └─────────────┘ └─────────────┘ └─────────────┘
```

#### Component Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAGE COMPONENTS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RegisterPage (minimal)        DashboardPage              ProfilePage   │
│  ├── QuickRegisterForm         ├── ProfileProgress        ├── Section   │
│  │   ├── NameInput             │   ├── ProgressBar        │   Router    │
│  │   ├── EmailInput            │   ├── PointsDisplay      │             │
│  │   └── PINInput              │   └── NextReward         │  Sections:  │
│  │                             │                          │  ├─Personal │
│  └── SubmitButton              ├── LeaderboardPreview     │  ├─JKV      │
│                                │   └── RankingCard        │  ├─Skills   │
│                                │                          │  ├─Music    │
│                                └── ReminderPrompt         │  ├─Borrel   │
│                                    └── DismissOptions     │  └─Quiz     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
│                                                                          │
│                         SHARED COMPONENTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ProgressRing │  │ PointsBadge │  │ Leaderboard │  │ SectionCard │   │
│  │ (circular)  │  │ (+40 pts)   │  │ (rankings)  │  │ (status)    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Flow

```
REGISTRATIE FLOW:
─────────────────
User Input → QuickRegisterForm → API /registration/quick
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Validate   │
                                 │  - Email    │
                                 │  - PIN hash │
                                 └─────────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                    Create User   Create Reg    Send Email
                    (users)       (registrations) (Resend)
                          │             │
                          └──────┬──────┘
                                 ▼
                          Return JWT + Redirect


SECTIE INVULLEN FLOW:
─────────────────────
User Input → SectionForm → API /registration/section/[name]
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Validate   │
                                 │  Section    │
                                 │  Fields     │
                                 └─────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Update     │
                                 │  - Data     │
                                 │  - Points   │
                                 │  - Progress │
                                 └─────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Calculate  │
                                 │  Leaderboard│
                                 │  Impact     │
                                 └─────────────┘
                                        │
                                        ▼
                                 Return new state


REMINDER FLOW:
──────────────
Cron Trigger (maandag 10:00)
        │
        ▼
┌─────────────────┐
│ Query users     │
│ where profile   │
│ < 100%          │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Per user:       │
│ - Calc position │
│ - Calc passable │
│ - Build email   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Resend API      │
│ (batch send)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Log reminder    │
│ in DB           │
└─────────────────┘
```

#### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  users                              registrations                        │
│  ┌─────────────────────────┐       ┌─────────────────────────┐         │
│  │ id (PK)                 │       │ id (PK)                 │         │
│  │ email                   │       │ user_id (FK) ──────────┐│         │
│  │ name                    │       │                        ││         │
│  │ pin_hash                │◄──────│ sections_completed     ││         │
│  │ role                    │       │   (JSONB)              ││         │
│  │ email_verified          │       │                        ││         │
│  │ ─────────────────────── │       │ profile_points         ││         │
│  │ registration_points ◄───────────│ profile_percentage     ││         │
│  │ total_points            │       │                        ││         │
│  │ ─────────────────────── │       │ [sectie velden...]     ││         │
│  │ created_at              │       │                        ││         │
│  └─────────────────────────┘       └─────────────────────────┘         │
│           │                                                              │
│           │                        profile_reminders                     │
│           │                        ┌─────────────────────────┐         │
│           └───────────────────────►│ id (PK)                 │         │
│                                    │ user_id (FK)            │         │
│                                    │ reminder_type           │         │
│                                    │ sent_at                 │         │
│                                    │ opened_at               │         │
│                                    │ clicked_at              │         │
│                                    │ personalization_data    │         │
│                                    └─────────────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZUSTAND STORES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ProfileStore (NIEUW)                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ State:                                                           │   │
│  │   sections: {                                                    │   │
│  │     personal: { complete: boolean, data: {...} }                 │   │
│  │     jkvHistory: { complete: boolean, data: {...} }               │   │
│  │     skills: { complete: boolean, data: {...} }                   │   │
│  │     music: { complete: boolean, data: {...} }                    │   │
│  │     borrelStats: { complete: boolean, data: {...} }              │   │
│  │     funQuiz: { complete: boolean, data: {...} }                  │   │
│  │   }                                                              │   │
│  │   totalPoints: number                                            │   │
│  │   percentage: number                                             │   │
│  │   lastUpdated: Date                                              │   │
│  │                                                                  │   │
│  │ Actions:                                                         │   │
│  │   loadProfile()        → Fetch from API                          │   │
│  │   saveSection(name)    → POST to API, update local               │   │
│  │   getNextReward()      → Calculate next best section             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  LeaderboardStore (NIEUW)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ State:                                                           │   │
│  │   rankings: Participant[]                                        │   │
│  │   myPosition: number                                             │   │
│  │   nearbyParticipants: Participant[]  (voor "passeer X")          │   │
│  │                                                                  │   │
│  │ Actions:                                                         │   │
│  │   loadLeaderboard()                                              │   │
│  │   calculateImpact(points) → Wat als ik X punten erbij krijg?     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Integratie Punten

| Systeem | Doel | Integratie |
|---------|------|------------|
| **Supabase** | Data persistence | Direct via `@supabase/supabase-js` |
| **Resend** | E-mail verzending | Server-side API calls |
| **Vercel Cron** | Scheduled reminders | `/api/cron/reminders` endpoint |
| **JWT** | Authenticatie | Bestaande auth flow hergebruiken |

#### Security Overwegingen

| Aspect | Aanpak |
|--------|--------|
| **Rate Limiting** | Max 3 registraties per IP per uur |
| **PIN Storage** | bcrypt hash, nooit plaintext |
| **API Auth** | JWT verificatie op alle `/api/profile/*` |
| **Admin Routes** | Role check op `/api/admin/*` |
| **E-mail Tracking** | Unieke tokens per reminder, geen PII in URL |

---

## US-001: Skill Categorieën

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Uitbreiding van skill selectie van 1 veld naar 8 categorieën |
| **Scope** | Registratieformulier stap 2, database, types |
| **Prioriteit** | Hoog (#1 in volgorde) |
| **Complexiteit** | Laag-Medium |

#### Functionele Requirements
1. **FR-001.1**: 8 skill categorieën tonen in registratie stap 2
2. **FR-001.2**: Per categorie exact 1 skill selecteerbaar
3. **FR-001.3**: Elke categorie bevat "Niks" optie
4. **FR-001.4**: Bestaand `additionalSkills` vrij tekstveld behouden
5. **FR-001.5**: Selecties opslaan in database

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| 8 categorieën met opties | Skill matching algoritme |
| Formulier UI updates | Admin skill management |
| Database schema wijzigingen | Skill statistieken dashboard |
| Type definities | Skill-gebaseerde notificaties |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| Bestaande registratie flow | Intern | Beschikbaar |
| `Step2Skills.tsx` component | Intern | Aan te passen |
| Supabase `registrations` tabel | Database | Aan te passen |
| `types/index.ts` | Types | Aan te passen |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Breaking change bestaande registraties | Hoog | Laag | App nog niet live |
| UI te druk met 8 categorieën | Medium | Medium | Accordion/collapsible design |
| Performance bij veel opties | Laag | Laag | Static data, geen API calls |

#### Aannames
1. App is nog niet live, geen migratie nodig
2. Alle 8 categorieën zijn verplicht (maar "Niks" is valide keuze)
3. Skill labels zijn definitief (geen i18n nodig)

#### Data Mapping (Oud → Nieuw)
```
Oud:
- primarySkill: string
- additionalSkills: string (vrij tekst)

Nieuw:
- skills: {
    food_prep: string,
    bbq_grill: string,
    drinks: string,
    entertainment: string,
    atmosphere: string,
    social: string,
    cleanup: string,
    documentation: string
  }
- additionalSkills: string (behouden)
```

### ARCHITECTURE

#### Component Structuur

```
Skills Sectie (onderdeel van ProfilePage)
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  SkillsSection                                               │
│  ├── SectionHeader ("Skills - 40 punten")                   │
│  │                                                          │
│  ├── SkillCategoryGrid                                      │
│  │   ├── SkillCategory (food_prep)                         │
│  │   │   ├── CategoryIcon + Label                          │
│  │   │   └── SkillSelect (dropdown met 5 opties)           │
│  │   │                                                      │
│  │   ├── SkillCategory (bbq_grill)                         │
│  │   ├── SkillCategory (drinks)                            │
│  │   ├── SkillCategory (entertainment)                     │
│  │   ├── SkillCategory (atmosphere)                        │
│  │   ├── SkillCategory (social)                            │
│  │   ├── SkillCategory (cleanup)                           │
│  │   └── SkillCategory (documentation)                     │
│  │                                                          │
│  ├── AdditionalSkillsTextarea                              │
│  │                                                          │
│  └── SaveButton (disabled tot alle 8 geselecteerd)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Data Model

```
┌─────────────────────────────────────────────────────────────┐
│  SKILL CATEGORIES (Static Config)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                           │
│    food_prep: {                                              │
│      label: "Eten bereiden",                                 │
│      icon: "🍳",                                             │
│      options: ["Koken", "Salades", "Snijden",               │
│                "Marineren", "Niks"]                          │
│    },                                                        │
│    bbq_grill: { ... },                                       │
│    drinks: { ... },                                          │
│    ...                                                       │
│  }                                                           │
│                                                              │
│  → Hardcoded in constants file                              │
│  → Geen database lookup nodig                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### UI Pattern: Accordion of Grid?

| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| **Grid (2x4)** | Alles zichtbaar, snel invullen | Veel scroll op mobiel |
| **Accordion** | Compact, focus per categorie | Meer clicks nodig |
| **Hybrid** | Grid op desktop, accordion mobiel | Complexere implementatie |

**Beslissing**: Grid (2x4) met responsive collapse naar 1 kolom op mobiel.

---

## US-002: Uitgebreide Profielvelden

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Extra profielvelden voor betere analyses en rapportage |
| **Scope** | Registratieformulier, database, types |
| **Prioriteit** | Hoog (#2 in volgorde) |
| **Complexiteit** | Medium |

#### Functionele Requirements
1. **FR-002.1**: `birthDate` veld met datum picker (soft 40+ validatie)
2. **FR-002.2**: `gender` select (Man/Vrouw/Anders/Zeg ik niet)
3. **FR-002.3**: `selfConfidence` slider (1-10)
4. **FR-002.4**: `jkvJoinYear` select (1990-2025)
5. **FR-002.5**: `jkvExitYear` select (2000-2030 of "Nog actief")
6. **FR-002.6**: `bovenkamerJoinYear` (berekend/bevestigd)
7. **FR-002.7**: `borrelAttendance2025` multi-select (10 datums)
8. **FR-002.8**: `borrelPlanning2026` multi-select (10 datums)
9. **FR-002.9**: Validatie `jkvExitYear >= jkvJoinYear`

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Alle nieuwe velden in formulier | Automatische borrel tracking |
| Database schema uitbreiding | JKV API integratie |
| Validaties (soft en hard) | Historische data import |
| Borrel datums 2025 & 2026 | Borrel planning 2027+ |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 (skill categorieën) | User Story | Eerst implementeren |
| `Step1Personal.tsx` component | Intern | Aan te passen |
| Mogelijk nieuwe stap component | Intern | Te maken |
| Zustand registration store | State | Aan te passen |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Formulier te lang | Medium | Hoog | Split in substappen of accordion |
| Gevoelige data (geboortedatum) | Medium | Medium | Privacy notice toevoegen |
| Borrel datums incorrect | Laag | Laag | Hardcoded static data |
| JKV/Bovenkamer verwarrend | Medium | Medium | Duidelijke uitleg/tooltips |

#### Aannames
1. Borrel datums zijn elke 4e donderdag (behalve juli/december)
2. Bovenkamer = JKV alumni (40+)
3. "Nog actief in JKV" = nog geen Bovenkamer lid
4. Soft validatie = waarschuwing, niet blokkerend

#### Borrel Data (Hardcoded)
```typescript
const BORRELS_2025 = [
  { date: '2025-01-23', label: '23 januari 2025' },
  { date: '2025-02-27', label: '27 februari 2025' },
  { date: '2025-03-27', label: '27 maart 2025' },
  { date: '2025-04-24', label: '24 april 2025' },
  { date: '2025-05-22', label: '22 mei 2025' },
  { date: '2025-06-26', label: '26 juni 2025' },
  // juli vervalt
  { date: '2025-08-28', label: '28 augustus 2025' },
  { date: '2025-09-25', label: '25 september 2025' },
  { date: '2025-10-23', label: '23 oktober 2025' },
  { date: '2025-11-27', label: '27 november 2025' },
  // december vervalt
];

const BORRELS_2026 = [
  { date: '2026-01-22', label: '22 januari 2026' },
  { date: '2026-02-26', label: '26 februari 2026' },
  { date: '2026-03-26', label: '26 maart 2026' },
  { date: '2026-04-23', label: '23 april 2026', note: 'Meivakantie' },
  { date: '2026-05-28', label: '28 mei 2026' },
  { date: '2026-06-25', label: '25 juni 2026' },
  // juli vervalt
  { date: '2026-08-27', label: '27 augustus 2026' },
  { date: '2026-09-24', label: '24 september 2026' },
  { date: '2026-10-22', label: '22 oktober 2026', note: 'Herfstvakantie' },
  { date: '2026-11-26', label: '26 november 2026' },
  // december vervalt
];
```

### ARCHITECTURE

#### Profiel Secties Overzicht

US-002 velden worden verdeeld over meerdere profiel secties (zie US-007):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROFIEL SECTIES MAPPING                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Sectie "Personal" (50 pts)       Sectie "JKV Historie" (30 pts)        │
│  ┌─────────────────────────┐     ┌─────────────────────────┐           │
│  │ • birthDate             │     │ • jkvJoinYear           │           │
│  │ • gender                │     │ • jkvExitYear           │           │
│  │ • hasPartner            │     │ • bovenkamerJoinYear    │           │
│  │ • partnerName           │     │   (berekend)            │           │
│  │ • selfConfidence        │     │                         │           │
│  └─────────────────────────┘     └─────────────────────────┘           │
│                                                                          │
│  Sectie "Borrel Stats" (30 pts)                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ • borrelAttendance2025 (multi-select, 10 datums)            │       │
│  │ • borrelPlanning2026 (multi-select, 10 datums)              │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Validatie Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      VALIDATIE REGELS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  birthDate                                                               │
│  ├── Format: YYYY-MM-DD                                                 │
│  ├── Hard: Niet in toekomst                                             │
│  └── Soft: Leeftijd < 40 → Waarschuwing (niet blokkerend)              │
│                                                                          │
│  JKV Jaren                                                               │
│  ├── jkvExitYear >= jkvJoinYear (hard)                                  │
│  ├── jkvExitYear = "Nog actief" → bovenkamerJoinYear = null            │
│  └── jkvExitYear != "Nog actief" → bovenkamerJoinYear = jkvExitYear    │
│                                                                          │
│  Borrel Selectie                                                        │
│  ├── 2025: Alleen datums in verleden selecteerbaar                     │
│  └── 2026: Alle datums selecteerbaar                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Interactie

```
PersonalSection                    JKVSection
     │                                  │
     ▼                                  ▼
┌─────────────┐                   ┌─────────────┐
│ DatePicker  │                   │ YearSelect  │──┐
│ (birthDate) │                   │ (joinYear)  │  │
└─────────────┘                   └─────────────┘  │
                                        │          │
                                        ▼          │ Auto-calculate
                                  ┌─────────────┐  │
                                  │ YearSelect  │  │
                                  │ (exitYear)  │──┤
                                  └─────────────┘  │
                                        │          │
                                        ▼          ▼
                                  ┌─────────────────────┐
                                  │ bovenkamerJoinYear  │
                                  │ (readonly/derived)  │
                                  └─────────────────────┘
```

---

## US-003: Sarcastisch Dashboard

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Humoristisch groepsdashboard met LLM-gegenereerde analyses |
| **Scope** | Nieuwe pagina, LLM integratie, data aggregatie |
| **Prioriteit** | Medium (#4 in volgorde) |
| **Complexiteit** | Hoog |

#### Functionele Requirements
1. **FR-003.1**: Dashboard pagina voor ingelogde gebruikers
2. **FR-003.2**: Groepsprofiel samenvatting (LLM)
3. **FR-003.3**: Skill scores per categorie met visualisatie
4. **FR-003.4**: Segment analyses (geslacht, leeftijd, JKV)
5. **FR-003.5**: Superlatieven & Awards
6. **FR-003.6**: Borrel statistieken
7. **FR-003.7**: Voorspellingen voor event (LLM)
8. **FR-003.8**: Admin kan analyses handmatig refreshen
9. **FR-003.9**: Caching van LLM analyses

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| 6 dashboard secties | Realtime updates |
| LLM integratie (Claude API) | Meerdere talen |
| Responsive design | Export naar PDF |
| Admin refresh | Automatische notificaties |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 (skills) | User Story | Vereist |
| US-002 (profielvelden) | User Story | Vereist |
| Anthropic Claude API | Extern | Geconfigureerd |
| Alle registraties compleet | Data | Runtime |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| LLM kosten te hoog | Medium | Medium | Caching, rate limiting |
| Ongepaste LLM output | Hoog | Laag | Prompt engineering, review |
| Performance bij veel data | Medium | Laag | Aggregatie queries, caching |
| Lege data bij weinig registraties | Medium | Medium | Minimum threshold voor analyses |

#### Aannames
1. Minimaal 5 registraties nodig voor zinvolle analyses
2. LLM analyses worden ~1x per dag gegenereerd (of on-demand)
3. Claude API is beschikbaar en geconfigureerd
4. Sarcastische toon is acceptabel voor doelgroep

#### LLM Prompt Strategie
```typescript
interface DashboardPromptContext {
  totalParticipants: number;
  aggregatedStats: {
    genderDistribution: Record<string, number>;
    ageStats: { min: number; max: number; avg: number };
    jkvYearsStats: { min: number; max: number; avg: number };
    skillCoverage: Record<string, number>;
    borrelStats: { attended: number; planned: number }[];
  };
  tone: 'sarcastisch maar respectvol';
  language: 'Nederlands';
  maxLength: number;
}
```

### ARCHITECTURE

#### Systeem Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SARCASTISCH DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        /dashboard/analytics                      │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ Groeps-     │  │ Skill       │  │ Segment     │             │   │
│  │  │ profiel     │  │ Scores      │  │ Analyses    │             │   │
│  │  │ (LLM)       │  │ (Data)      │  │ (LLM)       │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ Super-      │  │ Borrel      │  │ Voorspel-   │             │   │
│  │  │ latieven    │  │ Stats       │  │ lingen      │             │   │
│  │  │ (LLM)       │  │ (Data)      │  │ (LLM)       │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                      │                                   │
└──────────────────────────────────────┼───────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CACHE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  dashboard_cache                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  section_key    │  content (JSON)    │  generated_at  │  ttl    │   │
│  │  ───────────────┼────────────────────┼────────────────┼─────────│   │
│  │  group_profile  │  {...}             │  2024-01-18    │  24h    │   │
│  │  skill_scores   │  {...}             │  2024-01-18    │  1h     │   │
│  │  superlatives   │  {...}             │  2024-01-18    │  24h    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
            │  Supabase   │    │  Claude API │    │  Aggregatie │
            │  (raw data) │    │  (LLM gen)  │    │  Queries    │
            └─────────────┘    └─────────────┘    └─────────────┘
```

#### Data Aggregatie Strategie

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGGREGATIE PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. RAW DATA (Supabase)                                                 │
│     └── SELECT * FROM registrations WHERE is_complete = true            │
│                                                                          │
│  2. TRANSFORM (Server-side)                                             │
│     ├── Groepeer per skill categorie                                    │
│     ├── Bereken leeftijdsverdeling                                      │
│     ├── Tel borrel aanwezigheid                                         │
│     └── Genereer segment buckets                                        │
│                                                                          │
│  3. CACHE (dashboard_cache)                                             │
│     └── Store aggregated JSON met TTL                                   │
│                                                                          │
│  4. LLM ENRICHMENT (Claude API)                                         │
│     ├── Input: Aggregated stats                                         │
│     ├── Prompt: Sarcastische analyse                                    │
│     └── Output: Generated text per sectie                               │
│                                                                          │
│  5. RENDER (Client)                                                     │
│     └── Combineer cached data + LLM output                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Cache Invalidatie

| Trigger | Actie |
|---------|-------|
| Nieuwe registratie | Invalidate `skill_scores`, `borrel_stats` |
| Admin refresh knop | Invalidate ALL + regenerate LLM |
| TTL expired | Lazy regenerate on next request |
| Dagelijks (cron) | Pre-generate alle LLM content |

#### LLM Service Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       LLM SERVICE (Shared)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Gebruikt door: US-003, US-005 (Grill Guru), US-006 (Awards)            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  LLMService                                                      │   │
│  │  ├── generateDashboardSection(sectionType, data)                │   │
│  │  ├── generateGrillGuruComment(context, config)                  │   │
│  │  ├── generatePersonalReport(userData, groupData)                │   │
│  │  │                                                               │   │
│  │  └── Config:                                                     │   │
│  │      ├── model: "claude-3-sonnet"                               │   │
│  │      ├── maxTokens: varies per use case                         │   │
│  │      ├── temperature: 0.7 (creatief maar consistent)            │   │
│  │      └── systemPrompt: per feature configureerbaar              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## US-005: Burger Stack Mini-Game

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Verslavend stapelspel voor pre-event engagement |
| **Scope** | Nieuwe game module, leaderboard, LLM persona |
| **Prioriteit** | Hoog (#3 in volgorde) |
| **Complexiteit** | Zeer Hoog |

#### Functionele Requirements

##### MVP (Fase 1)
1. **FR-005.1**: Basis gameplay (tap to drop, stacking)
2. **FR-005.2**: Score systeem met punten per ingrediënt
3. **FR-005.3**: Mobile-first responsive design
4. **FR-005.4**: Highscore opslaan in database
5. **FR-005.5**: Simpel leaderboard
6. **FR-005.6**: Auth integratie (alleen ingelogde users)

##### Uitbreiding (Fase 2)
7. **FR-005.7**: Speciale items (Gouden Biefstuk, Slow-mo, etc.)
8. **FR-005.8**: Combo systeem met visuele feedback
9. **FR-005.9**: Grill Guru commentaar (LLM)
10. **FR-005.10**: Thema's unlockbaar
11. **FR-005.11**: Persoonlijke statistieken

##### Multiplayer (Fase 2+)
12. **FR-005.12**: Async Challenge Mode
13. **FR-005.13**: Challenge notificaties
14. **FR-005.14**: Duel resultaten met Grill Guru roasts

##### Event Features (Fase 3)
15. **FR-005.15**: LLM Roast Generator voor live event
16. **FR-005.16**: Admin panel voor roast selectie
17. **FR-005.17**: Projectie-modus
18. **FR-005.18**: Schaduw Roasts voor niet-spelers

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Canvas/Phaser.js game | 3D graphics |
| Mobile touch + desktop click | VR/AR |
| Async multiplayer | Real-time multiplayer |
| LLM roasts (tekst) | Voice/audio roasts |
| Pre-event gameplay | During-event gameplay |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 & US-002 | User Story | Voor Grill Guru context |
| Canvas API of Phaser.js | Library | Te kiezen |
| Anthropic Claude API | Extern | Geconfigureerd |
| Zustand | State | Beschikbaar |
| Supabase | Database | Beschikbaar |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Game engine leercurve | Medium | Medium | Canvas API (simpeler) als fallback |
| Performance op oude telefoons | Hoog | Medium | Progressive enhancement, FPS capping |
| LLM kosten bij veel games | Medium | Hoog | Rate limiting, caching, batching |
| Verslaving/overuse | Laag | Laag | Geen real-money, just fun |
| Game balancing | Medium | Hoog | Iteratief testen, analytics |

#### Aannames
1. Mobile-first, portrait mode primair
2. Geen geluid in MVP (optioneel later)
3. Grill Guru kent alle deelnemers (via profiel data)
4. Pre-event only, niet tijdens event
5. Geen expiratie op challenges

#### Technische Keuzes
| Keuze | Optie A | Optie B | Aanbeveling |
|-------|---------|---------|-------------|
| Game Engine | Canvas API | Phaser.js | Canvas API (MVP), Phaser (later) |
| State | Zustand | React state | Zustand (consistency) |
| Animaties | requestAnimationFrame | CSS Animations | requestAnimationFrame |
| LLM calls | Client-side | Server-side | Server-side (API key security) |

#### Database Schema (Nieuw)
```sql
-- game_scores: Alle spelresultaten
-- game_challenges: Async duels
-- grill_guru_logs: LLM output logging
-- grill_guru_config: Admin configuratie
```

### ARCHITECTURE

#### Game Engine Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BURGER STACK GAME ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         GAME LOOP                                │   │
│  │                                                                  │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │   │
│  │  │ INPUT   │───►│ UPDATE  │───►│ RENDER  │───►│ SCORE   │     │   │
│  │  │ (touch/ │    │ (physics│    │ (canvas │    │ (points │     │   │
│  │  │  click) │    │  state) │    │  draw)  │    │  combo) │     │   │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘     │   │
│  │       ▲                                             │          │   │
│  │       └─────────────────────────────────────────────┘          │   │
│  │                      requestAnimationFrame                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       GAME STATE                                 │   │
│  │                                                                  │   │
│  │  {                                                               │   │
│  │    status: 'idle' | 'playing' | 'paused' | 'gameover'          │   │
│  │    stack: Ingredient[]                                          │   │
│  │    currentIngredient: { x, width, speed }                       │   │
│  │    score: number                                                │   │
│  │    combo: number                                                │   │
│  │    lives: number                                                │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Hiërarchie

```
/game (route)
├── GamePage
│   ├── GameCanvas (main game)
│   │   ├── IngredientRenderer
│   │   ├── StackRenderer
│   │   └── ScoreOverlay
│   │
│   ├── GameControls
│   │   ├── TapArea (invisible, full screen)
│   │   └── PauseButton
│   │
│   ├── GameOverModal
│   │   ├── ScoreSummary
│   │   ├── GrillGuruComment (LLM)
│   │   └── ActionButtons [Retry, Leaderboard, Challenge]
│   │
│   └── Leaderboard (sidebar/modal)
│       ├── RankingList
│       └── PersonalStats

/game/challenge/[id] (route)
├── ChallengePage
│   ├── ChallengeHeader (vs opponent)
│   ├── GameCanvas (same as above)
│   └── ChallengeResult
```

#### Grill Guru Integratie

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GRILL GURU COMMENT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Game Event ──────────────────────────────────────────────────────────► │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Determine Trigger Type                                          │   │
│  │  ├── game_start                                                  │   │
│  │  ├── game_over (score < 1000)                                   │   │
│  │  ├── game_over (score > 5000)                                   │   │
│  │  ├── new_highscore                                               │   │
│  │  ├── achievement_unlock                                          │   │
│  │  └── challenge_result                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Build Context                                                    │   │
│  │  {                                                                │   │
│  │    player: { name, profile, stats }                              │   │
│  │    game: { score, combo, duration }                              │   │
│  │    group: { rankings, averages }                                 │   │
│  │    config: guruConfig (admin settings)                          │   │
│  │  }                                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  API: /api/game/roast                                            │   │
│  │  └── LLMService.generateGrillGuruComment(context, config)       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Log to grill_guru_logs                                          │   │
│  │  Return comment + display in GameOverModal                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Challenge (Multiplayer) Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ASYNC CHALLENGE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CHALLENGER                           CHALLENGED                         │
│  ─────────────                        ───────────                        │
│                                                                          │
│  1. Play game                                                            │
│     └── Score: 8450                                                      │
│                                                                          │
│  2. Create challenge ─────────────────────────────────────────────────► │
│     POST /api/game/challenges                                            │
│     { challenged_id, score_id }                                          │
│                                                                          │
│                                       3. Receive notification            │
│                                          (in-app / email)                │
│                                                                          │
│                                       4. Accept & Play                   │
│                                          └── Score: 9120                 │
│                                                                          │
│                                       5. Submit score ◄──────────────── │
│                                          PATCH /api/game/challenges/[id] │
│                                                                          │
│  6. Both see result ◄─────────────────────────────────────────────────► │
│     Winner determined                 Winner determined                  │
│     Grill Guru roast                  Grill Guru roast                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Database: game_challenges
┌──────────────────────────────────────────────────────────────────┐
│ id │ challenger │ challenged │ status    │ winner │ guru_comment │
│────┼────────────┼────────────┼───────────┼────────┼──────────────│
│ 1  │ user_a     │ user_b     │ completed │ user_b │ "..."        │
└──────────────────────────────────────────────────────────────────┘
```

---

## US-006: Einde-Avond Awards

### PREPARE

#### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Persoonlijke LLM-rapporten aan einde van event |
| **Scope** | Awards systeem, live dashboard, privacy controls |
| **Prioriteit** | Medium (#5 in volgorde) |
| **Complexiteit** | Zeer Hoog |

#### Functionele Requirements

##### MVP (Fase 1)
1. **FR-006.1**: Admin kan "Awards Modus" activeren
2. **FR-006.2**: LLM genereert rapport per deelnemer
3. **FR-006.3**: Elk persoon ziet eigen rapport op telefoon
4. **FR-006.4**: 5-8 basis award categorieën
5. **FR-006.5**: Keuze: privé houden of delen

##### Uitbreiding (Fase 2)
6. **FR-006.6**: Live dashboard met queue systeem
7. **FR-006.7**: Emoji reactions op gedeelde rapporten
8. **FR-006.8**: Projectie-modus voor groot scherm
9. **FR-006.9**: Real-time notificaties

##### Scherpte Feature
10. **FR-006.10**: Scherpte slider (0-100%, stappen van 5)
11. **FR-006.11**: Max 3 regeneraties per gebruiker
12. **FR-006.12**: Regeneratie-gedrag wordt roast materiaal

##### Admin Features
13. **FR-006.13**: Voorspellingen status tracker
14. **FR-006.14**: Reminder systeem voor incomplete voorspellingen
15. **FR-006.15**: Pre-generatie van rapporten

#### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Persoonlijke rapporten | Event check-in/out tracking |
| Live sharing dashboard | Real-time locatie tracking |
| Emoji reactions | Comments/replies |
| Scherpte aanpassing | Audio/video rapporten |
| Pre-event voorspelling tracking | Post-event survey |

#### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001, US-002 | User Story | Voor profiel data |
| US-003 | User Story | Deelt LLM logica |
| US-005 | User Story | Voor game stats in rapport |
| Voorspellingen module | Feature | Bestaand |
| Quiz module | Feature | Bestaand |
| Anthropic Claude API | Extern | Geconfigureerd |

#### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| LLM kosten (15 rapporten) | Medium | Hoog | Pre-generatie, caching |
| Rapport te persoonlijk/offensief | Hoog | Medium | Scherpte slider, admin review |
| WiFi/netwerk issues tijdens event | Hoog | Medium | Pre-generatie, offline caching |
| Niemand wil delen | Medium | Laag | Social proof, gamification |
| Technische problemen live | Hoog | Medium | Fallback: toon statische content |

#### Aannames
1. Event tracking niet nodig (registratie = aanwezig)
2. Admin kiest handmatig wanneer awards activeren
3. Scherpte regeneratie max 3x per persoon
4. Rapporten worden vooraf gegenereerd (~2 min voor alle)
5. WiFi beschikbaar op locatie

#### Award Categorieën Mapping
```typescript
const AWARD_CATEGORIES = {
  // Klassiek (handmatig/self-report)
  classic: ['bezem', 'vroege_vogel', 'karaoke_koning', 'grill_sergeant'],

  // Data-gedreven (automatisch)
  datadriven: ['burger_baas', 'waarzegger', 'quizmaster', 'overschatter', 'veteraan', 'rookie'],

  // Borrel-gerelateerd
  borrel: ['trouwe', 'optimist', 'geest'],

  // LLM-bepaald (combinatie)
  llm: ['dubbelganger', 'allrounder', 'entertainer', 'mysterie']
};
```

#### Data Inputs voor Rapport
```typescript
interface ReportInputs {
  // Van US-001
  skills: SkillSelection[];

  // Van US-002
  profile: {
    birthDate: Date;
    gender: string;
    selfConfidence: number;
    jkvHistory: JkvData;
    borrelStats: BorrelStats;
  };

  // Van bestaande modules
  quizAnswers: QuizAnswers;  // Registratie quiz
  predictions: Predictions;   // Event voorspellingen
  quizResults?: QuizResult;   // Live quiz score

  // Van US-005
  gameStats?: GameStats;      // Burger Stack data

  // Groep context
  allParticipants: Participant[];
  groupAverages: GroupStats;
}
```

### ARCHITECTURE

#### Awards Systeem Overzicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AWARDS SYSTEEM ARCHITECTUUR                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FASE 1: PRE-GENERATIE (vóór event)                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Admin klikt "Genereer Rapporten"                               │   │
│  │            │                                                     │   │
│  │            ▼                                                     │   │
│  │  ┌─────────────────┐                                            │   │
│  │  │ Voor elke user: │                                            │   │
│  │  │ 1. Verzamel data│───────────────────────────────────────────►│   │
│  │  │ 2. Bepaal awards│    personal_reports                        │   │
│  │  │ 3. LLM genereer │    ┌──────────────────────────────────┐   │   │
│  │  │ 4. Store result │───►│ user_id, report_data, awards,    │   │   │
│  │  └─────────────────┘    │ generated_content, is_shared=F   │   │   │
│  │                          └──────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  FASE 2: ACTIVATIE (tijdens event)                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Admin klikt "Activeer Awards"                                   │   │
│  │            │                                                     │   │
│  │            ▼                                                     │   │
│  │  Push notification naar alle deelnemers                         │   │
│  │  "🏆 Je persoonlijke rapport is klaar!"                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  FASE 3: VIEWING & SHARING                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  User opent rapport ──► [Lees] ──► [Privé] of [Deel]            │   │
│  │                             │                                    │   │
│  │                             ▼                                    │   │
│  │                     [Scherpte Aanpassen?]                        │   │
│  │                      │              │                            │   │
│  │                      ▼              ▼                            │   │
│  │                 [Regenereer]    [OK, Deel]                       │   │
│  │                  (max 3x)           │                            │   │
│  │                                     ▼                            │   │
│  │                              Live Dashboard                      │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Live Dashboard Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LIVE DASHBOARD (Projectie)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        QUEUE SYSTEEM                               │ │
│  │                                                                    │ │
│  │  Shared Reports Queue (FIFO)                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ [Marie 🔔] → [Piet] → [Klaas] → [Jan] → ...                 │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │       ▲                                                           │ │
│  │       │ Nieuwe share komt binnen                                  │ │
│  │       │ via WebSocket / Polling                                   │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      DISPLAY COMPONENT                             │ │
│  │                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🆕 MARIE'S RAPPORT                                          │ │ │
│  │  │                                                              │ │ │
│  │  │ 🏆 DE WAARZEGGER - 6/8 voorspellingen correct!              │ │ │
│  │  │                                                              │ │ │
│  │  │ Scherpte: ██████████ 100% 🔥                                │ │ │
│  │  │                                                              │ │ │
│  │  │ "Marie voorspelde correct dat Klaas het laatst zou         │ │ │
│  │  │  vertrekken. Met haar zelfvertrouwen van 9/10 was dat      │ │ │
│  │  │  misschien gewoon projectie..."                             │ │ │
│  │  │                                                              │ │ │
│  │  │                         [👍 12] [😂 28] [🔥 8]              │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                    │ │
│  │  Admin Controls: [⏭️ Volgende] [⏸️ Pauzeer] [🔊 Geluid]          │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Scherpte Regeneratie Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCHERPTE AANPASSING                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User ziet rapport (default: 60%)                                       │
│            │                                                             │
│            ▼                                                             │
│  ┌─────────────────────────────────────┐                                │
│  │  "Te scherp? Te mild?"              │                                │
│  │                                      │                                │
│  │  😇 ─────────●───────── 😈          │                                │
│  │  0%        60%        100%          │                                │
│  │                                      │                                │
│  │  [🔄 Regenereer] (2 over)           │                                │
│  └─────────────────────────────────────┘                                │
│            │                                                             │
│            ▼                                                             │
│  POST /api/awards/regenerate                                            │
│  { intensity: 40, direction: 'milder' }                                 │
│            │                                                             │
│            ▼                                                             │
│  ┌─────────────────────────────────────┐                                │
│  │  Update intensity_history:          │                                │
│  │  [                                   │                                │
│  │    { intensity: 60, initial: true }, │                                │
│  │    { intensity: 40, dir: 'milder' }  │                                │
│  │  ]                                   │                                │
│  │                                      │                                │
│  │  regeneration_count++                │                                │
│  │  (wordt roast materiaal!)            │                                │
│  └─────────────────────────────────────┘                                │
│            │                                                             │
│            ▼                                                             │
│  LLMService.generatePersonalReport(data, { intensity: 40 })             │
│            │                                                             │
│            ▼                                                             │
│  Return new report content                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Real-time Updates

| Technologie | Gebruik | Alternatief |
|-------------|---------|-------------|
| **Supabase Realtime** | Live dashboard updates | Polling (5s interval) |
| **Polling** | Fallback, simpeler | - |

```
Real-time Channel: "awards"
├── Event: "report_shared"     → Nieuwe kaart in queue
├── Event: "reaction_added"    → Update reaction counts
└── Event: "admin_control"     → Skip, pause, etc.
```

#### Offline Fallback

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE / NETWERK FALLBACK                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Scenario: WiFi uitval tijdens event                                    │
│                                                                          │
│  1. Rapporten zijn PRE-GEGENEREERD                                      │
│     └── localStorage cache van eigen rapport                            │
│                                                                          │
│  2. Dashboard fallback                                                  │
│     └── Admin heeft PDF/screenshot export van alle rapporten            │
│                                                                          │
│  3. Sharing fallback                                                    │
│     └── Handmatig voorlezen, fysieke kaarten                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Cross-Cutting Concerns

### Gedeelde Componenten

| Component | Gebruikt door | Status |
|-----------|---------------|--------|
| E-mail Service | US-007, US-006 | Bestaand (Resend) |
| LLM Service | US-003, US-005, US-006, US-007 | Te maken |
| Grill Guru Persona | US-005, US-006, US-007 | Te maken |
| Admin Config Panel | US-005, US-006, US-007 | Te maken |
| Real-time Updates | US-005 (challenges), US-006 (dashboard) | Te maken |
| Punten Systeem | US-007, US-005, US-006 | Bestaand (uitbreiden) |
| Leaderboard Component | US-007, US-005 | Te maken |

### Database Migraties

| User Story | Nieuwe Tabellen | Wijzigingen Bestaand |
|------------|-----------------|----------------------|
| US-007 | `profile_reminders` | `registrations` + sections_completed, profile_points, profile_percentage |
| US-001 | - | `registrations.skills` (JSONB) |
| US-002 | - | `registrations` + 8 kolommen |
| US-003 | `dashboard_cache` | - |
| US-005 | `game_scores`, `game_challenges`, `grill_guru_logs`, `grill_guru_config` | `users.game_points` |
| US-006 | `personal_reports`, `report_reactions` | - |

### API Endpoints Overzicht

| Endpoint | Method | User Story | Auth |
|----------|--------|------------|------|
| `/api/registration/quick` | POST | US-007 | Public |
| `/api/registration/section/[section]` | POST | US-007 | User |
| `/api/profile/completeness` | GET | US-007 | User |
| `/api/profile/next-reward` | GET | US-007 | User |
| `/api/admin/reminders/send` | POST | US-007 | Admin |
| `/api/admin/reminders/stats` | GET | US-007 | Admin |
| `/api/registration` | POST | US-001, US-002 | User |
| `/api/dashboard/analytics` | GET | US-003 | User |
| `/api/dashboard/refresh` | POST | US-003 | Admin |
| `/api/game/scores` | GET/POST | US-005 | User |
| `/api/game/challenges` | GET/POST | US-005 | User |
| `/api/game/roast` | GET | US-005 | User |
| `/api/admin/grill-guru` | GET/POST | US-005 | Admin |
| `/api/awards/activate` | POST | US-006 | Admin |
| `/api/awards/reports` | GET | US-006 | User |
| `/api/awards/share` | POST | US-006 | User |
| `/api/awards/regenerate` | POST | US-006 | User |
| `/api/awards/reactions` | POST | US-006 | User |
| `/api/predictions/status` | GET | US-006 | Admin |
| `/api/predictions/reminder` | POST | US-006 | Admin |

---

## Implementatie Volgorde

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATIE ROADMAP                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FASE 0: Registratie Refactor (NIEUW - HOOGSTE PRIORITEIT)  │
│  └── US-007: Progressieve Registratie                       │
│      ├── Minimale registratie flow (naam, email, PIN)       │
│      ├── Sectie-gebaseerde profiel invulling                │
│      ├── Punten systeem per sectie                          │
│      ├── Dashboard compleetheid indicator                   │
│      └── E-mail reminder systeem                            │
│                                                              │
│  FASE 1: Profiel Secties                                    │
│  ├── US-001: Skill Categorieën (als profiel sectie)         │
│  └── US-002: Uitgebreide Profielvelden (als profiel secties)│
│                                                              │
│  FASE 2: Game                                                │
│  └── US-005 MVP: Burger Stack Basis                         │
│      ├── Game engine setup                                  │
│      ├── Scoring systeem                                    │
│      └── Leaderboard (hergebruik van US-007)                │
│                                                              │
│  FASE 3: Analytics                                          │
│  └── US-003: Sarcastisch Dashboard                          │
│      ├── Data aggregatie                                    │
│      ├── LLM integratie                                     │
│      └── Caching                                            │
│                                                              │
│  FASE 4: Game Uitbreiding                                   │
│  └── US-005 Fase 2: Grill Guru & Multiplayer                │
│      ├── LLM persona                                        │
│      ├── Async challenges                                   │
│      └── Roast generator                                    │
│                                                              │
│  FASE 5: Event Features                                     │
│  └── US-006: Einde-Avond Awards                             │
│      ├── Rapport generator                                  │
│      ├── Live dashboard                                     │
│      └── Sharing & reactions                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Graph

```
US-007 (Progressieve Registratie)
   │
   ├──► US-001 (Skills) ──────────┐
   │                              │
   ├──► US-002 (Profielvelden) ───┼──► US-003 (Dashboard)
   │                              │         │
   │                              │         ▼
   └──► Leaderboard ──────────────┼──► US-005 (Game)
                                  │         │
                                  │         ▼
                                  └──► US-006 (Awards)
```

---

## Open Vragen (Alle US)

| US | Vraag | Status |
|----|-------|--------|
| US-007 | Opt-out per reminder type of globaal? | Open |
| US-003 | Minimum aantal registraties voor analyses? | Open |
| US-003 | Hoe vaak LLM analyses refreshen? | Open |
| US-005 | Canvas API of Phaser.js? | Open |
| US-005 | Geluid in MVP? | Besloten: Nee |
| US-006 | Fun survey tijdens event? | Open |
| US-006 | Welke emoji's voor reactions? | Open |

---

*Document gegenereerd: 2026-01-18*
*Status: PREPARE fase compleet (inclusief US-007)*
