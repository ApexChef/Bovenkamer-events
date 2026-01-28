# US-020: Dynamische Formulierelementen

## Overzicht

Alle formulierelementen in de applicatie dynamisch maken, zodat ze via de database beheerd kunnen worden in plaats van hardcoded in de code. Dit bouwt voort op het succes van US-019 (dynamische prediction questions).

## Veldnaamgeving

**Belangrijk**: We gebruiken de volgende naamgeving:
- **`category`**: Hoofdcategorie voor filteren per pagina (bijv. `predictions`, `ratings`, `registration_quiz`)
- **`section`**: Sub-groepering binnen een category (bijv. `consumption`, `social`, `criteria`, `feedback`)

Dit betekent dat de huidige `prediction_questions.category` veld hernoemd moet worden naar `section`.

## Huidige Situatie

### Wat al dynamisch is (US-019)
- **Prediction Questions**: Volledig dynamisch via `prediction_questions` tabel
  - 5 vraagtypen: `slider`, `select_participant`, `boolean`, `time`, `select_options`
  - Admin CRUD interface
  - Punten configuratie per vraag
  - Sorting en activatie toggles
  - **Let op**: `category` veld bevat nu section-waarden (`consumption`, `social`, `other`)

### Wat nog hardcoded is

#### 1. Rating Page - `/src/app/rate/page.tsx` (PRIORITEIT)

**Section: `criteria`** - 5 Star Rating vragen:
| Key | Label | Beschrijving |
|-----|-------|--------------|
| location | Locatie | Ruimte, sfeer, faciliteiten |
| hospitality | Gastvrijheid | Ontvangst, bediening, aandacht |
| fireQuality | Kwaliteit Vuurvoorziening | BBQ, vuurplaats, warmte |
| parking | Parkeergelegenheid | Ruimte, bereikbaarheid |
| overall | Algemene Organisatie | Totaalindruk van de avond |

**Section: `feedback`** - 2 Open tekstvragen:
- bestAspect: "Wat was het beste aan de locatie?"
- improvementSuggestion: "Wat kan beter?"

**Section: `verdict`** - 1 Boolean vraag + toelichting:
- isWorthy: "Is Boy Boom waardig lid van de Bovenkamer?"
- worthyExplanation: Toelichting

**Opslag**: `ratings` tabel (aparte kolommen)

#### 2. Registration Quiz (Step 3) - `src/components/forms/Step3Quiz.tsx` (LATER)
**15 open tekstvragen** gegroepeerd in sections:

| Section | Vragen | Keys |
|---------|--------|------|
| Muziek | 2 | guiltyPleasureSong, bestConcert |
| Entertainment | 2 | movieByHeart, secretSeries |
| Eten | 3 | weirdestFood, signatureDish, foodRefusal |
| Jeugd | 3 | childhoodNickname, childhoodDream, firstCar |
| Random | 3 | hiddenTalent, irrationalFear, bucketList |
| Bovenkamer | 2 | bestJKMoment, longestKnownMember |

**Opslag**: `registrations.quiz_answers` (JSONB)
**Validatie**: Minimaal 5 vragen beantwoorden

> **Note**: Registration quiz wordt later geïmplementeerd om risico op dataverlies te minimaliseren.

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

### Database Aanpassingen

#### Stap 1: Hernoem `category` naar `section` in `prediction_questions`

```sql
-- Rename category to section in existing table
ALTER TABLE prediction_questions RENAME COLUMN category TO section;

-- Add new category column for filtering by page
ALTER TABLE prediction_questions ADD COLUMN category VARCHAR(30) DEFAULT 'predictions';

-- Update indexes
DROP INDEX IF EXISTS idx_prediction_questions_category;
CREATE INDEX idx_prediction_questions_section ON prediction_questions(section);
CREATE INDEX idx_prediction_questions_category ON prediction_questions(category);
```

#### Stap 2: Uitbreiden voor nieuwe vraagtypen

De bestaande `prediction_questions` tabel wordt uitgebreid (niet vervangen) om ook ratings te ondersteunen:

