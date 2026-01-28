# US-020: Dynamische Formulierelementen

## Overzicht

Alle formulierelementen in de applicatie dynamisch maken, zodat ze via de database beheerd kunnen worden in plaats van hardcoded in de code. Dit bouwt voort op het succes van US-019 (dynamische prediction questions).

## Huidige Situatie

### Wat al dynamisch is (US-019)
- **Prediction Questions**: Volledig dynamisch via `prediction_questions` tabel
  - 5 vraagtypen: `slider`, `select_participant`, `boolean`, `time`, `select_options`
  - Admin CRUD interface
  - Punten configuratie per vraag
  - Sorting en activatie toggles

### Wat nog hardcoded is

#### 1. Registration Quiz (Step 3) - `src/components/forms/Step3Quiz.tsx`
**15 open tekstvragen** gegroepeerd in categorieën:

| Categorie | Vragen | Keys |
|-----------|--------|------|
| Muziek | 2 | guiltyPleasureSong, bestConcert |
| Entertainment | 2 | movieByHeart, secretSeries |
| Eten | 3 | weirdestFood, signatureDish, foodRefusal |
| Jeugd | 3 | childhoodNickname, childhoodDream, firstCar |
| Random | 3 | hiddenTalent, irrationalFear, bucketList |
| Bovenkamer | 2 | bestJKMoment, longestKnownMember |

**Opslag**: `registrations.quiz_answers` (JSONB)
**Validatie**: Minimaal 5 vragen beantwoorden

#### 2. Rating Page - `/src/app/rate/page.tsx`
**5 Star Rating vragen**:
| Key | Label | Beschrijving |
|-----|-------|--------------|
| location | Locatie | Ruimte, sfeer, faciliteiten |
| hospitality | Gastvrijheid | Ontvangst, bediening, aandacht |
| fireQuality | Kwaliteit Vuurvoorziening | BBQ, vuurplaats, warmte |
| parking | Parkeergelegenheid | Ruimte, bereikbaarheid |
| overall | Algemene Organisatie | Totaalindruk van de avond |

**2 Open tekstvragen**:
- bestAspect: "Wat was het beste aan de locatie?"
- improvementSuggestion: "Wat kan beter?"

**1 Boolean vraag + toelichting**:
- isWorthy: "Is Boy Boom waardig lid van de Bovenkamer?"
- worthyExplanation: Toelichting

**Opslag**: `ratings` tabel (aparte kolommen)

#### 3. Skill Categories - `src/types/index.ts`
**8 categorieën** met elk 5 opties (40 items totaal):
- food_prep, bbq_grill, drinks, entertainment, atmosphere, social, cleanup, documentation

**Opslag**: `registrations.skills` (JSONB) + `food_drink_preferences.skills`

#### 4. Music Preferences - `src/types/index.ts`
- **4 Decades**: 80s, 90s, 00s, 10s
- **10 Genres**: Pop, Rock, Dance, Hip-Hop, etc.

## Voorgestelde Oplossing

### Nieuwe Vraagtypen toevoegen

Uitbreiding van `PredictionQuestionType` naar universeel `DynamicQuestionType`:

```typescript
export type DynamicQuestionType =
  // Bestaand (US-019)
  | 'slider'
  | 'select_participant'
  | 'boolean'
  | 'time'
  | 'select_options'

  // Nieuw voor Registration Quiz
  | 'text_short'          // Korte tekst (max 100 chars)
  | 'text_long'           // Textarea (geen max)

  // Nieuw voor Ratings
  | 'star_rating'         // 1-5 sterren

  // Nieuw voor Skills/Preferences
  | 'checkbox_group'      // Multi-select checkboxes
  | 'radio_group'         // Single select radio buttons (styled)
```

### Database: `dynamic_questions` tabel

