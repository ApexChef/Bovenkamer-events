# US-014 Phase 2: Menu & Inkooplijst — Implementatieplan

> Opgeslagen: 2026-01-30
> Branch: `feature/US-020-dynamic-form-elements`
> Status: **Voltooid** (TypeScript compilatie OK)
> Laatste update: 2026-01-30

---

## Wat is al gedaan

### Fase 1: Basisimplementatie (afgerond & gepusht)

Commit: `[Feature] US-014 v2: Menu beheer & inkooplijst berekening` (21 bestanden, 8425+ regels)

- Database schema: `events`, `event_courses`, `menu_items` tabellen
- 7 API routes: CRUD voor events, courses, menu items + shopping list berekening
- Frontend: Volledige admin pagina `/admin/menu` met CRUD dialogen en inkooplijst
- Berekeningsengine: `menu-calculations.ts` met protein/side/fixed berekeningen
- Types: Alle TypeScript types in `src/types/index.ts`
- Transforms: `menu-transforms.ts` voor snake_case → camelCase

### Fase 2: Bugfixes (afgerond & gepusht)

Commit: meegenomen in bovenstaande commit

- **Fix #1**: Inkooplijst ververst nu na CRUD operaties (refreshTrigger pattern)
- **Fix #2**: `|| null` vervangen door `?? null` in alle API routes (voorkomt 0-waarden als null)

### Fase 3: Factuurdata migratie (afgerond, niet gepusht)

Bestand: `supabase/migrations/20260130_replace_sample_data.sql`

- 5 gangen met 38 menu-items op basis van HANOS factuur 925956726
- Sauzen, kruiden, dranken en non-food weggelaten (per afspraak)

---

### Fase 4: Shopping List Enhancements (voltooid, niet gepusht)

9 bestanden gewijzigd:

1. **Schema migratie**: `purchased_quantity` kolom aan `menu_items` tabel
2. **Data migratie**: 19 personen, Graved Lachs + Tête de Moine in Gang 1, Zalmfilet 50g, Kaasplank 106g, inkoop-hoeveelheden uit factuur
3. **Types**: `purchasedQuantity` in MenuItem/ShoppingListItem/CreateMenuItemData, `surplus` velden, `MeatDistributionBreakdown` type
4. **Transforms**: `purchased_quantity` → `purchasedQuantity` mapping
5. **Berekeningen**: surplus berekening, `sumPurchasedAndSurplus`, `calculateMeatDistributionBreakdown`
6. **API courses/items POST**: accept `purchasedQuantity`, auto-redistributie protein items
7. **API menu-items PATCH/DELETE**: accept `purchasedQuantity`, auto-redistributie bij delete
8. **API shopping-list**: `meatDistributionBreakdown` + surplus velden in response
9. **Frontend**: Vleesverdeling blok, Nodig/Ingekocht/Over kolommen met kleurcodes, dialog veld

---

## Oorspronkelijk plan (referentie)

### 1. Migratie SQL bijwerken

**Bestand**: `supabase/migrations/20260130_replace_sample_data.sql`

Wijzigingen:
- Event `total_persons` van 18 naar **19** (gebaseerd op screenshot: 3.80kg / 200g = 19)
- Gang 1 (Aperitief): twee items toevoegen:
  - **Graved Lachs** (fixed, fish, 50g p.p., yield 90%, unit: kg) — halve zalmfilet
  - **Tête de Moine** (fixed, dairy, 14g p.p., yield 80%, unit: kg) — verplaatst uit Gang 5
- Gang 2 (Vis): Zalmfilet `grams_per_person` van 100 naar **50** (andere helft is Graved Lachs)
- Gang 5 (Kaasplank): Tête de Moine verwijderen, course `grams_per_person` informatief aanpassen

> NB: Voor fixed-item gangen is course `grams_per_person` puur informatief — berekening gebruikt per-item waarden.

### 2. Database schema: `purchased_quantity` kolom

**Bestanden**:
- `supabase/migrations/20260130_menu_shopping_list.sql` — kolom aan CREATE TABLE
- `supabase/migrations/20260130_replace_sample_data.sql` — factuurwaarden invullen

Nieuw veld in `menu_items`:
```sql
purchased_quantity NUMERIC(10,2),  -- Daadwerkelijk ingekocht (grammen)
```

Factuurwaarden (uit `docs/factuur-925956726-hanos.csv`):
- Zalmfilet: 3202g → 1601g Graved Lachs + 1601g Zalmfilet
- Varkens Spare Rib: 2959g
- Picanha: 2140g
- Runderdiamanthaas: 1945g
- Boneless Beef Ribs: 1074g
- Varkensnek Ibérico: 1905g
- Saucisses: 1114g (564g + 550g)
- Kipsaté: 1000g (1kg)
- Tonijn: 638g (334g + 304g)
- Garnaal: 800g
- Coquillevlees: 800g
- Inktvis: 800g
- etc.

### 3. Types en transforms uitbreiden

**Bestand**: `src/types/index.ts`

- `MenuItem`: add `purchasedQuantity: number | null`
- `ShoppingListItem`: add `purchasedQuantity: number | null` en `surplus: number | null`
- `ShoppingListCourse.subtotal`: add `totalPurchasedGrams`, `totalSurplusGrams`
- `ShoppingListResponse`: add `meatDistributionBreakdown` per course
- `CreateMenuItemData`: add `purchasedQuantity: number | null`

