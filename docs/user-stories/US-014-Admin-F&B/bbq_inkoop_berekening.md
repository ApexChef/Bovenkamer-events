# Menu & Inkoopberekening - Dynamisch Systeem

## Overzicht

Dit systeem genereert een **volledige boodschappenlijst** op basis van een menu met gangen. Het is niet gebonden aan een specifiek type event - het werkt voor een BBQ, een diner, een lunch, of elk ander eetmoment.

De structuur is:

```
Event (bijv. "Nieuwjaars BBQ 2026", type: BBQ)
  └── Gang 1: Aperitief
  │     ├── Bubbels
  │     └── Borrelhapjes
  └── Gang 2: Voorgerecht
  │     └── Carpaccio
  └── Gang 3: Hoofdgerecht
  │     ├── Picanha (protein)
  │     ├── Kipsate (protein)
  │     ├── Hele zalm (protein)
  │     ├── Courgette van de grill (side)
  │     └── Stokbrood (fixed)
  └── Gang 4: Dessert
        └── Ananas van de grill
```

De admin definieert het menu. Het systeem berekent op basis van deelnemersvoorkeuren hoeveel er ingekocht moet worden.

---

## Databaseschema

### 1. Events (`events`)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- bijv. "Nieuwjaars BBQ 2026"
  event_type TEXT NOT NULL,                  -- bijv. "bbq", "diner", "lunch", "borrel"
  event_date DATE,
  total_persons INT,                         -- kan ook dynamisch berekend worden
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Gangen (`event_courses`)

Elke gang heeft een eigen portiegrootte per persoon.

```sql
CREATE TABLE event_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- bijv. "Aperitief", "Hoofdgerecht", "Dessert"
  sort_order INT NOT NULL DEFAULT 0,
  grams_per_person INT NOT NULL,             -- hoeveel gram eetbaar per persoon voor deze gang
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Typische waardes per gangtype:**

| Gang | grams_per_person | Toelichting |
|------|-----------------|-------------|
| Aperitief | 80 | Borrelhapjes, nootjes |
| Voorgerecht | 120 | Lichte portie |
| Hoofdgerecht | 450 | Eiwitten + bijlagen |
| Dessert | 150 | Nagerecht |

De admin bepaalt dit per gang - een BBQ-hoofdgerecht is zwaarder dan een dinervoorgerecht.

### 3. Menu-items (`menu_items`)

Elk gerecht of product binnen een gang.

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES event_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- bijv. "Picanha", "Ananas van de grill"

  -- Berekeningstype
  item_type TEXT NOT NULL CHECK (item_type IN (
    'protein',    -- eiwit: verdeling via meat_distribution voorkeuren
    'side',       -- bijgerecht: evenredig verdeeld over sides in de gang
    'fixed'       -- vast item: eigen grams_per_person
  )),

  -- Categorie (voor protein-items: koppeling met meat_distribution)
  category TEXT CHECK (category IN (
    'pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian',
    'fruit', 'vegetables', 'salad', 'bread', 'sauce', 'dairy', 'other'
  )),

  -- Inkoopberekening
  yield_percentage NUMERIC(5,2) NOT NULL,      -- bijv. 85.00 (= 85% eetbaar)
  waste_description TEXT,                       -- bijv. "Schil + kern verwijderen"
  unit_weight_grams INT,                       -- bijv. 150 (per hamburger), NULL als n.v.t.
  unit_label TEXT,                              -- bijv. "stuk", "stokje", "fles"
  rounding_grams INT DEFAULT 100,              -- afrondwaarde als geen vaste eenheid

  -- Verdeling
  distribution_percentage NUMERIC(5,2),        -- % binnen categorie (alleen voor protein)
  grams_per_person INT,                        -- override: eigen g/p.p. (alleen voor fixed)

  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Relaties

```
events
  └── event_courses (1:N)
        └── menu_items (1:N)

