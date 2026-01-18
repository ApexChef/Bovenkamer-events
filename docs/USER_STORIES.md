# User Stories - Bovenkamer Winterproef

## US-001: Uitgebreide Skill Selectie per Categorie

### User Story
> Als deelnemer wil ik mijn skills kunnen aangeven per categorie (één skill per categorie), zodat de organisatie een compleet beeld heeft van wat ik kan bijdragen aan het evenement.

### Achtergrond
Huidige situatie: Eén "primary skill" selectie uit 11 opties.
Gewenste situatie: Meerdere categorieën met elk hun eigen skill-opties.

### Skill Categorieën

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

### Acceptatiecriteria
- [ ] Gebruiker ziet 8 categorieën in stap 2 van registratie
- [ ] Per categorie kan exact 1 skill geselecteerd worden
- [ ] Elke categorie heeft een "Niks" optie voor mensen zonder skill in die categorie
- [ ] Selectie wordt opgeslagen in de database
- [ ] Bestaand veld `additionalSkills` (vrije tekst) blijft behouden

---

## US-002: Uitgebreide Profielvragen voor Rapportage

### User Story
> Als deelnemer wil ik extra informatie over mezelf kunnen invullen, zodat het dashboard grappige analyses kan maken over onze groep.

### Nieuwe Velden

#### Persoonlijke Info
| Veld | Type | Opties/Bereik | Verplicht |
|------|------|---------------|-----------|
| `gender` | Select | Man, Vrouw, Anders, Zeg ik niet | Ja |
| `selfConfidence` | Slider | 1-10 ("Ik kan niks" tot "Ik ben de beste") | Ja |

#### JKV/Bovenkamer Historie
| Veld | Type | Opties/Bereik | Verplicht |
|------|------|---------------|-----------|
| `jkvJoinYear` | Select | 1990 - 2025 | Ja |
| `jkvExitYear` | Select | 2000 - 2030 (of "Nog actief in JKV") | Ja |
| `bovenkamerJoinYear` | Select | Berekend/bevestigd op basis van exit | Ja |

#### Borrel Aanwezigheid
| Veld | Type | Beschrijving |
|------|------|--------------|
| `borrelAttendance2025` | Multi-select | Welke borrels in 2025 bezocht |
| `borrelPlanning2026` | Multi-select | Welke borrels van plan in 2026 |

### Borrel Data 2026
Elke 4e donderdag van de maand:

| Datum | Opmerking |
|-------|-----------|
| 22 januari | - |
| 26 februari | - |
| 26 maart | - |
| 23 april | ⚠️ Meivakantie |
| 28 mei | - |
| 25 juni | - |
| ~~juli~~ | Vervalt (zomervakantie) |
| 27 augustus | - |
| 24 september | - |
| 22 oktober | ⚠️ Herfstvakantie |
| 26 november | - |
| december | TBD |

