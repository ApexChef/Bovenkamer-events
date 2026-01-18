# User Stories - Bovenkamer Winterproef

Dit document bevat een overzicht van alle user stories, hun onderlinge relaties, status en implementatie volgorde.

## Overzicht

| ID | Naam | Prioriteit | Status | Complexiteit | PACT Fase |
|----|------|------------|--------|--------------|-----------|
| [US-007](./US-007-progressive-registration/) | Progressieve Registratie | #1 | In Planning | Medium-Hoog | Prepare + Architecture |
| [US-001](./US-001-skill-categories/) | Skill Categorieën | #2 | In Planning | Laag-Medium | Prepare + Architecture |
| [US-002](./US-002-profile-fields/) | Uitgebreide Profielvelden | #3 | In Planning | Medium | Prepare + Architecture |
| [US-005](./US-005-burger-stack/) | Burger Stack Mini-Game | #4 | In Planning | Zeer Hoog | Prepare + Architecture |
| [US-003](./US-003-sarcastic-dashboard/) | Sarcastisch Dashboard | #5 | In Planning | Hoog | Prepare + Architecture |
| [US-006](./US-006-awards/) | Einde-Avond Awards | #6 | In Planning | Zeer Hoog | Prepare + Architecture |
| ~~US-004~~ | Taaktoewijzing | - | Uitgesteld | - | - |

## Dependency Graph

```
US-007 (Progressieve Registratie)
   │
   │  Maakt gefaseerde registratie mogelijk
   │  met punten per profiel sectie
   │
   ├──► US-001 (Skills) ──────────┐
   │    40 punten voor skills     │
   │                              │
   ├──► US-002 (Profielvelden) ───┼──► US-003 (Dashboard)
   │    110 punten verdeeld       │    Analyses op basis van
   │    over secties              │    profiel + skill data
   │                              │
   │                              │         │
   │                              │         ▼
   └──► Leaderboard ──────────────┼──► US-005 (Game)
        Profiel + Game punten     │    Grill Guru gebruikt
        gecombineerd              │    profiel data voor roasts
                                  │
                                  │         │
                                  │         ▼
                                  └──► US-006 (Awards)
                                       Rapporten combineren
                                       ALLE data bronnen
```

## Relaties Matrix

| Van → Naar | US-007 | US-001 | US-002 | US-003 | US-005 | US-006 |
|------------|--------|--------|--------|--------|--------|--------|
| **US-007** | - | Skills sectie | Profiel secties | Data nodig | Data nodig | Data nodig |
| **US-001** | Onderdeel van | - | Samen profiel | Skill analyses | Grill Guru data | Rapport data |
| **US-002** | Onderdeel van | Samen profiel | - | Segment analyses | Grill Guru data | Rapport data |
| **US-003** | - | Skill data | Profiel data | - | Deelt LLM | Deelt LLM |
| **US-005** | Game punten | Roast data | Roast data | Deelt LLM | - | Game stats |
| **US-006** | - | Rapport data | Rapport data | Deelt LLM | Game stats | - |

## Gedeelde Componenten

| Component | Gebruikt door | Status |
|-----------|---------------|--------|
| **E-mail Service** | US-007, US-006 | Bestaand (Resend) |
| **LLM Service** | US-003, US-005, US-006, US-007 | Te maken |
| **Grill Guru Persona** | US-005, US-006, US-007 | Te maken |
| **Admin Config Panel** | US-005, US-006, US-007 | Te maken |
| **Real-time Updates** | US-005 (challenges), US-006 (dashboard) | Te maken |
| **Punten Systeem** | US-007, US-005, US-006 | Bestaand (uitbreiden) |
| **Leaderboard Component** | US-007, US-005 | Te maken |

## Database Wijzigingen

| User Story | Nieuwe Tabellen | Wijzigingen Bestaand |
|------------|-----------------|----------------------|
| US-007 | `profile_reminders` | `registrations` + sections_completed, profile_points, profile_percentage |
| US-001 | - | `registrations.skills` (JSONB) |
| US-002 | - | `registrations` + 8 kolommen |
| US-003 | `dashboard_cache` | - |
| US-005 | `game_scores`, `game_challenges`, `grill_guru_logs`, `grill_guru_config` | `users.game_points` |
| US-006 | `personal_reports`, `report_reactions` | - |

## API Endpoints

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

## Implementatie Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATIE ROADMAP                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FASE 0: Registratie Refactor (HOOGSTE PRIORITEIT)          │
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

## Open Vragen

| US | Vraag | Status |
|----|-------|--------|
| US-007 | Opt-out per reminder type of globaal? | Open |
| US-003 | Minimum aantal registraties voor analyses? | Open |
| US-003 | Hoe vaak LLM analyses refreshen? | Open |
| US-005 | Canvas API of Phaser.js? | Open |
| US-005 | Geluid in MVP? | Besloten: Nee |
| US-006 | Fun survey tijdens event? | Open |
| US-006 | Welke emoji's voor reactions? | Open |

## Beslissingen Log

| Datum | Beslissing | Context |
|-------|------------|---------|
| 2026-01-18 | Registratie gefaseerd met puntenbeloning | US-007 toegevoegd |
| 2026-01-18 | Borrel historie 2025: 10 borrels, elke 4e donderdag | US-002 |
| 2026-01-18 | December borrels vervallen (zowel 2025 als 2026) | US-002 |
| 2026-01-18 | Privacy geen issue - individuele awards met namen toegestaan | US-006 |
| 2026-01-18 | Geboortejaar → Volledige geboortedatum met soft validatie | US-002 |
| 2026-01-18 | Grill Guru audio: Nee, eerst alleen tekst | US-005 |
| 2026-01-18 | Challenge expiratie: Geen tijdslimiet | US-005 |
| 2026-01-18 | Event tracking niet nodig | US-006 |
| 2026-01-18 | Scherpte aanpassen: Max 3x regenereren | US-006 |

## Folder Structuur

```
docs/user-stories/
├── README.md                         # Dit document
├── US-001-skill-categories/
│   ├── README.md                     # User story beschrijving
│   └── PACT.md                       # PACT analyse
├── US-002-profile-fields/
│   ├── README.md
│   └── PACT.md
├── US-003-sarcastic-dashboard/
│   ├── README.md
│   └── PACT.md
├── US-005-burger-stack/
│   ├── README.md
│   └── PACT.md
├── US-006-awards/
│   ├── README.md
│   └── PACT.md
└── US-007-progressive-registration/
    ├── README.md
    └── PACT.md
```

---

*Document gegenereerd: 2026-01-18*
*PACT Status: Prepare + Architecture fase compleet voor alle US*
