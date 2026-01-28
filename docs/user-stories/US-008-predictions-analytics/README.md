---
id: US-008
title: Voorspellingen Analytics Dashboard
status: draft
priority: Medium
complexity: Medium
type: Feature
pr: null
created: 2026-01-18
updated: 2026-01-18
---

# US-008: Voorspellingen Analytics Dashboard

## User Story
> Als deelnemer wil ik op het dashboard kunnen zien wat de huidige voorspellingen van alle deelnemers zijn (geanonimiseerd), zodat ik kan vergelijken en de spanning kan opbouwen richting het evenement.

## Achtergrond
Deelnemers maken voorspellingen over het evenement (consumptie, wie doet wat, etc.). Door een analytics overzicht te tonen wordt:
- Engagement verhoogd
- Spanning opgebouwd
- Community gevoel versterkt

## Voorgestelde Weergave

### Dashboard Tab: Voorspellingen
```
┌─────────────────────────────────────────────────────────────┐
│  📊 VOORSPELLINGEN STATISTIEKEN                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  15 van 20 deelnemers hebben voorspellingen ingevuld        │
│  [███████████████░░░░░] 75%                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🍷 FLESSEN WIJN                                             │
│  ┌──────────────────────────────────────────┐               │
│  │  Gemiddeld: 12.5 flessen                  │               │
│  │  Laagste: 8 │ Hoogste: 20                 │               │
│  │  [▁▂▃▅███▅▃▂▁] distributie                │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  🍺 KRATTEN BIER                                             │
│  ┌──────────────────────────────────────────┐               │
│  │  Gemiddeld: 5.2 kratten                   │               │
│  │  Laagste: 3 │ Hoogste: 8                  │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  🥩 KILO'S VLEES                                             │
│  ┌──────────────────────────────────────────┐               │
│  │  Gemiddeld: 4.1 kg                        │               │
│  │  Laagste: 2 │ Hoogste: 6                  │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👥 POPULAIRSTE KEUZES                                       │
│                                                              │
│  Eerste in slaap:     Boy Boom (8 stemmen)                  │
│  Eerste vertrekker:   Jan (5 stemmen)                        │
│  Laatste gast:        Alwin (6 stemmen)                      │
│  Luidste lacher:      Peter (7 stemmen)                      │
│  Spontane zanger:     Marco (4 stemmen)                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌡️ TEMPERATUUR VOORSPELLING                                │
│  Gemiddeld: -2°C │ Range: -8°C tot 5°C                       │
│                                                              │
│  ⏰ LAATSTE GAST VERTREKT                                    │
│  Gemiddeld: 01:30 │ Vroegste: 22:00 │ Laatst: 05:00          │
│                                                              │
│  🔥 IETS AANGEBRAND?                                         │
│  Ja: 12 (80%) │ Nee: 3 (20%)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Requirements

### API Endpoint
`GET /api/predictions/stats`

Response:
```typescript
interface PredictionStats {
  totalParticipants: number;
  participantsWithPredictions: number;

  consumption: {
    wineBottles: { avg: number; min: number; max: number; };
    beerCrates: { avg: number; min: number; max: number; };
    meatKilos: { avg: number; min: number; max: number; };
  };

  social: {
    firstSleeper: { name: string; count: number; }[];
    firstToLeave: { name: string; count: number; }[];
    lastToLeave: { name: string; count: number; }[];
    loudestLaugher: { name: string; count: number; }[];
    spontaneousSinger: { name: string; count: number; }[];
    longestStoryTeller: { name: string; count: number; }[];
  };

  other: {
    outsideTemp: { avg: number; min: number; max: number; };
    lastGuestTime: { avg: string; earliest: string; latest: string; };
    somethingBurned: { yes: number; no: number; };
  };
}
```

## Acceptatiecriteria

- [ ] Dashboard tab "Voorspellingen" toont statistieken
- [ ] Gemiddelde, min/max voor numerieke voorspellingen
- [ ] Top 3 populairste keuzes voor sociale voorspellingen
- [ ] Percentage deelnemers met voorspellingen
- [ ] Data wordt realtime geüpdatet (of elke 5 minuten)
- [ ] Anonieme weergave (geen individuele voorspellingen zichtbaar)

## Privacy Overwegingen

- Alleen geaggregeerde data tonen
- Geen individuele voorspellingen zichtbaar
- Pas na het evenement kunnen resultaten worden gematcht aan personen

## Implementatie Fases

### Fase 1: Backend API
- Maak `/api/predictions/stats` endpoint
- Aggregeer alle voorspellingen
- Cache resultaten (5 minuten TTL)

### Fase 2: Dashboard Component
- Maak `PredictionsStatsCard` component
- Integreer in dashboard tab "Voorspellingen"
- Responsive design (mobile-first)

### Fase 3: Visualisaties (optioneel)
- Histogram/distributie charts
- Animated counters
- Progress bars

## Technische Notities

- Gebruik Supabase aggregatie queries
- Overweeg React Query voor caching client-side
- Framer Motion voor animaties
