# PACT Analyse: US-002 - Uitgebreide Profielvelden

> **PACT Framework**: Prepare, Architecture, Code, Test

---

## PREPARE

### Requirements Samenvatting
| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Extra profielvelden voor betere analyses en rapportage |
| **Scope** | Registratieformulier, database, types |
| **Prioriteit** | Hoog (#3 in volgorde) |
| **Complexiteit** | Medium |

### Functionele Requirements
1. **FR-002.1**: `birthDate` veld met datum picker (soft 40+ validatie)
2. **FR-002.2**: `gender` select (Man/Vrouw/Anders/Zeg ik niet)
3. **FR-002.3**: `selfConfidence` slider (1-10)
4. **FR-002.4**: `jkvJoinYear` select (1990-2025)
5. **FR-002.5**: `jkvExitYear` select (2000-2030 of "Nog actief")
6. **FR-002.6**: `bovenkamerJoinYear` (berekend/bevestigd)
7. **FR-002.7**: `borrelAttendance2025` multi-select (10 datums)
8. **FR-002.8**: `borrelPlanning2026` multi-select (10 datums)
9. **FR-002.9**: Validatie `jkvExitYear >= jkvJoinYear`

### Scope Afbakening
| In Scope | Buiten Scope |
|----------|--------------|
| Alle nieuwe velden in formulier | Automatische borrel tracking |
| Database schema uitbreiding | JKV API integratie |
| Validaties (soft en hard) | Historische data import |
| Borrel datums 2025 & 2026 | Borrel planning 2027+ |

### Afhankelijkheden
| Dependency | Type | Status |
|------------|------|--------|
| US-001 (skill categorieën) | User Story | Eerst implementeren |
| `Step1Personal.tsx` component | Intern | Aan te passen |
| Mogelijk nieuwe stap component | Intern | Te maken |
| Zustand registration store | State | Aan te passen |

### Risico's & Mitigatie
| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Formulier te lang | Medium | Hoog | Split in substappen of accordion |
| Gevoelige data (geboortedatum) | Medium | Medium | Privacy notice toevoegen |
| Borrel datums incorrect | Laag | Laag | Hardcoded static data |
| JKV/Bovenkamer verwarrend | Medium | Medium | Duidelijke uitleg/tooltips |

### Aannames
1. Borrel datums zijn elke 4e donderdag (behalve juli/december)
2. Bovenkamer = JKV alumni (40+)
3. "Nog actief in JKV" = nog geen Bovenkamer lid
4. Soft validatie = waarschuwing, niet blokkerend

### Borrel Data (Hardcoded)
```typescript
const BORRELS_2025 = [
  { date: '2025-01-23', label: '23 januari 2025' },
  { date: '2025-02-27', label: '27 februari 2025' },
  { date: '2025-03-27', label: '27 maart 2025' },
  { date: '2025-04-24', label: '24 april 2025' },
  { date: '2025-05-22', label: '22 mei 2025' },
  { date: '2025-06-26', label: '26 juni 2025' },
  // juli vervalt
  { date: '2025-08-28', label: '28 augustus 2025' },
  { date: '2025-09-25', label: '25 september 2025' },
  { date: '2025-10-23', label: '23 oktober 2025' },
  { date: '2025-11-27', label: '27 november 2025' },
  // december vervalt
];

const BORRELS_2026 = [
  { date: '2026-01-22', label: '22 januari 2026' },
  { date: '2026-02-26', label: '26 februari 2026' },
  { date: '2026-03-26', label: '26 maart 2026' },
  { date: '2026-04-23', label: '23 april 2026', note: 'Meivakantie' },
  { date: '2026-05-28', label: '28 mei 2026' },
  { date: '2026-06-25', label: '25 juni 2026' },
  // juli vervalt
  { date: '2026-08-27', label: '27 augustus 2026' },
  { date: '2026-09-24', label: '24 september 2026' },
  { date: '2026-10-22', label: '22 oktober 2026', note: 'Herfstvakantie' },
  { date: '2026-11-26', label: '26 november 2026' },
  // december vervalt
];
```

---

## ARCHITECTURE

### Profiel Secties Overzicht

US-002 velden worden verdeeld over meerdere profiel secties (zie US-007):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROFIEL SECTIES MAPPING                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Sectie "Personal" (50 pts)       Sectie "JKV Historie" (30 pts)        │
│  ┌─────────────────────────┐     ┌─────────────────────────┐           │
│  │ • birthDate             │     │ • jkvJoinYear           │           │
│  │ • gender                │     │ • jkvExitYear           │           │
│  │ • hasPartner            │     │ • bovenkamerJoinYear    │           │
│  │ • partnerName           │     │   (berekend)            │           │
│  │ • selfConfidence        │     │                         │           │
│  └─────────────────────────┘     └─────────────────────────┘           │
│                                                                          │
│  Sectie "Borrel Stats" (30 pts)                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ • borrelAttendance2025 (multi-select, 10 datums)            │       │
│  │ • borrelPlanning2026 (multi-select, 10 datums)              │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Validatie Architectuur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      VALIDATIE REGELS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  birthDate                                                               │
│  ├── Format: YYYY-MM-DD                                                 │
│  ├── Hard: Niet in toekomst                                             │
│  └── Soft: Leeftijd < 40 → Waarschuwing (niet blokkerend)              │
│                                                                          │
│  JKV Jaren                                                               │
│  ├── jkvExitYear >= jkvJoinYear (hard)                                  │
│  ├── jkvExitYear = "Nog actief" → bovenkamerJoinYear = null            │
│  └── jkvExitYear != "Nog actief" → bovenkamerJoinYear = jkvExitYear    │
│                                                                          │
│  Borrel Selectie                                                        │
│  ├── 2025: Alleen datums in verleden selecteerbaar                     │
│  └── 2026: Alle datums selecteerbaar                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interactie

```
PersonalSection                    JKVSection
     │                                  │
     ▼                                  ▼
┌─────────────┐                   ┌─────────────┐
│ DatePicker  │                   │ YearSelect  │──┐
│ (birthDate) │                   │ (joinYear)  │  │
└─────────────┘                   └─────────────┘  │
                                        │          │
                                        ▼          │ Auto-calculate
                                  ┌─────────────┐  │
                                  │ YearSelect  │  │
                                  │ (exitYear)  │──┤
                                  └─────────────┘  │
                                        │          │
                                        ▼          ▼
                                  ┌─────────────────────┐
                                  │ bovenkamerJoinYear  │
                                  │ (readonly/derived)  │
                                  └─────────────────────┘
```

---

## CODE

### Geïmplementeerde Bestanden

| Bestand | Wijzigingen |
|---------|-------------|
| `src/types/index.ts` | Nieuwe types: GENDER_OPTIONS, JKV_JOIN_YEARS, JKV_EXIT_YEARS, BORRELS_2025, BORRELS_2026 |
| `src/lib/store.ts` | ProfileSections uitgebreid met jkvHistorie en borrelStats, nieuwe velden in formData |
| `src/app/profile/page.tsx` | Drie nieuwe secties: Personal (uitgebreid), JKV Historie, Borrel Stats |

### Nieuwe Velden in Store
```typescript
// Personal section
birthDate: string;       // YYYY-MM-DD format
gender: string;          // man | vrouw | anders | zeg_ik_niet
selfConfidence: number;  // 1-10

// JKV Historie section
jkvJoinYear: number | null;
jkvExitYear: number | string | null;  // number or 'nog_actief'
bovenkamerJoinYear: number | null;    // Calculated from jkvExitYear

// Borrel Stats section
borrelAttendance2025: string[];  // Array of date strings
borrelPlanning2026: string[];    // Array of date strings
```

### Section Points
```typescript
SECTION_POINTS = {
  basic: 10,
  personal: 50,
  skills: 40,
  music: 20,
  jkvHistorie: 30,
  borrelStats: 30,
  quiz: 80,
}
// TOTAL: 260 punten
```

### Features Geïmplementeerd
- [x] Geboortedatum met soft validatie (40+ waarschuwing)
- [x] Geslacht select (4 opties)
- [x] Zelfvertrouwen slider (1-10 met emoji feedback)
- [x] JKV lid sinds / gestopt jaren
- [x] "Nog actief in JKV" optie
- [x] Automatische Bovenkamer join year berekening
- [x] Borrel 2025 attendance checkboxes (10 datums)
- [x] Borrel 2026 planning checkboxes (10 datums met vakantie notities)

---

## TEST

### Handmatige Test Checklist
- [ ] Personal sectie: geboortedatum invullen
- [ ] Personal sectie: 40+ waarschuwing testen met jonge datum
- [ ] Personal sectie: geslacht selecteren
- [ ] Personal sectie: zelfvertrouwen slider + emoji
- [ ] JKV Historie: join jaar selecteren
- [ ] JKV Historie: exit jaar > join jaar validatie
- [ ] JKV Historie: "Nog actief" optie
- [ ] Borrel Stats: 2025 borrels aanvinken
- [ ] Borrel Stats: 2026 planning aanvinken
- [ ] Profile completion percentage correct berekend
