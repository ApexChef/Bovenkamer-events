---
id: US-014
title: Admin Food & Beverage Rapport
status: refined
priority: Medium
complexity: Medium
type: Feature
pr: null
created: 2026-01-25
updated: 2026-01-28
---

# US-014: Admin Food & Beverage Rapport

## User Story

**Als** administrator van de Bovenkamer Winterproef
**Wil ik** een overzichtelijk F&B rapport kunnen genereren
**Zodat** ik een boodschappenlijst heb voor de inkoop van eten en drinken

## Context

Na de registratieperiode moeten we weten hoeveel van wat we moeten inkopen. Het rapport aggregeert alle food & drink preferences (US-015) van deelnemers én partners tot een praktische boodschappenlijst.

## Beslissingen (Interview)

| Vraag | Antwoord |
|-------|----------|
| Output formaat | Webpagina + PDF + Excel/CSV |
| Hoeveelheden | Percentages + aantallen + geschatte kg/liters |
| Dieetwensen | Overzicht bovenaan + detail per persoon |
| Portiegrootte | Vaste standaardwaarden |
| Partners | Tellen als apart persoon in totalen |
| Drankberekening | Aantal flessen wijn, kratten bier |
| Updates | Snapshot met datum + refresh knop |

## Rapport Onderdelen

### 1. Samenvatting Header

```
┌─────────────────────────────────────────────────────────────┐
│  🍖 F&B RAPPORT - BOVENKAMER WINTERPROEF 2026               │
│  Gegenereerd: 28 januari 2026, 14:30                        │
│  Status: 24 van 28 personen hebben voorkeuren ingevuld      │
│                                                              │
│  [🔄 Vernieuwen]  [📄 PDF]  [📊 Excel]                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dieetwensen & Allergieën (Prominent!)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ DIEETWENSEN & ALLERGIEËN                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🚫 ALLERGIEËN                                               │
│  • Jan Jansen: Notenallergie                                │
│  • Marie de Vries: Lactose-intolerant                       │
│  • Piet Bakker (partner): Glutenvrij                        │
│                                                              │
│  🥗 VEGETARISCH/VEGANISTISCH                                │
│  • Lisa van Dam: Vegetariër                                 │
│  • Tom Hendriks: Veganist                                   │
│                                                              │
│  📝 OVERIGE OPMERKINGEN                                      │
│  • Klaas Smit: Geen varkensvlees                            │
│  • Eva Mulder: Liever geen schaaldieren                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Vlees & Vis Overzicht

```
┌─────────────────────────────────────────────────────────────┐
│  🥩 VLEES & VIS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Totaal personen: 28 (24 deelnemers + 4 partners)           │
│  Portiegrootte: 200g per persoon                            │
│  Totaal vlees/vis: ~5.6 kg                                  │
│                                                              │
│  Categorie      │ %    │ Personen │ Geschat    │            │
│  ───────────────┼──────┼──────────┼────────────┤            │
│  Rundvlees      │ 25%  │ 7        │ ~1.4 kg    │ ████████   │
│  Varkensvlees   │ 20%  │ 5.6      │ ~1.1 kg    │ ██████     │
│  Kip            │ 20%  │ 5.6      │ ~1.1 kg    │ ██████     │
│  Wild           │ 10%  │ 2.8      │ ~0.6 kg    │ ███        │
│  Vis            │ 15%  │ 4.2      │ ~0.8 kg    │ █████      │
│  Vegetarisch    │ 10%  │ 2.8      │ ~0.6 kg    │ ███        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Dranken Overzicht

```
┌─────────────────────────────────────────────────────────────┐
│  🍷 DRANKEN                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  WIJN (gemiddeld 40% van drinkers)                          │
│  ───────────────────────────────────────────────────────────│
│  Totaal wijnliefhebbers: 18 personen                        │
│  Geschat verbruik: ~6 flessen (0.75L, 2 glazen p.p.)        │
│                                                              │
│  Rood/Wit verdeling:                                        │
│  [████████████░░░░░░░░] 60% rood / 40% wit                  │
│  → ~4 flessen rood, ~2 flessen wit                          │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│  BIER (gemiddeld 35% van drinkers)                          │
│  ───────────────────────────────────────────────────────────│
│  Totaal bierliefhebbers: 14 personen                        │
│  Geschat verbruik: ~2 kratten (24 flesjes)                  │
│                                                              │
│  Type voorkeur:                                              │
│  • Pils: 10 personen (71%)                                  │
│  • Speciaal bier: 4 personen (29%)                          │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│  FRISDRANK & WATER                                          │
│  ───────────────────────────────────────────────────────────│
│  Frisdrank drinkers: 8 personen                             │
│  • Cola: 4                                                   │
│  • Sinas: 2                                                  │
│  • Spa Rood: 1                                               │
│  • Overig: 1                                                 │
│                                                              │
│  Water voorkeur (bij lage frisdrank):                       │
│  • Bruisend: 12 personen                                    │
│  • Plat: 8 personen                                         │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│  BUBBELS (aperitief)                                        │
│  ───────────────────────────────────────────────────────────│
│  Start met bubbel: 20 personen (71%)                        │
│  • Champagne: 8 personen                                    │
│  • Prosecco/Cava: 12 personen                               │
│  Geschat: ~3 flessen champagne, ~4 flessen prosecco         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5. Bijgerechten

```
┌─────────────────────────────────────────────────────────────┐
│  🥗 BIJGERECHTEN VOORKEUREN                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Groenten (schaal 1-5):                                     │
│  Gemiddelde score: 3.8 / 5                                  │
│  [████████████████░░░░] "Best veel groenten graag"          │
│                                                              │
│  Sauzen (schaal 1-5):                                       │
│  Gemiddelde score: 3.2 / 5                                  │
│  [████████████░░░░░░░░] "Gemiddelde saus behoefte"          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Detail per Persoon (uitklapbaar)

