# Bovenkamer Winterproef - Documentatie

Dit is de centrale documentatie hub voor het Bovenkamer Winterproef platform.

## Documentatie Structuur

```
docs/
├── README.md                     # Dit document
│
├── user-stories/                 # Feature specificaties
│   ├── README.md                 # Overzicht, relaties, status
│   ├── US-001-skill-categories/
│   ├── US-002-profile-fields/
│   ├── US-003-sarcastic-dashboard/
│   ├── US-005-burger-stack/
│   ├── US-006-awards/
│   └── US-007-progressive-registration/
│
├── auth/                         # Authenticatie systeem
│   ├── README.md                 # Overzicht
│   ├── QUICK_START.md            # 5-minuten setup
│   ├── BACKEND.md                # Backend implementatie
│   ├── IMPLEMENTATION.md         # Volledige details
│   ├── PACT-PREPARE.md           # Requirements
│   └── PACT-ARCHITECTURE.md      # Architectuur
│
├── payments/                     # Betaalmodule
│   ├── README.md                 # Overzicht
│   └── BACKLOG.md                # Specificatie
│
├── frontend/                     # Frontend implementatie
│   ├── README.md                 # Overzicht
│   └── IMPLEMENTATION.md         # Details
│
└── backlog/                      # Feature backlog
    ├── README.md                 # Overzicht
    └── FEATURES.md               # Alle ideeën
```

## Quick Links

### Kern Documentatie

| Document | Beschrijving |
|----------|--------------|
| [CLAUDE.md](../CLAUDE.md) | Project instructies voor AI assistenten |
| [HANDOVER.md](../HANDOVER.md) | Overdracht en deployment |

### Features

| Sectie | Beschrijving |
|--------|--------------|
| [User Stories](./user-stories/README.md) | Gestructureerde feature specs met PACT analyse |
| [Feature Backlog](./backlog/README.md) | Alle feature ideeën |

### Technisch

| Sectie | Beschrijving |
|--------|--------------|
| [Auth Systeem](./auth/README.md) | PIN-based authenticatie |
| [Frontend](./frontend/README.md) | UI componenten |
| [Payments](./payments/README.md) | Tikkie integratie |

## Project Status

### Geïmplementeerd ✅

| Feature | Documentatie |
|---------|--------------|
| Landing page | [CLAUDE.md](../CLAUDE.md) |
| Registratie flow | [Auth](./auth/) |
| PIN authenticatie | [Auth](./auth/) |
| Email verificatie | [Auth](./auth/) |
| Admin approval | [Auth](./auth/) |
| Dashboard basis | [Frontend](./frontend/) |
| Voorspellingen | [CLAUDE.md](../CLAUDE.md) |
| Boy Boom beoordeling | [CLAUDE.md](../CLAUDE.md) |
| Live Quiz | [CLAUDE.md](../CLAUDE.md) |

### In Planning 📋

| Feature | Documentatie |
|---------|--------------|
| Progressieve Registratie | [US-007](./user-stories/US-007-progressive-registration/) |
| Skill Categorieën | [US-001](./user-stories/US-001-skill-categories/) |
| Uitgebreide Profielvelden | [US-002](./user-stories/US-002-profile-fields/) |
| Burger Stack Game | [US-005](./user-stories/US-005-burger-stack/) |
| Sarcastisch Dashboard | [US-003](./user-stories/US-003-sarcastic-dashboard/) |
| Awards Systeem | [US-006](./user-stories/US-006-awards/) |
| Betaalmodule | [Payments](./payments/) |

### Backlog ⏳

| Feature | Documentatie |
|---------|--------------|
| Muziek Wizard | [Backlog](./backlog/FEATURES.md) |
| Extra Spelletjes | [Backlog](./backlog/FEATURES.md) |
| Spotify Integratie | [Backlog](./backlog/FEATURES.md) |

## PACT Framework

Alle user stories volgen het PACT framework:

| Fase | Beschrijving | Status |
|------|--------------|--------|
| **P**repare | Requirements, risico's, aannames | ✅ Compleet |
| **A**rchitecture | Systeem ontwerp, data flows | ✅ Compleet |
| **C**ode | Implementatie | ⏳ Volgt |
| **T**est | Test strategie | ⏳ Volgt |

## Implementatie Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATIE VOLGORDE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. US-007: Progressieve Registratie                        │
│     └─► Minimale registratie, profiel secties, punten       │
│                                                              │
│  2. US-001 + US-002: Profiel Uitbreiding                    │
│     └─► Skills categorieën, extra velden                    │
│                                                              │
│  3. Betaalmodule                                            │
│     └─► Tikkie integratie                                   │
│                                                              │
│  4. US-005: Burger Stack Game                               │
│     └─► Game engine, leaderboard                            │
│                                                              │
│  5. US-003: Sarcastisch Dashboard                           │
│     └─► LLM analyses, caching                               │
│                                                              │
│  6. US-006: Awards Systeem                                  │
│     └─► Rapporten, live dashboard                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Bijdragen

### Nieuwe Feature Toevoegen

1. Maak een nieuwe folder in `docs/user-stories/US-XXX-naam/`
2. Voeg `README.md` toe met user story beschrijving
3. Voeg `PACT.md` toe met analyse
4. Update `docs/user-stories/README.md` met relaties

### Documentatie Updaten

1. Houd alle documenten up-to-date bij implementatie wijzigingen
2. Gebruik consistente formatting (Markdown)
3. Link naar gerelateerde documenten

## Event Info

- **Datum**: 24 januari 2026, 14:00+
- **Locatie**: Bij Boy Boom
- **Kosten**: €50 per persoon

---

*Laatste update: Januari 2026*