```sql
-- Add new columns for extended functionality
ALTER TABLE prediction_questions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE prediction_questions ADD COLUMN IF NOT EXISTS placeholder TEXT;
ALTER TABLE prediction_questions ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Add new question types to enum/check constraint
-- type can now be: slider, select_participant, boolean, time, select_options,
--                  text_short, text_long, star_rating
```

#### Nieuwe veldwaarden

| Veld | Waarden | Beschrijving |
|------|---------|--------------|
| `category` | `predictions`, `ratings`, `registration_quiz`, `skills` | Hoofdcategorie voor API filtering |
| `section` | `consumption`, `social`, `other`, `criteria`, `feedback`, `verdict`, etc. | Sub-groepering voor UI |
| `type` | bestaande + `text_short`, `text_long`, `star_rating` | Vraagtype |

### Fasering

#### Fase 1: Rating vragen dynamisch (US-020a)
1. **Migratie**:
   - Hernoem `category` → `section` in `prediction_questions`
   - Voeg `category` kolom toe
   - Voeg nieuwe vraagtypen toe
2. **Seed data**: Rating vragen toevoegen met `category='ratings'`
3. **API**: `GET /api/questions?category=ratings`
4. **Components**:
   - `DynamicStarRating` component
   - `DynamicTextQuestion` component (voor feedback)
5. **Frontend**: Rating page refactoren naar dynamische vragen
6. **Admin**: Uitbreiden voor ratings beheer

#### Fase 2: Skills & Preferences dynamisch (LATER)
1. Migratie: Skill categorieën en opties naar database
2. Component: `DynamicCheckboxGroup` component
3. Music preferences configureerbaar maken

#### Fase 3: Registration Quiz dynamisch (LATER - voorzichtig)
1. Migratie: Quiz vragen toevoegen
2. Component: Hergebruik `DynamicTextQuestion`
3. Backward compatibility waarborgen

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
├── ?category=predictions      (bestaand, hernoemd van module)
├── ?category=ratings          (nieuw - Fase 1)
├── ?category=skills           (nieuw - Fase 2)
└── ?category=registration_quiz (nieuw - Fase 3)
```

Features per category:
- CRUD vragen
- Drag-and-drop sortering
- Preview van vraag rendering
- Activatie toggles
- Section management (sub-groepering)

## Migratie Strategie

### Data Migratie
1. Hernoem `category` → `section` in bestaande prediction_questions
2. Voeg `category` kolom toe met default `'predictions'`
3. Seed rating vragen met `category='ratings'`
4. Bestaande prediction data en antwoorden blijven intact

### Code Migratie
1. Uitbreiding bestaande `DynamicQuestion` component met nieuwe types
2. Geleidelijke vervanging van hardcoded vragen
3. Backward compatibility via fallback naar hardcoded indien DB leeg

## Deliverables (Fase 1 - Ratings)

1. **Database Migratie**:
   - Hernoem `category` → `section`
   - Voeg `category` kolom toe
   - Voeg `description`, `placeholder`, `is_required` kolommen toe
   - Seed data voor 8 rating vragen
2. **Types**: Uitbreiden met `star_rating`, `text_short`, `text_long`
3. **API Routes**:
   - `GET /api/questions?category=ratings`
   - Uitbreiden admin API voor nieuwe types
4. **Components**:
   - `DynamicStarRating` component
   - `DynamicTextQuestion` component
   - Uitbreiding `DynamicQuestion` switch
5. **Frontend**: `/rate` page refactoren
6. **Admin UI**: Category filter toevoegen

## Acceptatiecriteria (Fase 1)

- [ ] `category` en `section` velden correct geïmplementeerd
- [ ] Alle 8 rating vragen beheerbaar via admin
- [ ] Star rating component werkt correct (1-5 sterren)
- [ ] Tekst vragen (kort en lang) werken correct
- [ ] Rating page laadt vragen dynamisch uit database
- [ ] Nieuwe rating vragen kunnen worden toegevoegd zonder code wijzigingen
- [ ] Vragen kunnen worden gedeactiveerd zonder te verwijderen
- [ ] Sortering van vragen instelbaar
- [ ] Bestaande prediction questions blijven werken
