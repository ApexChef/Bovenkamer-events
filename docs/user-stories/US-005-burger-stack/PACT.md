# PACT Analyse: US-005 - Burger Stack Mini-Game

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Verslavend stapelspel voor pre-event engagement |
| **Scope** | Nieuwe game module, leaderboard, LLM persona |
| **Prioriteit** | Hoog (#4 in volgorde) |
| **Complexiteit** | Zeer Hoog |

### Functionele Requirements

#### MVP (Fase 1)
1. **FR-005.1**: Basis gameplay (tap to drop, stacking)
2. **FR-005.2**: Score systeem met punten per ingrediënt
3. **FR-005.3**: Mobile-first responsive design
4. **FR-005.4**: Highscore opslaan in database
5. **FR-005.5**: Simpel leaderboard
6. **FR-005.6**: Auth integratie (alleen ingelogde users)

#### Uitbreiding (Fase 2)
7. **FR-005.7**: Speciale items (Gouden Biefstuk, Slow-mo, etc.)
8. **FR-005.8**: Combo systeem met visuele feedback
9. **FR-005.9**: Grill Guru commentaar (LLM)
10. **FR-005.10**: Thema's unlockbaar
11. **FR-005.11**: Persoonlijke statistieken

#### Multiplayer (Fase 2+)
12. **FR-005.12**: Async Challenge Mode
13. **FR-005.13**: Challenge notificaties
14. **FR-005.14**: Duel resultaten met Grill Guru roasts

#### Event Features (Fase 3)
15. **FR-005.15**: LLM Roast Generator voor live event
16. **FR-005.16**: Admin panel voor roast selectie
17. **FR-005.17**: Projectie-modus
18. **FR-005.18**: Schaduw Roasts voor niet-spelers

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Canvas/Phaser.js game | 3D graphics |
| Mobile touch + desktop click | VR/AR |
| Async multiplayer | Real-time multiplayer |
| LLM roasts (tekst) | Voice/audio roasts |
| Pre-event gameplay | During-event gameplay |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 & US-002 | User Story | Voor Grill Guru context |
| Canvas API of Phaser.js | Library | Te kiezen |
| Anthropic Claude API | Extern | Geconfigureerd |
| Zustand | State | Beschikbaar |
| Supabase | Database | Beschikbaar |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Game engine leercurve | Medium | Medium | Canvas API (simpeler) als fallback |
| Performance op oude telefoons | Hoog | Medium | Progressive enhancement, FPS capping |
| LLM kosten bij veel games | Medium | Hoog | Rate limiting, caching, batching |
| Verslaving/overuse | Laag | Laag | Geen real-money, just fun |
| Game balancing | Medium | Hoog | Iteratief testen, analytics |

### Aannames
1. Mobile-first, portrait mode primair
2. Geen geluid in MVP (optioneel later)
3. Grill Guru kent alle deelnemers (via profiel data)
4. Pre-event only, niet tijdens event
5. Geen expiratie op challenges

### Technische Keuzes
| Keuze | Optie A | Optie B | Aanbeveling |
|-------|---------|---------|-------------|
| Game Engine | Canvas API | Phaser.js | Canvas API (MVP), Phaser (later) |
| State | Zustand | React state | Zustand (consistency) |
| Animaties | requestAnimationFrame | CSS Animations | requestAnimationFrame |
| LLM calls | Client-side | Server-side | Server-side (API key security) |

### Database Schema (Nieuw)
```sql
-- game_scores: Alle spelresultaten
-- game_challenges: Async duels
-- grill_guru_logs: LLM output logging
-- grill_guru_config: Admin configuratie
```

---

## ARCHITECTURE

### Game Engine Architectuur

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

### Component Hiërarchie

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

### Grill Guru Integratie

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

### Challenge (Multiplayer) Flow

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

### Database Schema

```sql
-- Nieuwe tabel voor game scores
CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  game_type VARCHAR(50) DEFAULT 'burger_stack',
  score INTEGER NOT NULL,
  layers INTEGER,
  max_combo INTEGER,
  perfect_drops INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index voor leaderboard queries
CREATE INDEX idx_game_scores_leaderboard ON game_scores(game_type, score DESC);

-- Challenges tabel
CREATE TABLE game_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID REFERENCES users(id),
  challenged_id UUID REFERENCES users(id),
  challenger_score_id UUID REFERENCES game_scores(id),
  challenged_score_id UUID REFERENCES game_scores(id),
  status VARCHAR(20) DEFAULT 'pending',
  winner_id UUID REFERENCES users(id),
  guru_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Grill Guru logging
CREATE TABLE grill_guru_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  context_type VARCHAR(50),
  trigger_data JSONB,
  generated_text TEXT,
  roast_category VARCHAR(100),
  intensity_used INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## CODE

*Nog niet uitgewerkt - volgt na Architecture review*

---

## TEST

*Nog niet uitgewerkt - volgt na Code implementatie*
