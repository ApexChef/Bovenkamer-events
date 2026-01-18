# PACT Analyse: US-003 - Sarcastisch Dashboard

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Humoristisch groepsdashboard met LLM-gegenereerde analyses |
| **Scope** | Nieuwe pagina, LLM integratie, data aggregatie |
| **Prioriteit** | Medium (#5 in volgorde) |
| **Complexiteit** | Hoog |

### Functionele Requirements
1. **FR-003.1**: Dashboard pagina voor ingelogde gebruikers
2. **FR-003.2**: Groepsprofiel samenvatting (LLM)
3. **FR-003.3**: Skill scores per categorie met visualisatie
4. **FR-003.4**: Segment analyses (geslacht, leeftijd, JKV)
5. **FR-003.5**: Superlatieven & Awards
6. **FR-003.6**: Borrel statistieken
7. **FR-003.7**: Voorspellingen voor event (LLM)
8. **FR-003.8**: Admin kan analyses handmatig refreshen
9. **FR-003.9**: Caching van LLM analyses

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| 6 dashboard secties | Realtime updates |
| LLM integratie (Claude API) | Meerdere talen |
| Responsive design | Export naar PDF |
| Admin refresh | Automatische notificaties |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 (skills) | User Story | Vereist |
| US-002 (profielvelden) | User Story | Vereist |
| Anthropic Claude API | Extern | Geconfigureerd |
| Alle registraties compleet | Data | Runtime |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| LLM kosten te hoog | Medium | Medium | Caching, rate limiting |
| Ongepaste LLM output | Hoog | Laag | Prompt engineering, review |
| Performance bij veel data | Medium | Laag | Aggregatie queries, caching |
| Lege data bij weinig registraties | Medium | Medium | Minimum threshold voor analyses |

### Aannames
1. Minimaal 5 registraties nodig voor zinvolle analyses
2. LLM analyses worden ~1x per dag gegenereerd (of on-demand)
3. Claude API is beschikbaar en geconfigureerd
4. Sarcastische toon is acceptabel voor doelgroep

### LLM Prompt Strategie
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

---

## ARCHITECTURE

### Systeem Architectuur

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

### Data Aggregatie Strategie

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

### Cache Invalidatie

| Trigger | Actie |
|---------|-------|
| Nieuwe registratie | Invalidate `skill_scores`, `borrel_stats` |
| Admin refresh knop | Invalidate ALL + regenerate LLM |
| TTL expired | Lazy regenerate on next request |
| Dagelijks (cron) | Pre-generate alle LLM content |

### LLM Service Architectuur

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

## CODE

*Nog niet uitgewerkt - volgt na Architecture review*

---

## TEST

*Nog niet uitgewerkt - volgt na Code implementatie*
