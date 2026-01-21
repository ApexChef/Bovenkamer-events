# User Stories - Bovenkamer Winterproef

Dit document bevat een overzicht van alle user stories, hun onderlinge relaties, status en implementatie volgorde.

## Overzicht

| ID | Naam | Prioriteit | Status | PR | Opmerkingen |
|----|------|------------|--------|-----|-------------|
| [US-001](./US-001-skill-categories/) | Skill Categorieën | #2 | ✅ DONE | [#14](https://github.com/ApexChef/Bovenkamer-events/pull/14) | 8 skill categorieën geïmplementeerd |
| [US-002](./US-002-profile-fields/) | Uitgebreide Profielvelden | #3 | ✅ DONE | [#12](https://github.com/ApexChef/Bovenkamer-events/pull/12), [#15](https://github.com/ApexChef/Bovenkamer-events/pull/15) | JKV historie + borrel stats UI compleet |
| [US-005](./US-005-burger-stack/) | Burger Stack Mini-Game | #4 | ✅ FASE 1+2 DONE | [#4](https://github.com/ApexChef/Bovenkamer-events/pull/4), [#16](https://github.com/ApexChef/Bovenkamer-events/pull/16) | Special items, graphics, feedback, CTA |
| [US-007](./US-007-progressive-registration/) | Progressieve Registratie | #1 | ✅ DONE | [#10](https://github.com/ApexChef/Bovenkamer-events/pull/10), [#15](https://github.com/ApexChef/Bovenkamer-events/pull/15) | Alle 6 profiel secties met punten |
| [US-003](./US-003-sarcastic-dashboard/) | Sarcastisch Dashboard | #5 | 🔲 TODO | - | Nog niet gestart |
| [US-006](./US-006-awards/) | Einde-Avond Awards | #6 | 🔲 TODO | - | Nog niet gestart |
| [US-008](./US-008-predictions-analytics/) | Voorspellingen Analytics | #7 | 📝 DRAFT | - | User story draft aangemaakt |
| ~~US-004~~ | Taaktoewijzing | - | ❌ Uitgesteld | - | - |
| [US-009](./US-009-profile-data-sync/) | Profiel Data Sync | URGENT | 🔧 IN PROGRESS | - | Bug fix: profiel laadt niet na login |
| [US-010](./US-010-mobile-pin-keyboard/) | Mobiel PIN Toetsenbord | Medium | ✅ DONE | [#20](https://github.com/ApexChef/Bovenkamer-events/pull/20) | Numeriek toetsenbord voor laatste 2 PIN cijfers |
| [US-011](./US-011-desktop-login-hang/) | Desktop Login/Dashboard Issues | URGENT | 🔧 IN PROGRESS | - | Dashboard loading, profiel sync bug fix |

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
| **E-mail Service** | US-007, US-006 | ✅ Bestaand (Resend) |
| **LLM Service** | US-003, US-005, US-006, US-007 | 🔲 Te maken |
| **Grill Guru Persona** | US-005, US-006, US-007 | 🔲 Te maken |
| **Admin Config Panel** | US-005, US-006, US-007 | 🔲 Te maken |
| **Real-time Updates** | US-005 (challenges), US-006 (dashboard) | 🔲 Te maken |
| **Punten Systeem** | US-007, US-005, US-006 | ✅ Bestaand |
| **Leaderboard Component** | US-007, US-005 | ✅ Geïmplementeerd |
| **Game Engine** | US-005 | ✅ Canvas API met special items |

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
| US-005 | Canvas API of Phaser.js? | Besloten: Canvas API |
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
├── US-007-progressive-registration/
│   ├── README.md
│   └── PACT.md
├── US-008-predictions-analytics/
│   └── README.md                     # Draft user story
├── US-009-profile-data-sync/
│   ├── README.md                     # Bug fix user story
│   └── PACT.md                       # Prepare documentatie
├── US-010-mobile-pin-keyboard/
│   └── README.md                     # UX verbetering mobiel toetsenbord
└── US-011-desktop-login-hang/
    └── README.md                     # Bug fix dashboard loading/sync
```

---

*Document laatst bijgewerkt: 2026-01-18*

## Voortgang Samenvatting

### Voltooid ✅
- **US-001**: 8 skill categorieën in profiel pagina
- **US-002**: JKV historie + borrel stats secties compleet
- **US-005 Fase 1+2**: Burger Stack game met special items, verbeterde graphics en feedback
  - Special items: golden steak (3x), slow-mo, extra life, fire
  - Graphics: gradients, shadows, rounded corners, grid background
  - Feedback: floating score text, drop guide, target zone highlight
  - Dashboard CTA met burger thema
  - Leaderboard toont alleen beste score per user
- **US-007**: Alle 6 profiel secties met punten systeem (260 totaal)

### Nog Te Doen 🔲
- **US-005 Fase 3**: Grill Guru LLM commentaar, thema's, statistieken pagina
- **US-003**: Sarcastisch Dashboard (LLM analyses)
- **US-006**: Einde-Avond Awards
- **US-008**: Voorspellingen Analytics Dashboard

### Volgende Stappen
1. US-005 Fase 3: Grill Guru statische teksten toevoegen
2. US-003 starten: LLM integratie voor sarcastische analyses
3. US-006 voorbereiden: Einde-avond awards systeem
