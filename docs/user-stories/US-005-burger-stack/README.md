# US-005: Burger Stack Mini-Game

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | #4 |
| **Status** | In Planning |
| **Complexiteit** | Zeer Hoog |
| **PACT Fase** | Prepare + Architecture |

## User Story
> Als Bovenkamer-lid wil ik een leuk burger-stapelspel kunnen spelen op mijn telefoon, zodat ik punten kan verdienen en kan strijden om de hoogste score vóór het evenement.

## Achtergrond
Een simpel, verslavend mini-game geïnspireerd op "Stack" spellen. Spelers stapelen hamburger-ingrediënten door op het juiste moment te tikken. Hoe hoger de stapel, hoe meer punten. Mobile-first, maar ook speelbaar op desktop.

## Gameplay Mechanics

### Basisspel
```
    🍞 ← Bewegend broodje (heen en weer)

    ┌─────────────────┐
    │                 │
    │   [TAP TO DROP] │
    │                 │
    │      🥬         │  ← Gestapelde ingrediënten
    │     🧀🧀        │
    │    🥩🥩🥩       │
    │   🍞🍞🍞🍞      │  ← Onderste broodje (basis)
    └─────────────────┘
```

### Spelregels
1. Ingrediënten bewegen horizontaal over het scherm
2. Speler tikt om te droppen
3. Alleen het overlappende deel blijft (zoals Stack)
4. Spel eindigt als de stapel te smal wordt of je mist
5. Elk ingrediënt geeft punten (zie tabel)

### Ingrediënten & Punten
| Ingrediënt | Emoji | Basispunten | Moeilijkheid |
|------------|-------|-------------|--------------|
| Broodje onder | 🍞 | - | Start |
| Hamburger | 🥩 | 10 | Normaal |
| Kaas | 🧀 | 15 | Normaal |
| Sla | 🥬 | 20 | Snel |
| Tomaat | 🍅 | 20 | Snel |
| Bacon | 🥓 | 25 | Zeer snel |
| Ei | 🍳 | 30 | Zeer snel |
| Augurk | 🥒 | 15 | Normaal |
| Broodje boven | 🍞 | 50 | Bonus (afsluiten) |

### Speciale Items (Random spawns)
| Item | Effect | Visueel |
|------|--------|---------|
| Gouden Biefstuk | 3x punten volgende drop | ✨🥩✨ |
| Slow-mo Saus | Vertraagt beweging 5 sec | 🍯 |
| Extra Leven | Eén misser toegestaan | ❤️ |
| Brand! | Snelheid x2 tijdelijk | 🔥 |

### Combo Systeem
- Perfect drop (100% overlap): **2x punten + combo teller**
- 5 combo's: Bonus ingrediënt
- 10 combo's: "GRILL MASTER" badge + puntenregen

## AI Persona: "De Grill Guru"

### Karakter
> **De Grill Guru** is een mysterieuze, alwetende BBQ-meester die sarcastische wijsheden deelt. Hij spreekt in raadselachtige one-liners en heeft een mening over alles en iedereen. Denk: Mr. Miyagi meets Gordon Ramsay meets die ene oom op elk feestje.

### Kennis van de Groep
De Grill Guru kent ALLE deelnemers persoonlijk, niet alleen spelers. Hij gebruikt:
- **Profieldata**: Naam, geboortedatum, geslacht, JKV-jaren
- **Skills**: Alle 8 skill-categorieën en zelfvertrouwen-score
- **Registratie antwoorden**: Guilty pleasure songs, beste concert, verborgen talent, etc.
- **Borrel aanwezigheid**: Wie komt wel/niet, beloftes vs. realiteit
- **Spelstatistieken**: Voor wie wel speelt
- **Onderlinge relaties**: Wie kent wie het langst, partners, etc.

### Voorbeelduitspraken (LLM gegenereerd)
**Bij game start:**
- "Ah, [NAAM]... [JKV_JAREN] jaar JKV-ervaring en je denkt nu pas te kunnen stapelen?"
- "Iemand die [SKILL] als vaardigheid claimt. Laten we zien of je coördinatie beter is."

**Bij game over:**
- "Een ware meester faalt 1000 keer. Jij zit nu op [X]. Doorgaan."
- "[NAAM], met een zelfvertrouwen van [SCORE]/10 had ik meer verwacht. Of juist minder."

**Bij highscore:**
- "De vlam brandt fel in jou, [NAAM]. Net als die keer op [BORREL_DATUM] blijkbaar."
- "Eindelijk. [GEBOORTEJAAR]-generatie doet iets goed."

## Async Challenge Mode

### Flow
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 UITDAGING                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Jouw score: 8.450 pts (32 lagen)                          │
│                                                              │
│  Daag iemand uit:                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Klaas   │ │ Marie   │ │ Piet    │ │ Jan     │          │
│  │ 🟢 online│ │ ⚪ 2u   │ │ 🟢 online│ │ ⚪ 1d   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  [📤 Verstuur Uitdaging]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Challenge Winnaar Bepaling
- **Hoogste score wint** - Wie de meeste punten haalt
- Beide spelers kunnen onbeperkt proberen tot ze tevreden zijn
- Challenge blijft open tot beide partijen klaar zijn of tot event-datum

## Acceptatiecriteria

### MVP (Fase 1)
- [ ] Basis gameplay werkend (tap to drop, stacking)
- [ ] Score systeem functioneel
- [ ] Mobile-first responsive design
- [ ] Highscore opslaan in database
- [ ] Simpel leaderboard tonen
- [ ] Koppeling met bestaande auth (ingelogde gebruikers)

### Uitbreiding (Fase 2)
- [ ] Speciale items implementeren
- [ ] Combo systeem met visuele feedback
- [ ] Grill Guru commentaar (statische teksten eerst)
- [ ] Thema's unlockbaar
- [ ] Persoonlijke statistieken pagina

### Event Features (Fase 3)
- [ ] LLM Roast Generator voor live event
- [ ] Admin panel voor roast selectie
- [ ] Projectie-modus voor groot scherm
- [ ] Export roasts als afbeeldingen

## Beslissingen

| Vraag | Beslissing |
|-------|------------|
| Niet-spelers roasten | Ja, "Schaduw Roasts" op basis van profieldata |
| Alle data gebruiken | Ja, Grill Guru kent alle deelnemers persoonlijk |
| LLM roasts | Alle roasts volledig LLM gegenereerd |
| Admin controle | System prompt configureerbaar door admin |
| Grill Guru audio | Nee, eerst alleen tekst |
| LLM logging | Ja, alle uitspraken worden gelogd |
| Highscores per dag | Onbeperkt, meerdere pogingen toegestaan |
| Timing | Puur pre-event, NIET tijdens het evenement |
| Multiplayer | Async Challenge mode (niet real-time) |
| Challenge expiratie | Geen tijdslimiet - hoogste score wint |

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-001 (Skills) | Grill Guru gebruikt skills in roasts |
| US-002 (Profielvelden) | Grill Guru gebruikt profiel data |
| US-003 (Dashboard) | Deelt LLM Service |
| US-006 (Awards) | Game stats in persoonlijke rapporten |
| US-007 (Progressieve Registratie) | Game punten in leaderboard |