### Acceptatiecriteria
- [ ] Alle nieuwe velden toegevoegd aan registratieformulier
- [ ] Velden worden opgeslagen in database (tabel `registrations` uitbreiden)
- [ ] Zelfvertrouwen-slider heeft visuele feedback (emoji's of tekst)
- [ ] Borrel selectie toont datum + dag + eventuele opmerking
- [ ] Validatie: `jkvExitYear` >= `jkvJoinYear`

---

## US-003: Sarcastisch Dashboard met LLM Analyses

### User Story
> Als bezoeker van het dashboard wil ik een humoristisch overzicht zien van onze Bovenkamer groep, inclusief AI-gegenereerde analyses en scores, zodat we kunnen lachen om onszelf en onze "kwaliteiten".

### Achtergrond
De Bovenkamer is een alumni-groep van JKV Venray (Junior Kamer), voor leden die 40+ zijn. Het dashboard moet informatief én vermakelijk zijn met een sarcastische ondertoon (niet aanstootgevend).

### Dashboard Secties

#### 1. Groepsprofiel Samenvatting (LLM)
AI-gegenereerde sarcastische beschrijving van de groep:
- "Dit is een groep van X personen die denken dat..."
- Gemiddelde leeftijd, JKV-ervaring, etc.
- Algemene observaties

#### 2. Skill Scores per Categorie
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

#### 3. Segment Analyses (LLM)
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

#### 4. Superlatieven & Awards (LLM)
- "Meest Overschatte Skill"
- "Grootste Gat in het Team"
- "Meest Zelfverzekerde Nietskunner"
- "JKV Veteraan Award" (langste lidmaatschap)
- "Borrel Kampioen" (hoogste aanwezigheid)
- "Beloftes Beloftes" (veel gepland, weinig geweest)

#### 5. Borrel Statistieken
- Gemiddelde opkomst per borrel
- Voorspelling 2026 opkomst
- "Meest populaire borrel" vs "te vermijden datum"
- Vergelijking: wat mensen zeggen vs. wat ze doen

#### 6. Voorspellingen & Waarschuwingen (LLM)
AI voorspellingen voor het evenement:
- "Op basis van deze groep gaat het volgende mis..."
- "Waarschuwing: 0 mensen kunnen afwassen"
- "Verwachte discussies: muziekkeuze (3 DJ's, 3 meningen)"

### Technische Aanpak

#### LLM Integratie
- Gebruik Anthropic Claude API (al geconfigureerd)
- Prompt template met alle groepsdata
- Instructies voor sarcastische maar respectvolle toon
- Caching van analyses (niet bij elke pageload opnieuw genereren)

#### Data Aggregatie
```typescript
interface DashboardData {
  totalParticipants: number;
  genderDistribution: { male: number; female: number; other: number };
  averageAge: number;
  averageJkvYears: number;
  averageSelfConfidence: number;
  skillsPerCategory: {
    category: string;
    skills: { skill: string; count: number }[];
    coverage: number; // percentage
  }[];
  borrelStats: {
    date: string;
    attended: number;
    planned: number;
  }[];
}
```

#### Refresh Strategie
- Dashboard data: real-time uit database
- LLM analyses: gecached, handmatig te refreshen door admin
- Of: dagelijks automatisch regenereren

### Acceptatiecriteria
- [ ] Dashboard pagina toegankelijk voor alle ingelogde gebruikers
- [ ] Alle 6 secties geïmplementeerd
- [ ] LLM analyses worden gegenereerd op basis van actuele data
- [ ] Toon is sarcastisch maar niet aanstootgevend
- [ ] Analyses zijn gecached (niet bij elke pageload opnieuw)
- [ ] Admin kan analyses handmatig refreshen
- [ ] Responsive design (ook leesbaar op mobiel)
- [ ] Loading states tijdens LLM generatie

### Wireframe (tekstueel)

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

---

## US-004: Taaktoewijzing op basis van Skills (Toekomstig)

> ⚠️ **Aparte user story** - Niet in scope voor huidige sprint

### User Story
> Als organisator wil ik taken kunnen toewijzen aan deelnemers op basis van hun aangegeven skills, zodat iedereen een passende rol heeft tijdens het evenement.

### Notities
- Bouwt voort op US-001 (skill categorieën)
- Mogelijk met AI-suggesties
- Wordt later uitgewerkt

---

## Vragen / Open Punten

1. **Bestaande registraties**: Moeten mensen die al geregistreerd zijn de nieuwe velden invullen?
   - Optie A: Verplicht bij volgende login
   - Optie B: Optioneel, dashboard werkt met incomplete data
   - Optie C: Admin vult handmatig in

2. **Borrel historie 2025**: Welke datums waren er in 2025? (voor het "geweest" veld)

3. **December 2026**: Borrel wel/niet? Datum?

4. **Privacy**: Dashboard toont analyses op groepsniveau. Individuele "awards" met namen - is dat ok voor iedereen?

5. **Geboortejaar range**: Huidige range is 1980-1986. Moet dit uitgebreid worden?

---

## Prioriteit & Volgorde

1. **US-001** - Skill categorieën (registratieformulier aanpassen)
2. **US-002** - Extra profielvelden (formulier uitbreiden)
3. **US-003** - Sarcastisch dashboard (nieuwe module)
4. ~~US-004~~ - Taaktoewijzing (later)