food_drink_preferences (bestaand)
  → levert AVG meat_distribution per categorie
  → als input voor protein-items
```

---

## Drie typen menu-items

| Type | Wanneer | Berekening | Voorbeeld |
|------|---------|-----------|-----------|
| `protein` | Eiwitproducten | `gang.grams_pp x AVG(meat_distribution[cat]) x distribution_%` | Picanha, Kipsate, Zalm |
| `side` | Bijgerechten | `gang.grams_pp` evenredig verdeeld over alle sides | Courgette, Salade |
| `fixed` | Items met eigen portie | `item.grams_per_person x aantal_personen` | Stokbrood, Sauzen, Ananas |

**Let op:** De `grams_per_person` op de gang bepaalt het totale gewicht per persoon voor die gang. Hoe dat verdeeld wordt over items hangt af van het type:
- **protein**: verdeeld via deelnemersvoorkeuren (meat_distribution)
- **side**: gelijk verdeeld over alle side-items in de gang
- **fixed**: eigen portiegrootte per item (telt niet mee in de gangverdeling)

---

## Categorieverdeling eiwitten (uit deelnemersvoorkeuren)

De gemiddelde eiwitverdeling wordt berekend uit `food_drink_preferences.meat_distribution`. **Zowel deelnemers (`self`) als partners (`partner`) tellen mee.**

| Persoon | Type | Rund | Kip | Vis | Varken | Wild | Vega |
|---------|------|------|-----|-----|--------|------|------|
| Jan | self | 40% | 30% | 20% | 10% | 0% | 0% |
| Jan's partner | partner | 30% | 30% | 30% | 10% | 0% | 0% |
| Piet | self | 60% | 20% | 10% | 0% | 10% | 0% |
| Klaas | self | 50% | 30% | 20% | 0% | 0% | 0% |
| **Gemiddeld** | | **45%** | **28%** | **20%** | **5%** | **3%** | **0%** |

Dit gemiddelde is de input voor alle protein-items, ongeacht de gang.

---

## Rol van het LLM

### A. Bij toevoegen van een menu-item

Admin voert een naam in (bijv. "Ananas van de grill"), LLM stelt voor:

> "Geef voor '{naam}' (gang: {gang}, type: {item_type}):
> 1. Yield-percentage
> 2. Beschrijving afval/verlies
> 3. Eenheidgewicht (indien van toepassing)
> 4. Eenheidlabel
> 5. Aanbevolen gram per persoon (voor fixed items)"

### B. Bij meerdere protein-items in dezelfde categorie

> "Het hoofdgerecht bevat 3 rundvleesgerechten: Picanha, Entrecote, Hamburger.
> Stel een verdeling voor."

Admin kan altijd aanpassen.

---

## Berekeningsformules

### Per gang

Elke gang wordt apart berekend. De `grams_per_person` van de gang bepaalt het totale eetbare gewicht.

```
T_gang = Aantal_Personen x gang.grams_per_person
```

### Protein-items

```
T_protein = T_gang   (protein-items consumeren het gangbudget via voorkeuren)
C_i       = T_protein x AVG(meat_distribution[categorie_i])
P_j       = C_i x distribution_percentage_j
B_j       = P_j / yield_percentage_j
I_j       = CEIL(B_j / eenheid) x eenheid
```

### Side-items

```
T_sides   = T_gang   (of het restant na protein, afhankelijk van configuratie)
Per_Item  = T_sides / Aantal_Side_Items
B_j       = Per_Item / yield_percentage_j
I_j       = CEIL(B_j / eenheid) x eenheid
```

### Fixed-items

```
Eetbaar_j = Aantal_Personen x item.grams_per_person
B_j       = Eetbaar_j / yield_percentage_j
I_j       = CEIL(B_j / eenheid) x eenheid
```

Fixed-items staan los van het gangbudget - ze hebben hun eigen portiegrootte.

### Formele Notatie

- $n$ = aantal personen
- $g_k$ = gram per persoon voor gang $k$
- $p_i$ = gemiddeld percentage categorie $i$ (uit voorkeuren)
- $q_j$ = distribution_percentage product $j$ binnen categorie
- $y_j$ = yield_percentage product $j$
- $e_j$ = eenheidgewicht of afronding
- $f_j$ = grams_per_person (fixed items)

**Protein:** $I_j = \lceil \frac{n \cdot g_k \cdot p_i \cdot q_j}{y_j \cdot e_j} \rceil \times e_j$

**Side:** $I_j = \lceil \frac{n \cdot g_k / s}{y_j \cdot e_j} \rceil \times e_j$ (waar $s$ = aantal side-items)

**Fixed:** $I_j = \lceil \frac{n \cdot f_j}{y_j \cdot e_j} \rceil \times e_j$

---

## Dataflow Diagram

```
events                    food_drink_preferences
(event config)            (deelnemers + partners)
     |                              |
     v                              v
