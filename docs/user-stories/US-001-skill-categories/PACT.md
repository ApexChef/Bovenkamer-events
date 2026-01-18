# PACT Analyse: US-001 - Skill Categorieën

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Uitbreiding van skill selectie van 1 veld naar 8 categorieën |
| **Scope** | Registratieformulier stap 2, database, types |
| **Prioriteit** | Hoog (#2 in volgorde) |
| **Complexiteit** | Laag-Medium |

### Functionele Requirements
1. **FR-001.1**: 8 skill categorieën tonen in registratie stap 2
2. **FR-001.2**: Per categorie exact 1 skill selecteerbaar
3. **FR-001.3**: Elke categorie bevat "Niks" optie
4. **FR-001.4**: Bestaand `additionalSkills` vrij tekstveld behouden
5. **FR-001.5**: Selecties opslaan in database

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| 8 categorieën met opties | Skill matching algoritme |
| Formulier UI updates | Admin skill management |
| Database schema wijzigingen | Skill statistieken dashboard |
| Type definities | Skill-gebaseerde notificaties |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| Bestaande registratie flow | Intern | Beschikbaar |
| `Step2Skills.tsx` component | Intern | Aan te passen |
| Supabase `registrations` tabel | Database | Aan te passen |
| `types/index.ts` | Types | Aan te passen |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Breaking change bestaande registraties | Hoog | Laag | App nog niet live |
| UI te druk met 8 categorieën | Medium | Medium | Accordion/collapsible design |
| Performance bij veel opties | Laag | Laag | Static data, geen API calls |

### Aannames
1. App is nog niet live, geen migratie nodig
2. Alle 8 categorieën zijn verplicht (maar "Niks" is valide keuze)
3. Skill labels zijn definitief (geen i18n nodig)

### Data Mapping (Oud → Nieuw)
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

---

## ARCHITECTURE

### Component Structuur

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

### Data Model

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

### UI Pattern

| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| **Grid (2x4)** | Alles zichtbaar, snel invullen | Veel scroll op mobiel |
| **Accordion** | Compact, focus per categorie | Meer clicks nodig |
| **Hybrid** | Grid op desktop, accordion mobiel | Complexere implementatie |

**Beslissing**: Grid (2x4) met responsive collapse naar 1 kolom op mobiel.

---

## CODE

*Nog niet uitgewerkt - volgt na Architecture review*

---

## TEST

*Nog niet uitgewerkt - volgt na Code implementatie*
