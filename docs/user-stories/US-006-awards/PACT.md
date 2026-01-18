# PACT Analyse: US-006 - Einde-Avond Awards

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Persoonlijke LLM-rapporten aan einde van event |
| **Scope** | Awards systeem, live dashboard, privacy controls |
| **Prioriteit** | Medium (#6 in volgorde) |
| **Complexiteit** | Zeer Hoog |

### Functionele Requirements

#### MVP (Fase 1)
1. **FR-006.1**: Admin kan "Awards Modus" activeren
2. **FR-006.2**: LLM genereert rapport per deelnemer
3. **FR-006.3**: Elk persoon ziet eigen rapport op telefoon
4. **FR-006.4**: 5-8 basis award categorieën
5. **FR-006.5**: Keuze: privé houden of delen

#### Uitbreiding (Fase 2)
6. **FR-006.6**: Live dashboard met queue systeem
7. **FR-006.7**: Emoji reactions op gedeelde rapporten
8. **FR-006.8**: Projectie-modus voor groot scherm
9. **FR-006.9**: Real-time notificaties

#### Scherpte Feature
10. **FR-006.10**: Scherpte slider (0-100%, stappen van 5)
11. **FR-006.11**: Max 3 regeneraties per gebruiker
12. **FR-006.12**: Regeneratie-gedrag wordt roast materiaal

#### Admin Features
13. **FR-006.13**: Voorspellingen status tracker
14. **FR-006.14**: Reminder systeem voor incomplete voorspellingen
15. **FR-006.15**: Pre-generatie van rapporten

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Persoonlijke rapporten | Event check-in/out tracking |
| Live sharing dashboard | Real-time locatie tracking |
| Emoji reactions | Comments/replies |
| Scherpte aanpassing | Audio/video rapporten |
| Pre-event voorspelling tracking | Post-event survey |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001, US-002 | User Story | Voor profiel data |
| US-003 | User Story | Deelt LLM logica |
| US-005 | User Story | Voor game stats in rapport |
| Voorspellingen module | Feature | Bestaand |
| Quiz module | Feature | Bestaand |
| Anthropic Claude API | Extern | Geconfigureerd |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| LLM kosten (15 rapporten) | Medium | Hoog | Pre-generatie, caching |
| Rapport te persoonlijk/offensief | Hoog | Medium | Scherpte slider, admin review |
| WiFi/netwerk issues tijdens event | Hoog | Medium | Pre-generatie, offline caching |
| Niemand wil delen | Medium | Laag | Social proof, gamification |
| Technische problemen live | Hoog | Medium | Fallback: toon statische content |

### Aannames
1. Event tracking niet nodig (registratie = aanwezig)
2. Admin kiest handmatig wanneer awards activeren
3. Scherpte regeneratie max 3x per persoon
4. Rapporten worden vooraf gegenereerd (~2 min voor alle)
5. WiFi beschikbaar op locatie

### Award Categorieën Mapping
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

### Data Inputs voor Rapport
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

---

## ARCHITECTURE

### Awards Systeem Overzicht

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

### Live Dashboard Architectuur

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

### Scherpte Regeneratie Flow

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

### Database Schema

```sql
-- Persoonlijke rapporten
CREATE TABLE personal_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  event_year INTEGER NOT NULL,
  report_data JSONB NOT NULL,           -- Alle input data
  generated_content TEXT NOT NULL,      -- LLM output
  awards JSONB NOT NULL,                -- Welke awards
  is_shared BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP,
  reactions JSONB DEFAULT '{}',         -- {userId: emoji}
  intensity_chosen INTEGER DEFAULT 60,
  regeneration_count INTEGER DEFAULT 0,
  intensity_history JSONB DEFAULT '[]',
  generated_at TIMESTAMP DEFAULT NOW(),
  tokens_used INTEGER
);

-- Reacties op gedeelde rapporten
CREATE TABLE report_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES personal_reports(id),
  user_id UUID REFERENCES users(id),
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(report_id, user_id)            -- 1 reactie per persoon
);
```

### Real-time Updates

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

### Offline Fallback

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

## CODE

*Nog niet uitgewerkt - volgt na Architecture review*

---

## TEST

*Nog niet uitgewerkt - volgt na Code implementatie*