event_courses             AVG meat_distribution
(gangen + g/p.p.)         per categorie
     |                    (self + partner)
     v                              |
menu_items                          |
(gerechten per gang)                |
     |                              |
     +----------+-------------------+
                |
                v
       BEREKENINGSENGINE
       (per gang, per item)
                |
                v
       BOODSCHAPPENLIJST
       gegroepeerd per gang:
       - product, hoeveelheid, gewicht
       - subtotaal per gang
       - totaal
```

---

## Voorbeeld: Nieuwjaars BBQ 2026

**Event:** Nieuwjaars BBQ 2026 (type: bbq)
**Personen:** 18 (15 deelnemers + 3 partners)
**Gemiddelde voorkeuren:** Rund 45%, Kip 28%, Vis 20%, Varken 5%, Wild 3%

### Menu

**Gang 1: Aperitief** (80g p.p.)

| Item | Type | Categorie | Yield | Eenheid | g/p.p. of verdeling |
|------|------|-----------|-------|---------|-------------------|
| Borrelhapjes mix | fixed | other | 95% | kg (100g) | 50g p.p. |
| Nootjes | fixed | other | 100% | 200g/zak | 30g p.p. |

```
Borrelhapjes: 18 x 50g = 900g / 0.95 = 947g -> 1.000g
Nootjes:      18 x 30g = 540g / 1.00 = 540g -> 3 zakken x 200g = 600g
```

**Gang 2: Voorgerecht** (120g p.p.)

| Item | Type | Categorie | Yield | Eenheid | g/p.p. of verdeling |
|------|------|-----------|-------|---------|-------------------|
| Carpaccio | protein | beef | 95% | kg (100g) | 100% (enige rund) |

```
Carpaccio: 18 x 120g x 45%(rund) = 972g ... maar het is het enige protein.
Hier geldt: er is maar 1 protein-item, dus het krijgt 100% van de gang.
Eetbaar: 18 x 120g = 2.160g
Bruto:   2.160g / 0.95 = 2.274g -> 2.300g
```

*Opmerking: Bij een voorgerecht met maar 1 gerecht krijgt dat gerecht het volledige gangbudget, ongeacht meat_distribution. De meat_distribution is alleen relevant wanneer er meerdere protein-items in dezelfde gang zitten.*

**Gang 3: Hoofdgerecht** (450g p.p.)

| Item | Type | Categorie | Yield | Eenheid | Verdeling |
|------|------|-----------|-------|---------|-----------|
| Picanha | protein | beef | 85% | kg (100g) | 50% v. rund |
| Hamburger | protein | beef | 95% | 150g/stuk | 50% v. rund |
| Kipsate | protein | chicken | 95% | 30g/stokje | 100% |
| Hele zalm | protein | fish | 55% | kg (500g) | 100% |
| Spareribs | protein | pork | 60% | kg (100g) | 100% |
| Courgette grill | side | vegetables | 90% | kg (100g) | - |
| Stokbrood | fixed | bread | 100% | 250g/stuk | 80g p.p. |
| BBQ saus | fixed | sauce | 100% | 500ml/fles | 30g p.p. |
| Pindasaus | fixed | sauce | 100% | 500ml/fles | 40g p.p. |

```
Protein budget: 18 x 450g = 8.100g

