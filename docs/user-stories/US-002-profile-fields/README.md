# US-002: Uitgebreide Profielvragen voor Rapportage

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | #3 |
| **Status** | In Planning |
| **Complexiteit** | Medium |
| **PACT Fase** | Prepare + Architecture |

## User Story
> Als deelnemer wil ik extra informatie over mezelf kunnen invullen, zodat het dashboard grappige analyses kan maken over onze groep.

## Nieuwe Velden

### Persoonlijke Info
| Veld | Type | Opties/Bereik | Verplicht |
|------|------|---------------|-----------|
| `birthDate` | Date | Datum picker | Ja |
| `gender` | Select | Man, Vrouw, Anders, Zeg ik niet | Ja |
| `selfConfidence` | Slider | 1-10 ("Ik kan niks" tot "Ik ben de beste") | Ja |

> ⚠️ **Validatie**: Soft validatie op `birthDate` - gebruiker moet minimaal 40 jaar oud zijn op moment van inschrijving. Toon waarschuwing maar blokkeer niet.

### JKV/Bovenkamer Historie
| Veld | Type | Opties/Bereik | Verplicht |
|------|------|---------------|-----------|
| `jkvJoinYear` | Select | 1990 - 2025 | Ja |
| `jkvExitYear` | Select | 2000 - 2030 (of "Nog actief in JKV") | Ja |
| `bovenkamerJoinYear` | Select | Berekend/bevestigd op basis van exit | Ja |

### Borrel Aanwezigheid
| Veld | Type | Beschrijving |
|------|------|--------------|
| `borrelAttendance2025` | Multi-select | Welke borrels in 2025 bezocht |
| `borrelPlanning2026` | Multi-select | Welke borrels van plan in 2026 |

## Borrel Data

Elke 4e donderdag van de maand (10 per jaar, geen juli/december):

### 2025 (voor "geweest" tracking)
| # | Datum | Opmerking |
|---|-------|-----------|
| 1 | 23 januari | - |
| 2 | 27 februari | - |
| 3 | 27 maart | - |
| 4 | 24 april | - |
| 5 | 22 mei | - |
| 6 | 26 juni | - |
| - | ~~juli~~ | Vervalt (zomervakantie) |
| 7 | 28 augustus | - |
| 8 | 25 september | - |
| 9 | 23 oktober | - |
| 10 | 27 november | - |
| - | ~~december~~ | Vervalt |

### 2026 (voor "planning" tracking)
| # | Datum | Opmerking |
|---|-------|-----------|
| 1 | 22 januari | - |
| 2 | 26 februari | - |
| 3 | 26 maart | - |
| 4 | 23 april | ⚠️ Meivakantie |
| 5 | 28 mei | - |
| 6 | 25 juni | - |
| - | ~~juli~~ | Vervalt (zomervakantie) |
| 7 | 27 augustus | - |
| 8 | 24 september | - |
| 9 | 22 oktober | ⚠️ Herfstvakantie |
| 10 | 26 november | - |
| - | ~~december~~ | Vervalt |

## Acceptatiecriteria
- [ ] Alle nieuwe velden toegevoegd aan registratieformulier
- [ ] Velden worden opgeslagen in database (tabel `registrations` uitbreiden)
- [ ] Geboortedatum picker met soft validatie (40+ waarschuwing, niet blokkerend)
- [ ] Zelfvertrouwen-slider heeft visuele feedback (emoji's of tekst)
- [ ] Borrel selectie toont datum + dag + eventuele opmerking
- [ ] Validatie: `jkvExitYear` >= `jkvJoinYear`
- [ ] 2025 borrels als "geweest" checkboxes (10 datums)
- [ ] 2026 borrels als "van plan" checkboxes (10 datums)

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-007 (Progressieve Registratie) | Velden verdeeld over profiel secties |
| US-001 (Skills) | Samen onderdeel van uitgebreid profiel |
| US-003 (Dashboard) | Data voor segment analyses |
| US-005 (Game) | Grill Guru gebruikt profiel data |
| US-006 (Awards) | Borrel stats voor awards |
