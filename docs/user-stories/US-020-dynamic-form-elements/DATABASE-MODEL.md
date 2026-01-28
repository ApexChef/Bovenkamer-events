# US-020: Database Model - Dynamic Forms

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌──────────────────┐         ┌──────────────────────┐                         │
│  │      forms       │         │    form_versions     │                         │
│  ├──────────────────┤         ├──────────────────────┤                         │
│  │ id (PK)          │────┐    │ id (PK)              │                         │
│  │ key (unique)     │    │    │ form_id (FK)         │◄────┐                   │
│  │ name             │    └───►│ version_number       │     │                   │
│  │ description      │         │ is_published         │     │                   │
│  │ active_version_id│─────────│ published_at         │     │                   │
│  │ created_at       │    ▲    │ created_at           │     │                   │
│  │ updated_at       │    │    │ updated_at           │     │                   │
│  └──────────────────┘    │    └──────────────────────┘     │                   │
│                          │              │                   │                   │
│                          │              │ 1:N               │                   │
│                          │              ▼                   │                   │
│                          │    ┌──────────────────────┐     │                   │
│                          │    │   form_questions     │     │                   │
│                          │    ├──────────────────────┤     │                   │
│                          │    │ id (PK)              │     │                   │
│                          │    │ form_version_id (FK) │─────┘                   │
│                          │    │ key                  │                         │
│                          │    │ label                │                         │
│                          │    │ description          │                         │
│                          │    │ placeholder          │                         │
│                          │    │ type                 │                         │
│                          │    │ section              │                         │
│                          │    │ options (JSONB)      │                         │
│                          │    │ is_required          │                         │
│                          │    │ sort_order           │                         │
│                          │    │ is_active            │                         │
│                          │    │ points_exact         │                         │
│                          │    │ points_close         │                         │
│                          │    │ points_direction     │                         │
│                          │    │ created_at           │                         │
│                          │    │ updated_at           │                         │
│                          │    └──────────────────────┘                         │
│                          │              │                                       │
│                          │              │ 1:N                                   │
│                          │              ▼                                       │
│  ┌──────────────────┐    │    ┌──────────────────────┐                         │
│  │      users       │    │    │    form_answers      │                         │
│  ├──────────────────┤    │    ├──────────────────────┤                         │
│  │ id (PK)          │────┼───►│ id (PK)              │                         │
│  │ ...              │    │    │ user_id (FK)         │                         │
│  └──────────────────┘    │    │ form_version_id (FK) │◄────────────────────────┘
│                          │    │ question_id (FK)     │
│                          │    │                      │
│                          │    │ -- Flexible answer storage --
│                          │    │ answer_text          │  (for text_short, text_long)
│                          │    │ answer_number        │  (for slider, star_rating)
│                          │    │ answer_boolean       │  (for boolean)
│                          │    │ answer_json          │  (for complex: arrays, objects)
│                          │    │ answer_participant_id│  (for select_participant)
│                          │    │                      │
│                          │    │ created_at           │
│                          │    │ updated_at           │
│                          │    └──────────────────────┘
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tabel Definities

### 1. `forms` - Hoofdformulier definitie

```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificatie
  key VARCHAR(50) UNIQUE NOT NULL,      -- 'predictions', 'ratings', 'registration_quiz'
  name VARCHAR(100) NOT NULL,            -- 'Voorspellingen', 'Boy Boom Beoordeling'
  description TEXT,

  -- Actieve versie
  active_version_id UUID,               -- FK naar form_versions (nullable voor nieuwe forms)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_forms_key ON forms(key);
```

**Voorbeelddata:**
| key | name | description |
|-----|------|-------------|
| predictions | Voorspellingen | Voorspellingen voor de BBQ avond |
| ratings | Boy Boom Beoordeling | Beoordeling van de locatie en gastheer |
| registration_quiz | Registratie Quiz | Persoonlijke vragen voor de quiz |

---

### 2. `form_versions` - Versioning van formulieren

