# US-003: Sarcastisch Dashboard met LLM Analyses

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | #5 |
| **Status** | In Planning |
| **Complexiteit** | Hoog |
| **PACT Fase** | Prepare + Architecture |

## User Story
> Als bezoeker van het dashboard wil ik een humoristisch overzicht zien van onze Bovenkamer groep, inclusief AI-gegenereerde analyses en scores, zodat we kunnen lachen om onszelf en onze "kwaliteiten".

## Achtergrond
De Bovenkamer is een alumni-groep van JKV Venray (Junior Kamer), voor leden die 40+ zijn. Het dashboard moet informatief én vermakelijk zijn met een sarcastische ondertoon (niet aanstootgevend).

## Dashboard Secties

### 1. Groepsprofiel Samenvatting (LLM)
AI-gegenereerde sarcastische beschrijving van de groep:
- "Dit is een groep van X personen die denken dat..."
- Gemiddelde leeftijd, JKV-ervaring, etc.
- Algemene observaties

### 2. Skill Scores per Categorie
Per categorie een "paraatheidscore":
- Hoeveel mensen claimen deze skill vs. hoeveel we nodig hebben
- Sarcastische beoordeling per categorie
- Visualisatie (progress bars, kleuren)

Voorbeeld output:
```
🍖 BBQ & Grill: 85% paraat
   "12 van de 14 mannen claimen te kunnen BBQ-en.
    Gemiddeld zelfvertrouwen: 8.7. Spoiler: het wordt weer aangebrand."

🍷 Dranken: 120% paraat
   "Meer sommeliers dan gasten. Niemand maakt zich zorgen over dit onderdeel."

🧹 Opruimen: 15% paraat
   "2 mensen. Beiden vrouw. Shocking."
```

### 3. Segment Analyses (LLM)
Vergelijkingen tussen groepen:
- Geslacht (m/v)
- Geboortejaar (80-83 vs 84-86)
- JKV anciënniteit (veteranen vs. nieuwkomers)
- Zelfvertrouwen-niveau

Voorbeeld:
```
"De 1980-lichting claimt 94% van de DJ-skills.
 De 1985+ generatie focust op 'afwassen' en 'niks'.
 Toeval? Wij denken van niet."
```

### 4. Superlatieven & Awards (LLM)
- "Meest Overschatte Skill"
- "Grootste Gat in het Team"
- "Meest Zelfverzekerde Nietskunner"
- "JKV Veteraan Award" (langste lidmaatschap)
- "Borrel Kampioen" (hoogste aanwezigheid)
- "Beloftes Beloftes" (veel gepland, weinig geweest)

### 5. Borrel Statistieken
- Gemiddelde opkomst per borrel
- Voorspelling 2026 opkomst
- "Meest populaire borrel" vs "te vermijden datum"
- Vergelijking: wat mensen zeggen vs. wat ze doen

### 6. Voorspellingen & Waarschuwingen (LLM)
AI voorspellingen voor het evenement:
- "Op basis van deze groep gaat het volgende mis..."
- "Waarschuwing: 0 mensen kunnen afwassen"
- "Verwachte discussies: muziekkeuze (3 DJ's, 3 meningen)"

## Wireframe (tekstueel)

```
┌─────────────────────────────────────────────────────────┐
│  🎭 BOVENKAMER ANALYTICS                        [⟳ Refresh] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 GROEPSPROFIEL                                │   │
│  │ "Een select gezelschap van 14 40-plussers..."   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 🍖 BBQ      │ │ 🍷 Dranken   │ │ 🎵 Enter-    │   │
│  │ Score: 85%  │ │ Score: 120%  │ │ tainment 40% │   │
│  │ ████████░░  │ │ ██████████++ │ │ ████░░░░░░   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│  ... meer categorieën ...                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏆 AWARDS                                       │   │
│  │ • Meest Zelfverzekerd: Piet (9.5/10, kan niks) │   │
│  │ • Borrel Kampioen: Klaas (11/11 aanwezig)      │   │
│  │ • ...                                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📅 BORREL VOORSPELLING 2026                     │   │
│  │ Jan: 12 │ Feb: 8 │ Mrt: 10 │ ...               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Acceptatiecriteria
- [ ] Dashboard pagina toegankelijk voor alle ingelogde gebruikers
- [ ] Alle 6 secties geïmplementeerd
- [ ] LLM analyses worden gegenereerd op basis van actuele data
- [ ] Toon is sarcastisch maar niet aanstootgevend
- [ ] Analyses zijn gecached (niet bij elke pageload opnieuw)
- [ ] Admin kan analyses handmatig refreshen
- [ ] Responsive design (ook leesbaar op mobiel)
- [ ] Loading states tijdens LLM generatie

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-001 (Skills) | Skill data voor analyses |
| US-002 (Profielvelden) | Profiel data voor segmentatie |
| US-005 (Game) | Deelt LLM Service |
| US-006 (Awards) | Deelt LLM Service en award logica |
| US-007 (Progressieve Registratie) | Meer data = betere analyses |