```sql
CREATE TABLE dynamic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificatie
  key VARCHAR(50) UNIQUE NOT NULL,

  -- Display
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,

  -- Classificatie
  type VARCHAR(30) NOT NULL,
  module VARCHAR(30) NOT NULL,  -- 'predictions', 'registration_quiz', 'ratings', 'skills'
  category VARCHAR(50),          -- Voor groepering binnen module

  -- Type-specifieke opties (JSONB)
  options JSONB DEFAULT '{}',

  -- Validatie
  is_required BOOLEAN DEFAULT false,
  min_selections INTEGER,        -- Voor checkbox_group
  max_selections INTEGER,

  -- Scoring (voor predictions/quiz)
  points_exact INTEGER DEFAULT 0,
  points_close INTEGER DEFAULT 0,
  points_direction INTEGER DEFAULT 0,

  -- Status & Ordering
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dynamic_questions_module ON dynamic_questions(module);
CREATE INDEX idx_dynamic_questions_active ON dynamic_questions(is_active);
CREATE INDEX idx_dynamic_questions_sort ON dynamic_questions(module, sort_order);
```

### Fasering

#### Fase 1: Registration Quiz dynamisch (Quick Win)
1. Migratie: Quiz vragen toevoegen aan `dynamic_questions`
2. API: `GET /api/questions?module=registration_quiz`
3. Component: Generieke `DynamicTextQuestion` component
4. Admin: Uitbreiden admin panel voor quiz vragen beheer

#### Fase 2: Rating vragen dynamisch
1. Migratie: Rating criteria naar `dynamic_questions`
2. Component: `DynamicStarRating` component
3. API aanpassen om dynamische vragen te laden
4. Backward compatibility met bestaande `ratings` tabel

#### Fase 3: Skills & Preferences dynamisch
1. Migratie: Skill categorieën en opties naar database
2. Component: `DynamicCheckboxGroup` component
3. Music preferences configureerbaar maken

### Type Opties per Vraagtype

```typescript
// text_short / text_long
interface TextOptions {
  type: 'text_short' | 'text_long';
  maxLength?: number;
  rows?: number;  // alleen voor text_long
}

// star_rating
interface StarRatingOptions {
  type: 'star_rating';
  maxStars: number;  // default 5
  showLabels?: boolean;
}

// checkbox_group
interface CheckboxGroupOptions {
  type: 'checkbox_group';
  choices: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
  columns?: number;  // grid layout
}

// radio_group
interface RadioGroupOptions {
  type: 'radio_group';
  choices: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: string;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
}
```

## Admin Interface

Uitbreiding van bestaand prediction questions admin panel:

```
/admin/questions
├── ?module=predictions      (bestaand)
├── ?module=registration_quiz (nieuw)
├── ?module=ratings          (nieuw)
└── ?module=skills           (nieuw)
```

Features per module:
- CRUD vragen
- Drag-and-drop sortering
- Preview van vraag rendering
- Activatie toggles
- Categorie management

## Migratie Strategie

### Data Migratie
1. Seed nieuwe vragen in `dynamic_questions` met exact dezelfde keys
2. Geen wijzigingen aan opslag (JSONB blijft JSONB)
3. Bestaande data blijft werken

### Code Migratie
1. Nieuwe generieke `DynamicQuestion` component (uitbreiding van bestaande)
2. Geleidelijke vervanging van hardcoded vragen
3. Backward compatibility via fallback naar hardcoded indien DB leeg

## Deliverables

1. **Database**: `dynamic_questions` tabel + migraties
2. **API Routes**:
   - `GET /api/questions?module={module}`
   - `GET/POST/PUT/DELETE /api/admin/questions`
3. **Components**:
   - Uitgebreide `DynamicQuestion` component
   - Nieuwe vraagtype componenten
4. **Admin UI**: Uitgebreid questions management
5. **Migraties**: Seed data voor alle huidige hardcoded vragen

## Acceptatiecriteria

- [ ] Alle 15 registration quiz vragen beheerbaar via admin
- [ ] Alle 8 rating vragen beheerbaar via admin
- [ ] Nieuwe vragen kunnen worden toegevoegd zonder code wijzigingen
- [ ] Vragen kunnen worden gedeactiveerd zonder te verwijderen
- [ ] Sortering van vragen instelbaar
- [ ] Preview functionaliteit in admin panel
- [ ] Backward compatibility met bestaande data