```sql
CREATE TABLE form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,

  -- Versioning
  version_number INTEGER NOT NULL,       -- 1, 2, 3, ...
  is_published BOOLEAN DEFAULT false,    -- true = kan worden ingevuld
  published_at TIMESTAMPTZ,              -- wanneer gepubliceerd

  -- Metadata
  changelog TEXT,                        -- Beschrijving van wijzigingen

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(form_id, version_number)
);

-- Indexes
CREATE INDEX idx_form_versions_form ON form_versions(form_id);
CREATE INDEX idx_form_versions_published ON form_versions(form_id, is_published);
```

**Versioning Flow:**
```
form: "ratings" (v1 active)
├── version 1 (published, active) ─── questions v1
├── version 2 (draft)             ─── questions v2 (bewerken)
└── version 3 (niet aangemaakt)
```

---

### 3. `form_questions` - Vragen per versie

```sql
CREATE TABLE form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent
  form_version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,

  -- Identificatie
  key VARCHAR(50) NOT NULL,              -- 'location', 'wineBottles', etc.

  -- Display
  label TEXT NOT NULL,                   -- Vraag tekst
  description TEXT,                      -- Extra uitleg
  placeholder TEXT,                      -- Placeholder voor input

  -- Type & Classificatie
  type VARCHAR(30) NOT NULL,             -- Question type (zie enum)
  section VARCHAR(50),                   -- Sub-groepering: 'criteria', 'consumption', etc.

  -- Type-specifieke opties
  options JSONB DEFAULT '{}',

  -- Validatie
  is_required BOOLEAN DEFAULT false,

  -- Ordering & Status
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Scoring (voor predictions/quiz)
  points_exact INTEGER DEFAULT 0,
  points_close INTEGER DEFAULT 0,
  points_direction INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(form_version_id, key)           -- Key moet uniek zijn binnen versie
);

-- Indexes
CREATE INDEX idx_form_questions_version ON form_questions(form_version_id);
CREATE INDEX idx_form_questions_section ON form_questions(form_version_id, section);
CREATE INDEX idx_form_questions_sort ON form_questions(form_version_id, sort_order);
```

**Question Types:**
```typescript
type FormQuestionType =
  // Numeric
  | 'slider'           // Range slider
  | 'star_rating'      // 1-5 sterren

  // Text
  | 'text_short'       // Korte tekst (max ~100 chars)
  | 'text_long'        // Textarea

  // Selection
  | 'select_options'   // Dropdown met opties
  | 'select_participant' // Dropdown met deelnemers
  | 'boolean'          // Ja/Nee

  // Special
  | 'time'             // Tijdselectie
  | 'checkbox_group'   // Multi-select
  | 'radio_group';     // Single select (styled)
```

---

### 4. `form_answers` - Antwoorden van gebruikers

```sql
CREATE TABLE form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_version_id UUID NOT NULL REFERENCES form_versions(id),
  question_id UUID NOT NULL REFERENCES form_questions(id),

  -- Flexible Answer Storage (één veld per type)
  answer_text TEXT,                      -- text_short, text_long
  answer_number NUMERIC,                 -- slider, star_rating, time
  answer_boolean BOOLEAN,                -- boolean
  answer_json JSONB,                     -- checkbox_group, complex answers
  answer_participant_id UUID             -- select_participant
    REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, question_id)           -- Één antwoord per vraag per user
);

-- Indexes
CREATE INDEX idx_form_answers_user ON form_answers(user_id);
CREATE INDEX idx_form_answers_version ON form_answers(form_version_id);
CREATE INDEX idx_form_answers_question ON form_answers(question_id);
CREATE INDEX idx_form_answers_user_version ON form_answers(user_id, form_version_id);
```

**Answer Storage per Type:**
| Question Type | Opslag Veld | Voorbeeld |
|---------------|-------------|-----------|
| `text_short` | answer_text | "Amsterdam" |
| `text_long` | answer_text | "De sfeer was geweldig..." |
| `slider` | answer_number | 15 |
| `star_rating` | answer_number | 4 |
| `time` | answer_number | 10 (= 00:00) |
| `boolean` | answer_boolean | true |
| `select_options` | answer_text | "champagne" |
| `select_participant` | answer_participant_id | UUID |
| `checkbox_group` | answer_json | ["option1", "option2"] |

---

## Foreign Key met Active Version

```sql
-- Voeg FK constraint toe nadat beide tabellen bestaan
ALTER TABLE forms
  ADD CONSTRAINT fk_forms_active_version
  FOREIGN KEY (active_version_id)
  REFERENCES form_versions(id);
```

