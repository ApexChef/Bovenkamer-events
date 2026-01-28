---
id: US-001
title: Uitgebreide Skill Selectie per Categorie
status: done
priority: 2
complexity: Low-Medium
type: Feature
pr: 14
created: 2026-01-18
updated: 2026-01-18
---

# US-001: Uitgebreide Skill Selectie per Categorie

## User Story
> Als deelnemer wil ik mijn skills kunnen aangeven per categorie (één skill per categorie), zodat de organisatie een compleet beeld heeft van wat ik kan bijdragen aan het evenement.

## Achtergrond
- **Huidige situatie**: Eén "primary skill" selectie uit 11 opties.
- **Gewenste situatie**: Meerdere categorieën met elk hun eigen skill-opties.

## Skill Categorieën

| Categorie | Nederlands | Skill Opties |
|-----------|------------|--------------|
| **food_prep** | Eten bereiden | Koken, Salades maken, Snijden, Marineren, Niks |
| **bbq_grill** | BBQ & Grill | Vlees grillen, Vis grillen, Vegetarisch, Vuur bewaken, Niks |
| **drinks** | Dranken | Wijn selecteren, Bier tappen, Cocktails mixen, Koffie zetten, Niks |
| **entertainment** | Entertainment | DJ-en, Spelletjes leiden, Verhalen vertellen, Karaoke, Niks |
| **atmosphere** | Sfeer | Vuur maken, Decoratie, Muziek kiezen, Verlichting, Niks |
| **social** | Sociaal | Gesprekken leiden, Gasten ontvangen, Netwerken, Toasten, Niks |
| **cleanup** | Opruimen | Afwassen, Tafel afruimen, Vuilnis, Organiseren, Niks |
| **documentation** | Vastleggen | Foto's maken, Video's, Social media, Gastenboek, Niks |

## Acceptatiecriteria
- [ ] Gebruiker ziet 8 categorieën in stap 2 van registratie
- [ ] Per categorie kan exact 1 skill geselecteerd worden
- [ ] Elke categorie heeft een "Niks" optie voor mensen zonder skill in die categorie
- [ ] Selectie wordt opgeslagen in de database
- [ ] Bestaand veld `additionalSkills` (vrije tekst) blijft behouden

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-007 (Progressieve Registratie) | Skills wordt een profiel sectie (40 punten) |
| US-003 (Dashboard) | Skills data wordt gebruikt voor analyses |
| US-005 (Game) | Grill Guru gebruikt skills in roasts |
| US-006 (Awards) | Skills data in persoonlijke rapporten |
