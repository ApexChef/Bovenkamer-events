# PACT Analyse: US-007 - Progressieve Registratie

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Lage drempel registratie met puntenbeloning voor complete profielen |
| **Scope** | Registratie flow, punten systeem, herinneringen |
| **Prioriteit** | Hoogste (#1) |
| **Complexiteit** | Medium-Hoog |

### Functionele Requirements
1. **FR-007.1**: Minimale registratie met alleen naam, e-mail, PIN
2. **FR-007.2**: 6 profiel secties, elk apart invulbaar
3. **FR-007.3**: Punten toekenning per voltooide sectie (totaal 250)
4. **FR-007.4**: Dashboard prompt met compleetheid percentage
5. **FR-007.5**: Gepersonaliseerde "passeer X" berekening
6. **FR-007.6**: In-app notificaties bij incomplete profiel
7. **FR-007.7**: E-mail herinneringen (automatisch + handmatig)
8. **FR-007.8**: Admin dashboard voor reminder beheer
9. **FR-007.9**: Leaderboard integratie met profiel-punten

### Profiel Secties & Punten
| Sectie | Velden | Punten | Prioriteit |
|--------|--------|--------|------------|
| Persoonlijk | Geboortedatum, geslacht, partner | 50 | Hoog |
| JKV Historie | JKV/Bovenkamer jaren | 30 | Medium |
| Skills | 8 skill categorieën | 40 | Hoog |
| Muziek | Decennium, genre | 20 | Laag |
| Borrel Stats | 2025 geweest, 2026 planning | 30 | Medium |
| Fun Quiz | 15 grappige vragen | 80 | Hoog |
| **Totaal** | | **250** | |

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Minimale registratie flow | Social login (Google, etc.) |
| Sectie-gebaseerde punten | Punten voor andere acties |
| In-app + e-mail reminders | Push notificaties |
| Leaderboard impact berekening | Real-time leaderboard updates |
| Admin reminder beheer | AI-gegenereerde reminder teksten |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| Bestaande auth flow (JWT, PIN) | Intern | Beschikbaar |
| Resend API (e-mail) | Extern | Geconfigureerd |
| Users tabel (punten velden) | Database | Aan te passen |
| Registrations tabel | Database | Aan te passen |
| Zustand stores | State | Aan te passen |

### Impact op Andere US
| User Story | Impact |
|------------|--------|
| US-001 (Skills) | Wordt onderdeel van profiel secties |
| US-002 (Profielvelden) | Wordt onderdeel van profiel secties |
| US-003 (Dashboard) | Moet wachten op profiel data |
| US-005 (Game) | Grill Guru heeft minder data bij incomplete profielen |
| US-006 (Awards) | Rapporten minder persoonlijk bij incomplete profielen |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Te veel e-mail = spam klachten | Hoog | Medium | Max 6 e-mails, opt-out per type |
| Niemand vult profiel aan | Hoog | Laag | Gamification, sociale druk (leaderboard) |
| Complexe state management | Medium | Medium | Clear sectie boundaries, unit tests |
| Database migratie issues | Medium | Laag | JSONB voor flexibiliteit |

### Aannames
1. Gebruikers zijn gemotiveerd door punten/competitie
2. 250 punten is significant genoeg vs. game/quiz punten
3. E-mail herinneringen worden gelezen
4. Leaderboard is publiek zichtbaar

### User Flows

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

### E-mail Strategie
| Trigger | Timing | Personalisatie |
|---------|--------|----------------|
| 24h na registratie | Automatisch | Basis (welkom + status) |
| Wekelijks (ma 10:00) | Automatisch | Leaderboard positie, "passeer X" |
| Handmatig (admin) | On-demand | Grill Guru toon |
| Laatste kans | 48h voor event | Urgentie, alle missende secties |
| 100% compleet | Automatisch | Felicitatie + waarschuwing (Grill Guru) |

### Success Metrics
| Metric | Target | Meting |
|--------|--------|--------|
| Conversie naar 100% compleet | >80% | `profile_percentage = 100` count |
| Gemiddelde tijd tot compleet | <7 dagen | `last_section_completed_at - created_at` |
| E-mail open rate | >50% | `opened_at / sent_at` ratio |
| Click-through rate | >25% | `clicked_at / opened_at` ratio |

---

## ARCHITECTURE

### Systeem Overzicht

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

### Component Architectuur

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

### Data Flow

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

### Database Schema

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

### State Management

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

### Integratie Punten

| Systeem | Doel | Integratie |
|---------|------|------------|
| **Supabase** | Data persistence | Direct via `@supabase/supabase-js` |
| **Resend** | E-mail verzending | Server-side API calls |
| **Vercel Cron** | Scheduled reminders | `/api/cron/reminders` endpoint |
| **JWT** | Authenticatie | Bestaande auth flow hergebruiken |

### Security Overwegingen

| Aspect | Aanpak |
|--------|--------|
| **Rate Limiting** | Max 3 registraties per IP per uur |
| **PIN Storage** | bcrypt hash, nooit plaintext |
| **API Auth** | JWT verificatie op alle `/api/profile/*` |
| **Admin Routes** | Role check op `/api/admin/*` |
| **E-mail Tracking** | Unieke tokens per reminder, geen PII in URL |

---

## CODE

*Nog niet uitgewerkt - volgt na Architecture review*

---

## TEST

*Nog niet uitgewerkt - volgt na Code implementatie*
