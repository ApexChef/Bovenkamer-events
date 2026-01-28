---
id: US-015
title: Food & Beverage Preferences
status: in-progress
priority: High
complexity: Medium
type: Feature
pr: 50
created: 2026-01-26
updated: 2026-01-28
---

# US-015: Food & Beverage Preferences

## User Story

**Als** deelnemer van de Bovenkamer Winterproef
**Wil ik** mijn eet- en drinkvoorkeuren kunnen opgeven
**Zodat** de organisatie weet wat ik wil eten en drinken tijdens het evenement

## Context

De eet- en drinkvoorkeuren zijn essentieel voor de catering planning. Zowel de deelnemer als eventueel de partner moeten hun voorkeuren kunnen opgeven.

## Acceptance Criteria

### Algemeen
- [x] Aparte pagina `/eten-drinken` met tabs voor Eten en Drinken
- [x] Partner kan ook voorkeuren invullen (indien van toepassing)
- [x] CTA op dashboard wanneer voorkeuren niet compleet zijn
- [ ] **Alle sliders starten default op 0%** zodat we weten of de gebruiker zelf iets heeft ingevuld
- [ ] **Sub-tabs voor persoon selectie** (Jij | Partner naam) voor snelle navigatie tussen gebruiker en partner

### Drinken - Frisdrank
- [x] Percentage slider voor frisdrank
- [x] **Bij frisdrank > 10%**: toon keuze buttons (Cola, Sinas, Spa Rood, Overige)

### Drinken - Wijn
- [x] Percentage slider voor wijn
- [ ] **Bij wijn > 10%**: toon melding "Zo, jij houdt van wijn!" met een **rood/wit slider** (100% rood ↔ 100% wit)

### Drinken - Bier
- [x] Percentage slider voor bier
- [ ] **Bij bier > 0%**: toon keuze tussen Speciaal Bier of Pils
- [ ] **Bij keuze "Speciaal Bier"**: toon **duidelijk zichtbare sarcastische tekst** "Dit is een BBQ, geen Beer Craft festival!"

### Drinken - Bubbels
- [x] Vraag "Begin je graag met een bubbel?"
- [x] Bij "Ja": keuze tussen Champagne of Prosecco/Cava

### Drinken - Water
- [x] Bij frisdrank <= 10%: keuze tussen bruisend of plat water

### Eten
- [x] Dieetwensen (vrij tekstveld)
- [x] Vleesverdeling met pie chart (Rund, Varken, Kip, Vis, Vegetarisch)
- [x] Groente voorkeur (segmented control 1-5)
- [x] Saus voorkeur (segmented control 1-5)

## Technical Notes

- Database tabel: `food_drink_preferences`
- API endpoint: `/api/food-drinks`
- Nieuwe velden nodig voor:
  - `wine_preference` (slider 0-100 voor rood/wit)
  - `beer_type` ('pils' | 'speciaal')

## Status

- [x] Basis implementatie compleet (PR #50)
- [ ] Sliders default op 0%
- [ ] Conditionele drink opties (wijn, bier)

## Related

- US-014: Admin F&B rapport (boodschappenlijst genereren)