---

## Query Voorbeelden

### Haal actieve vragen op voor een formulier

```sql
SELECT fq.*
FROM forms f
JOIN form_versions fv ON fv.id = f.active_version_id
JOIN form_questions fq ON fq.form_version_id = fv.id
WHERE f.key = 'ratings'
  AND fq.is_active = true
ORDER BY fq.sort_order;
```

### Haal alle antwoorden van een gebruiker op

```sql
SELECT
  fq.key,
  fq.label,
  fq.type,
  fa.answer_text,
  fa.answer_number,
  fa.answer_boolean,
  fa.answer_json,
  fa.answer_participant_id
FROM form_answers fa
JOIN form_questions fq ON fq.id = fa.question_id
WHERE fa.user_id = $1
  AND fa.form_version_id = $2;
```

### Sla een antwoord op (upsert)

```sql
INSERT INTO form_answers (user_id, form_version_id, question_id, answer_number)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, question_id)
DO UPDATE SET
  answer_number = EXCLUDED.answer_number,
  updated_at = NOW();
```

---

## Migratie van Bestaande Data

### Van `prediction_questions` naar `form_questions`

```sql
-- 1. Maak forms record
INSERT INTO forms (key, name, description)
VALUES ('predictions', 'Voorspellingen', 'Voorspellingen voor de BBQ avond');

-- 2. Maak form_version record
INSERT INTO form_versions (form_id, version_number, is_published, published_at)
SELECT id, 1, true, NOW() FROM forms WHERE key = 'predictions';

-- 3. Update forms.active_version_id
UPDATE forms f SET active_version_id = fv.id
FROM form_versions fv WHERE fv.form_id = f.id AND f.key = 'predictions';

-- 4. Migreer questions
INSERT INTO form_questions (
  form_version_id, key, label, type, section, options,
  points_exact, points_close, points_direction, is_active, sort_order
)
SELECT
  fv.id,
  pq.key,
  pq.label,
  pq.type,
  pq.category,  -- wordt section
  pq.options,
  pq.points_exact,
  pq.points_close,
  pq.points_direction,
  pq.is_active,
  pq.sort_order
FROM prediction_questions pq
CROSS JOIN (
  SELECT fv.id FROM form_versions fv
  JOIN forms f ON f.id = fv.form_id
  WHERE f.key = 'predictions'
) fv;
```

### Van `registrations.predictions` JSONB naar `form_answers`

```sql
-- Migreer bestaande prediction antwoorden
INSERT INTO form_answers (user_id, form_version_id, question_id, answer_number, answer_text, answer_boolean)
SELECT
  r.user_id,
  fv.id,
  fq.id,
  CASE
    WHEN fq.type IN ('slider', 'time') THEN (r.predictions->fq.key)::numeric
    WHEN fq.type = 'star_rating' THEN (r.predictions->fq.key)::numeric
  END,
  CASE
    WHEN fq.type IN ('text_short', 'text_long', 'select_options', 'select_participant')
    THEN r.predictions->>fq.key
  END,
  CASE
    WHEN fq.type = 'boolean' THEN (r.predictions->fq.key)::boolean
  END
FROM registrations r
CROSS JOIN (
  SELECT fv.id FROM form_versions fv
  JOIN forms f ON f.id = fv.form_id
  WHERE f.key = 'predictions'
) fv
JOIN form_questions fq ON fq.form_version_id = fv.id
WHERE r.predictions IS NOT NULL
  AND r.predictions ? fq.key;
```

---

## Voordelen van dit Model

| Aspect | Voordeel |
|--------|----------|
| **Versioning** | Formulieren kunnen worden bijgewerkt zonder bestaande antwoorden te verliezen |
| **Flexibiliteit** | Nieuwe formulieren toevoegen zonder code wijzigingen |
| **Data Integriteit** | Antwoorden blijven gekoppeld aan specifieke versie |
| **Query Performance** | Genormaliseerde antwoorden, geen JSONB parsing nodig |
| **Type Safety** | Aparte kolommen per antwoord-type |
| **Audit Trail** | Versie historie behouden |
| **Rollback** | Actieve versie kan worden teruggedraaid |
