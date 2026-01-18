# Feature Backlog

Dit document bevat een overzicht van de feature backlog voor de Bovenkamer Winterproef.

## Status Overzicht

| Categorie | Status |
|-----------|--------|
| **Authenticatie** | ✅ Geïmplementeerd |
| **Vaardigheden** | 📋 In User Stories |
| **Spelletjes** | 📋 In User Stories |
| **Muziek Wizard** | ⏳ Backlog |
| **Betaalmodule** | 📋 [Aparte specificatie](../payments/README.md) |

## Documentatie

| Document | Beschrijving |
|----------|--------------|
| [FEATURES.md](./FEATURES.md) | Complete feature backlog |
| [User Stories](../user-stories/README.md) | Gestructureerde user stories |

## Prioriteit Matrix

### Hoge Prioriteit 🔴

| Feature | Status | Locatie |
|---------|--------|---------|
| Progressieve Registratie | 📋 Gepland | [US-007](../user-stories/US-007-progressive-registration/) |
| Skill Categorieën | 📋 Gepland | [US-001](../user-stories/US-001-skill-categories/) |
| Uitgebreide Profielvelden | 📋 Gepland | [US-002](../user-stories/US-002-profile-fields/) |
| Betaalmodule | 📋 Gepland | [Payments](../payments/) |

### Medium Prioriteit 🟡

| Feature | Status | Locatie |
|---------|--------|---------|
| Burger Stack Game | 📋 Gepland | [US-005](../user-stories/US-005-burger-stack/) |
| Sarcastisch Dashboard | 📋 Gepland | [US-003](../user-stories/US-003-sarcastic-dashboard/) |
| Muziek Wizard | ⏳ Backlog | [FEATURES.md](./FEATURES.md) |

### Lage Prioriteit 🟢

| Feature | Status | Locatie |
|---------|--------|---------|
| Awards Systeem | 📋 Gepland | [US-006](../user-stories/US-006-awards/) |
| Foto Challenge | ⏳ Backlog | [FEATURES.md](./FEATURES.md) |
| Spotify Integratie | ⏳ Backlog | [FEATURES.md](./FEATURES.md) |

## Feature Categorieën

### 🎯 Vaardigheden

Uitbreiding van skill selectie naar meerdere categorieën:

| Categorie | Voorbeeld Skills |
|-----------|------------------|
| Culinair | Koken, BBQ, Salades |
| Dranken | Wijn, Bier, Cocktails |
| Sfeer | Vuur maken, DJ-en, Decoratie |
| Entertainment | Spelletjes, Foto's |
| Praktisch | Afwassen, Organiseren |

Zie: [US-001 Skill Categories](../user-stories/US-001-skill-categories/)

### 🎮 Spelletjes

Mobiele spelletjes voor tijdens het event:

| Spel | Prioriteit | Status |
|------|------------|--------|
| Burger Stack | Hoog | [US-005](../user-stories/US-005-burger-stack/) |
| Leugen Detectie | Hoog | Backlog |
| Bovenkamer Bingo | Hoog | Backlog |
| Speed Matching | Medium | Backlog |
| Foto Challenge | Laag | Backlog |
| Hot Takes | Laag | Backlog |

### 🎵 Muziek

Playlist generatie en live features:

- Vibe Check (swipe interface)
- Energie Curve per tijdslot
- Guilty Pleasures selectie
- No-Go Zone (blacklist)
- Live Requests tijdens feest
- Spotify integratie

### 💰 Betalingen

Tikkie integratie voor betalingen:

Zie: [Payments Module](../payments/)

## Relaties

```
Feature Backlog
     │
     ├─► User Stories (gestructureerd)
     │   ├─► US-001 Skills
     │   ├─► US-002 Profielvelden
     │   ├─► US-003 Dashboard
     │   ├─► US-005 Burger Stack
     │   ├─► US-006 Awards
     │   └─► US-007 Progressieve Registratie
     │
     ├─► Payments Module (apart gepland)
     │
     └─► Overige Features (backlog)
         ├─► Muziek Wizard
         ├─► Extra Spelletjes
         └─► Spotify Integratie
```

## Gerelateerde Documentatie

- [User Stories](../user-stories/README.md) - Gestructureerde feature specs
- [Payments](../payments/README.md) - Betaalmodule
- [CLAUDE.md](../../CLAUDE.md) - Project overzicht