```
┌─────────────────────────────────────────────────────────────┐
│  👥 DETAIL PER PERSOON                          [▼ Uitklappen]
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Jan Jansen                                                  │
│  ├─ Dieet: Notenallergie                                    │
│  ├─ Vlees: 30% rund, 25% kip, 20% varken, 15% vis, 10% vega │
│  ├─ Drank: 50% wijn (70% rood), 30% bier (pils), 20% fris   │
│  ├─ Bubbel: Ja, champagne                                   │
│  └─ Groenten: 4/5, Sauzen: 3/5                              │
│                                                              │
│  Marie de Vries + partner Piet                              │
│  ├─ Marie - Dieet: Lactose-intolerant                       │
│  │  ├─ Vlees: 100% vegetarisch                              │
│  │  ├─ Drank: 60% wijn (100% wit), 40% fris (cola)          │
│  │  └─ Bubbel: Ja, prosecco                                 │
│  │                                                           │
│  └─ Piet (partner) - Dieet: Glutenvrij                      │
│     ├─ Vlees: 40% rund, 30% kip, 30% vis                    │
│     ├─ Drank: 70% bier (speciaal), 30% fris                 │
│     └─ Bubbel: Nee                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### Rapport Generatie
- [ ] Admin pagina `/admin/fb-rapport` met overzichtelijk rapport
- [ ] Rapport toont "gegenereerd op" timestamp
- [ ] Refresh knop om rapport te vernieuwen
- [ ] Toont waarschuwing als niet iedereen voorkeuren heeft ingevuld

### Export Opties
- [ ] Print-friendly CSS voor direct printen vanuit browser
- [ ] PDF export knop (via browser print-to-PDF of server-side)
- [ ] Excel/CSV export met alle data in tabelvorm

### Dieetwensen Sectie
- [ ] Prominente rode/oranje styling voor allergieën
- [ ] Aparte lijsten voor: allergieën, vegetarisch/veganistisch, overig
- [ ] Namen van personen duidelijk zichtbaar

### Vlees & Vis Berekeningen
- [ ] Percentage per categorie gebaseerd op user preferences
- [ ] Aantal personen per categorie
- [ ] Geschatte kg op basis van 200g per persoon
- [ ] Visuele progress bars

### Drank Berekeningen
- [ ] Wijn: totaal + rood/wit verdeling + aantal flessen
- [ ] Bier: totaal + pils/speciaal verdeling + aantal kratten
- [ ] Frisdrank: per type (cola, sinas, etc.)
- [ ] Water: bruisend vs plat verdeling
- [ ] Bubbels: champagne vs prosecco + aantal flessen

### Partner Handling
- [ ] Partners tellen als aparte personen in totalen
- [ ] In detail view: deelnemer + partner samen gegroepeerd
- [ ] Duidelijk label wie partner is van wie

### Detail View
- [ ] Uitklapbare sectie met alle personen
- [ ] Per persoon: dieet, vlees%, drank%, bubbel, groenten, sauzen
- [ ] Partner info onder de deelnemer gegroepeerd

## Standaard Portiegroottes

| Type | Hoeveelheid per persoon |
|------|------------------------|
| Vlees/Vis | 200 gram |
| Wijn | 2 glazen (~250ml) |
| Bier | 2 flesjes/glazen |
| Frisdrank | 2 glazen (~400ml) |
| Bubbels | 1 glas (~125ml) |

## Fles/Krat Berekening

| Product | Inhoud | Glazen per |
|---------|--------|------------|
| Wijn fles | 750ml | ~6 glazen |
| Bier krat | 24 flesjes | 24 porties |
| Champagne | 750ml | ~6 glazen |
| Prosecco | 750ml | ~6 glazen |

## Technische Details

### Route
`/admin/fb-rapport`

### API Endpoint
`GET /api/admin/fb-report`

### Database
Aggregeert data uit `food_drink_preferences` tabel, gejoind met `users` en `registrations` voor namen en partner info.

## Relaties

| User Story | Relatie |
|------------|---------|
| US-015 | Data bron: food_drink_preferences tabel |
| US-017 | Gebruikt zelfde admin layout/auth |

---

*Refined: 2026-01-28 (na interview)*
# Food & Beverage

As an admin, I want to be able to manage the food and beverage preferences of all users in the app, so that I can ensure that everyone's dietary needs and preferences are met during events and activities.
Zo, als alle registraties zijn geweest, wil ik eigenlijk een boodschappenlijst kunnen creëren.

Dus een soort rapport genereren, gegroepeerd zoals het ook op te geven is: vlees, vis, allergieën. 

## Acceptance Criteria


                                                                          