Nieuw type:
```typescript
interface MeatDistributionBreakdown {
  courseId: string;
  courseName: string;
  totalCourseGrams: number;
  categories: Array<{
    category: string;
    percentage: number;      // gemiddeld distributie %
    gramsNeeded: number;     // percentage × totalCourseGrams
  }>;
}
```

**Bestand**: `src/lib/menu-transforms.ts`

- `transformMenuItem`: map `purchased_quantity` → `purchasedQuantity`

### 4. API routes uitbreiden

#### 4a. Menu item CRUD — `purchased_quantity` veld

- `src/app/api/admin/courses/[id]/items/route.ts` (POST): accept `purchasedQuantity`
- `src/app/api/admin/menu-items/[id]/route.ts` (PATCH): accept `purchasedQuantity`

#### 4b. Auto-redistributie bij add/delete

- `courses/[id]/items/route.ts` (POST): na insert protein item → herbereken alle protein items in zelfde course+category naar gelijke verdeling (100 / count)
- `menu-items/[id]/route.ts` (DELETE): na delete protein item → herbereken resterende protein items

Logica:
```
1. Bepaal course_id en category van het item
2. Als itemType === 'protein':
   a. SELECT alle active protein items WHERE course_id = X AND category = Y
   b. newPct = 100 / count
   c. UPDATE alle items SET distribution_percentage = newPct
3. Return updated items in response
```

#### 4c. Shopping list API — surplus + vleesverdeling

**Bestand**: `src/app/api/admin/shopping-list/[eventId]/route.ts`

Response uitbreiden met:
- Per item: `purchasedQuantity` (uit DB) en `surplus` (ingekocht - nodig)
- Per course subtotals: `totalPurchasedGrams`, `totalSurplusGrams`
- `meatDistributionBreakdown`: per protein-gang de verdeling per categorie (% + kg)

### 5. Berekeningsengine uitbreiden

**Bestand**: `src/lib/menu-calculations.ts`

- Alle calculate-functies: accepteer optioneel `purchasedQuantity`, return `surplus`
- Subtotals en grand totals: include purchased + surplus
- Nieuwe functie: `calculateMeatDistributionBreakdown(course, totalPersons, avgMeatDistribution)`

### 6. Frontend Shopping List UI

**Bestand**: `src/app/admin/menu/page.tsx` — ShoppingListSection

#### 6a. Vleesverdeling blok (per protein-gang)

Compact blok boven de tabel van protein-gangen:
```
Vleesverdeling BBQ Vlees (8.55 kg totaal)
  Rund     27.0%  →  2.3 kg
  Varken    8.5%  →  0.7 kg
  Kip      20.1%  →  1.7 kg
  Vis      24.3%  →  2.1 kg
  Wild      7.6%  →  0.6 kg
  Veg      12.5%  →  1.1 kg
```

#### 6b. Extra kolommen in tabel

Oud: Item | Type | Netto | Bruto | Inkoop | Eenheid
Nieuw: Item | Type | Netto | Bruto | **Nodig** | **Ingekocht** | **Over** | Eenheid

- **Nodig** = berekende inkoophoeveelheid (was "Inkoop")
- **Ingekocht** = `purchasedQuantity` uit DB (groen ≥ nodig, rood < nodig)
- **Over** = ingekocht − nodig (positief = surplus, negatief = tekort in rood)

### 7. Menu item dialog UI

**Bestand**: `src/app/admin/menu/page.tsx` — MenuItemDialog

- Veld "Ingekochte hoeveelheid (gram)" toevoegen
- Alleen relevant bij bestaande items

---

## Betrokken bestanden

| # | Bestand | Wijziging |
|---|---------|-----------|
| 1 | `supabase/migrations/20260130_menu_shopping_list.sql` | `purchased_quantity` kolom |
| 2 | `supabase/migrations/20260130_replace_sample_data.sql` | Zalm split, Tête de Moine, 19 personen, inkoop-waarden |
| 3 | `src/types/index.ts` | `purchasedQuantity` in types, `MeatDistributionBreakdown` |
| 4 | `src/lib/menu-transforms.ts` | Transform `purchased_quantity` |
| 5 | `src/lib/menu-calculations.ts` | Surplus berekening, vleesverdeling functie |
| 6 | `src/app/api/admin/courses/[id]/items/route.ts` | `purchasedQuantity`, auto-redistributie |
| 7 | `src/app/api/admin/menu-items/[id]/route.ts` | `purchasedQuantity`, auto-redistributie bij delete |
| 8 | `src/app/api/admin/shopping-list/[eventId]/route.ts` | Surplus + vleesverdeling in response |
| 9 | `src/app/admin/menu/page.tsx` | Kolommen, vleesverdeling blok, dialog veld |

## Verificatie

1. `npx tsc --noEmit` — geen TypeScript fouten
2. Migratie SQL syntactisch correct
3. Shopping list API response bevat nieuwe velden
4. UI toont vleesverdeling per protein-gang
5. UI toont Nodig/Ingekocht/Over kolommen
6. Auto-redistributie werkt bij add/delete protein items