RUND (45% = 3.645g):
  Picanha   (50%): 1.823g / 0.85 = 2.144g -> 2.200g
  Hamburger (50%): 1.823g / 0.95 = 1.919g -> 13 stuks x 150g = 1.950g

KIP (28% = 2.268g):
  Kipsate  (100%): 2.268g / 0.95 = 2.387g -> 80 stokjes x 30g = 2.400g

VIS (20% = 1.620g):
  Hele zalm(100%): 1.620g / 0.55 = 2.945g -> 3.000g

VARKEN (5% = 405g):
  Spareribs(100%): 405g / 0.60 = 675g -> 700g

Side:
  Courgette: restant of eigen g/p.p. -> 18 x 100g = 1.800g / 0.90 = 2.000g

Fixed:
  Stokbrood:  18 x 80g = 1.440g -> 6 stuks x 250g = 1.500g
  BBQ saus:   18 x 30g = 540g -> 2 flessen x 500ml
  Pindasaus:  18 x 40g = 720g -> 2 flessen x 500ml
```

**Gang 4: Dessert** (150g p.p.)

| Item | Type | Categorie | Yield | Eenheid | g/p.p. |
|------|------|-----------|-------|---------|--------|
| Ananas van de grill | fixed | fruit | 65% | kg (100g) | 150g p.p. |

```
Ananas: 18 x 150g = 2.700g / 0.65 = 4.154g -> 4.200g (schil + kern = 35% verlies)
```

### Totale Boodschappenlijst

| Gang | Product | Hoeveelheid | Inkoop |
|------|---------|-------------|--------|
| **Aperitief** | Borrelhapjes mix | - | 1,0 kg |
| | Nootjes | 3 zakken | 0,6 kg |
| | *Subtotaal* | | *1,6 kg* |
| **Voorgerecht** | Carpaccio | - | 2,3 kg |
| | *Subtotaal* | | *2,3 kg* |
| **Hoofdgerecht** | Picanha | ~2 stuks | 2,2 kg |
| | Hamburger | 13 stuks | 2,0 kg |
| | Kipsate | 80 stokjes | 2,4 kg |
| | Hele zalm | 1 stuk | 3,0 kg |
| | Spareribs | - | 0,7 kg |
| | Courgette | ~6 stuks | 2,0 kg |
| | Stokbrood | 6 stuks | 1,5 kg |
| | BBQ saus | 2 flessen | 1,0 L |
| | Pindasaus | 2 flessen | 1,0 L |
| | *Subtotaal* | | *~13,8 kg + 2,0 L* |
| **Dessert** | Ananas van de grill | ~3 stuks | 4,2 kg |
| | *Subtotaal* | | *4,2 kg* |
| | | | |
| | **TOTAAL** | | **~21,9 kg + 2,0 L** |

---

## Beslissingen

| Vraag | Beslissing |
|-------|-----------|
| Gram per persoon | Nieuwe tabel `event_courses` - per gang instelbaar |
| Partners | Ja, tellen mee in categorieverdeling |
| Bijgerechten, brood, sauzen | Ja, alles via menu_items voor volledige boodschappenlijst |
| Meerdere events | Ja, `events` -> `event_courses` -> `menu_items` |
| Structuur | Event -> Gangen -> Menu-items (niet BBQ-specifiek) |

---

*Dit systeem is event- en menu-agnostisch. De wiskundige formules zijn generiek - de specifieke invulling (BBQ, diner, etc.) komt uit de data.*
