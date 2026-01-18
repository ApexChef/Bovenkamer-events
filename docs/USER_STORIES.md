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
| `birthDate` | Date | Datum picker | Ja |
| `gender` | Select | Man, Vrouw, Anders, Zeg ik niet | Ja |
| `selfConfidence` | Slider | 1-10 ("Ik kan niks" tot "Ik ben de beste") | Ja |

> ⚠️ **Validatie**: Soft validatie op `birthDate` - gebruiker moet minimaal 40 jaar oud zijn op moment van inschrijving. Toon waarschuwing maar blokkeer niet.

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

### Borrel Data
Elke 4e donderdag van de maand (10 per jaar, geen juli/december):

#### 2025 (voor "geweest" tracking)
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

#### 2026 (voor "planning" tracking)
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

### Acceptatiecriteria
- [ ] Alle nieuwe velden toegevoegd aan registratieformulier
- [ ] Velden worden opgeslagen in database (tabel `registrations` uitbreiden)
- [ ] Geboortedatum picker met soft validatie (40+ waarschuwing, niet blokkerend)
- [ ] Zelfvertrouwen-slider heeft visuele feedback (emoji's of tekst)
- [ ] Borrel selectie toont datum + dag + eventuele opmerking
- [ ] Validatie: `jkvExitYear` >= `jkvJoinYear`
- [ ] 2025 borrels als "geweest" checkboxes (10 datums)
- [ ] 2026 borrels als "van plan" checkboxes (10 datums)

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

## US-005: Burger Stack Mini-Game

### User Story
> Als Bovenkamer-lid wil ik een leuk burger-stapelspel kunnen spelen op mijn telefoon, zodat ik punten kan verdienen en kan strijden om de hoogste score vóór het evenement.

### Achtergrond
Een simpel, verslavend mini-game geïnspireerd op "Stack" spellen. Spelers stapelen hamburger-ingrediënten door op het juiste moment te tikken. Hoe hoger de stapel, hoe meer punten. Mobile-first, maar ook speelbaar op desktop.

### Gameplay Mechanics

#### Basisspel
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

#### Spelregels
1. Ingrediënten bewegen horizontaal over het scherm
2. Speler tikt om te droppen
3. Alleen het overlappende deel blijft (zoals Stack)
4. Spel eindigt als de stapel te smal wordt of je mist
5. Elk ingrediënt geeft punten (zie tabel)

#### Ingrediënten & Punten
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

#### Speciale Items (Random spawns)
| Item | Effect | Visueel |
|------|--------|---------|
| Gouden Biefstuk | 3x punten volgende drop | ✨🥩✨ |
| Slow-mo Saus | Vertraagt beweging 5 sec | 🍯 |
| Extra Leven | Eén misser toegestaan | ❤️ |
| Brand! | Snelheid x2 tijdelijk | 🔥 |

#### Combo Systeem
- Perfect drop (100% overlap): **2x punten + combo teller**
- 5 combo's: Bonus ingrediënt
- 10 combo's: "GRILL MASTER" badge + puntenregen

### Scoring & Highscores

#### Puntentelling
```typescript
interface GameScore {
  odlng: number;       // Aantal ingrediënten gestapeld
  perfectDrops: number; // Aantal perfecte drops
  maxCombo: number;     // Hoogste combo streak
  totalPoints: number;  // Eindstand
  duration: number;     // Speeltijd in seconden
  specialItems: number; // Aantal speciale items gepakt
}
```

#### Highscore Board
- **All-time Top 10** - Beste scores ooit
- **Vandaag** - Dagelijkse competitie
- **Persoonlijk record** - Jouw beste poging
- **Meeste pogingen** - Wie is het meest verslaafd?

#### Integratie met App
- Scores koppelen aan `game_points` in users tabel
- Top 3 krijgt bonuspunten voor eindklassement
- Achievements unlocken

### AI Persona: "De Grill Guru"

#### Karakter
> **De Grill Guru** is een mysterieuze, alwetende BBQ-meester die sarcastische wijsheden deelt. Hij spreekt in raadselachtige one-liners en heeft een mening over alles en iedereen. Denk: Mr. Miyagi meets Gordon Ramsay meets die ene oom op elk feestje.

#### Kennis van de Groep
De Grill Guru kent ALLE deelnemers persoonlijk, niet alleen spelers. Hij gebruikt:
- **Profieldata**: Naam, geboortedatum, geslacht, JKV-jaren
- **Skills**: Alle 8 skill-categorieën en zelfvertrouwen-score
- **Registratie antwoorden**: Guilty pleasure songs, beste concert, verborgen talent, etc.
- **Borrel aanwezigheid**: Wie komt wel/niet, beloftes vs. realiteit
- **Spelstatistieken**: Voor wie wel speelt
- **Onderlinge relaties**: Wie kent wie het langst, partners, etc.

Dit maakt roasts herkenbaar en persoonlijk voor de hele groep.

#### Voorbeelduitspraken (LLM gegenereerd)
**Bij game start:**
- "Ah, [NAAM]... [JKV_JAREN] jaar JKV-ervaring en je denkt nu pas te kunnen stapelen?"
- "Iemand die [SKILL] als vaardigheid claimt. Laten we zien of je coördinatie beter is."

**Bij game over:**
- "Een ware meester faalt 1000 keer. Jij zit nu op [X]. Doorgaan."
- "[NAAM], met een zelfvertrouwen van [SCORE]/10 had ik meer verwacht. Of juist minder."

**Bij highscore:**
- "De vlam brandt fel in jou, [NAAM]. Net als die keer op [BORREL_DATUM] blijkbaar."
- "Eindelijk. [GEBOORTEJAAR]-generatie doet iets goed."

**Bij achievements:**
- "Je hebt de Gouden Spatel verdiend. Meer dan [ANDERE_SPELER] ooit zal bereiken."

#### Admin System Prompt Configuratie
De admin kan de Grill Guru persoonlijkheid aanpassen:

```typescript
interface GrillGuruConfig {
  systemPrompt: string;          // Basis persoonlijkheid
  roastIntensity: 1 | 2 | 3;     // 1=mild, 2=medium, 3=spicy
  useInsideJokes: boolean;       // Referenties naar groepsgeschiedenis
  excludeTopics: string[];       // Onderwerpen om te vermijden
  customInstructions: string;    // Extra instructies van admin
  lastUpdated: Date;
  updatedBy: string;
}
```

**Admin UI voor System Prompt:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ GRILL GURU CONFIGURATIE                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Basis Persoonlijkheid:                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Je bent De Grill Guru, een sarcastische BBQ-    │   │
│  │ meester. Je kent alle Bovenkamer leden. Je      │   │
│  │ maakt grappen maar bent nooit gemeen. Je hebt   │   │
│  │ een zwak voor [AANPASBAAR]...                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Roast Intensiteit: [====○----] Medium                 │
│                                                         │
│  ☑️ Gebruik inside jokes                                │
│  ☑️ Refereer aan registratie-antwoorden                 │
│  ☐ Noem specifieke borrel-incidenten                   │
│                                                         │
│  Vermijd deze onderwerpen:                             │
│  [werk] [x]  [relaties] [x]  [+ toevoegen]             │
│                                                         │
│  [💾 Opslaan]  [👁️ Preview]  [🔄 Reset naar default]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Analytics Dashboard (In-App)

#### Zichtbaar voor Spelers
```
┌─────────────────────────────────────────────────────────┐
│  🍔 BURGER STACK LEADERBOARD                            │
├─────────────────────────────────────────────────────────┤
│  🥇 1. Klaas      │ 15.420 pts │ 47 lagen │ 🔥12 combo │
│  🥈 2. Marie      │ 12.100 pts │ 38 lagen │ 🔥8 combo  │
│  🥉 3. Piet       │ 11.890 pts │ 41 lagen │ 🔥10 combo │
│  ...                                                    │
│  12. Jij         │ 3.200 pts  │ 15 lagen │ 🔥3 combo  │
├─────────────────────────────────────────────────────────┤
│  📊 JOUW STATS                                          │
│  • Totaal gespeeld: 47 games                           │
│  • Gemiddelde score: 2.840                             │
│  • Beste combo: 5                                       │
│  • Favoriete ingrediënt: 🧀 (42x perfect gedropt)      │
│  • Grill Guru zegt: "Je bent consistent... slecht."    │
└─────────────────────────────────────────────────────────┘
```

### Event Roast Mode (Admin/Projectie)

#### Verborgen Analytics voor Live Roasts
Tijdens het evenement kan de quizmaster/admin "roast cards" tonen:

```
┌─────────────────────────────────────────────────────────┐
│  🎭 ROAST VAN DE AVOND                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏆 "DE BURGER OBSESSIE AWARD"                         │
│  Gaat naar: PIET                                        │
│                                                         │
│  "147 pogingen. Gemiddelde score: 2.100.               │
│   Dat is 12 uur van je leven die je niet terugkrijgt.  │
│   Je hoogste combo was 4. Vier. Mijn oma haalt 6.      │
│   De Grill Guru adviseert: probeer Candy Crush."       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Roast Categorieën - Spelers
| Award | Criteria | Data gebruikt |
|-------|----------|---------------|
| Burger Obsessie | Meeste pogingen | game_count, totale speeltijd |
| One Hit Wonder | Hoge score, weinig games | best_score vs game_count |
| De Volhouder | Veel games, lage scores | avg_score, game_count |
| Combo Killer | Nooit boven 3 combo | max_combo historie |
| Speed Demon | Snelste game overs | avg_duration, min_layers |
| Late Bloomer | Beste score op laatste dag | score_timeline |
| Guilty Pleasure Gamer | Speelt 's nachts | timestamps analyse |
| De Occasionele | Lang niet gespeeld, plots wel | last_played gaps |

#### Roast Categorieën - Niet-Spelers ("Schaduw Roasts")
Deelnemers die NIET hebben gespeeld worden ook geroast op basis van hun profiel:

| Award | Criteria | Data gebruikt |
|-------|----------|---------------|
| Te Cool Voor School | 0 games gespeeld | games_played = 0 |
| De Drukke | Zegt altijd bezig te zijn | borrel_planned vs attended |
| Zelfoverschatter | Hoog zelfvertrouwen, durft niet | selfConfidence vs games |
| JKV Veteraan | Langste lidmaatschap, speelt niet | jkvYears, games_played |
| De Mysterieuze | Minste profiel ingevuld | profile_completeness |
| Beloftes Beloftes | Zegt te komen, komt niet | borrel attendance ratio |
| De Wijze | Oudste deelnemer | birthDate |
| Social Butterfly | Kent iedereen het langst | longestKnownMember data |

#### LLM Roast Generator
**Alle roasts worden volledig door de LLM gegenereerd.** De admin configureert alleen de toon en grenzen.

Input voor elke roast:
```typescript
interface RoastContext {
  // Doelwit
  target: {
    name: string;
    profile: UserProfile;         // Alle profielvelden
    registrationAnswers: object;  // Quiz antwoorden
    skills: SkillSelection[];     // 8 categorieën
    gameStats?: GameStats;        // Alleen als gespeeld
    borrelStats: BorrelStats;     // Aanwezigheid
  };

  // Context
  allParticipants: UserProfile[]; // Voor vergelijkingen
  groupStats: GroupStats;         // Gemiddeldes, extremen

  // Configuratie
  guruConfig: GrillGuruConfig;    // Admin instellingen
  roastType: string;              // Welke award/categorie
}
```

**Voorbeeld LLM Prompt (intern):**
```
Je bent De Grill Guru. Genereer een roast voor [NAAM] die de
"Te Cool Voor School" award krijgt (0 games gespeeld).

Gebruik deze info:
- Zelfvertrouwen: 8/10
- Claimt te kunnen: BBQ-en, DJ-en
- Guilty pleasure song: [X]
- JKV sinds: 2005
- Borrel aanwezigheid: 3/10 gepland, 1/10 geweest

Vergelijk met de groep waar 12/15 mensen WEL hebben gespeeld.

Roast intensiteit: Medium
Vermijd: [geconfigureerde onderwerpen]
```

### UI/UX Design

#### Thema Systeem
```typescript
interface GameTheme {
  name: string;
  background: string;
  ingredientStyle: 'realistic' | 'cartoon' | 'pixel';
  music: string;
  unlockCondition?: string;
}

const themes: GameTheme[] = [
  { name: 'Klassiek', background: 'bbq-grill', ingredientStyle: 'cartoon', music: 'chill-bbq' },
  { name: 'Nacht BBQ', background: 'night-fire', ingredientStyle: 'realistic', music: 'evening-jazz', unlockCondition: '10 games gespeeld' },
  { name: 'Retro', background: 'pixel-garden', ingredientStyle: 'pixel', music: '8bit-cooking', unlockCondition: '5000 punten' },
  { name: 'Bovenkamer', background: 'jk-venray', ingredientStyle: 'cartoon', music: 'dutch-hits', unlockCondition: 'Verborgen' },
];
```

#### Responsive Design
- **Mobile (primair)**: Touch controls, portrait mode
- **Tablet**: Optioneel landscape
- **Desktop**: Click controls, keyboard shortcuts (spatie = drop)

#### Animaties
- Smooth ingrediënt beweging (60fps)
- Satisfying drop animatie
- Shake bij miss
- Confetti bij highscore
- Grill Guru pop-up bij milestones

### Technische Implementatie

#### Stack
- **Game Engine**: Canvas API of Phaser.js (lightweight)
- **State**: Zustand (zoals rest van app)
- **Backend**: Bestaande Supabase
- **Scores API**: `/api/game/scores`

#### Database Uitbreiding
```sql
-- Nieuwe tabel voor game scores
CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  game_type VARCHAR(50) DEFAULT 'burger_stack',
  score INTEGER NOT NULL,
  layers INTEGER,
  max_combo INTEGER,
  perfect_drops INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index voor leaderboard queries
CREATE INDEX idx_game_scores_leaderboard ON game_scores(game_type, score DESC);
```

#### API Endpoints
| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/game/scores` | GET | Haal leaderboard op |
| `/api/game/scores` | POST | Nieuwe score opslaan |
| `/api/game/stats/[userId]` | GET | Persoonlijke statistieken |
| `/api/game/roast/[userId]` | GET | Genereer LLM roast |
| `/api/game/roast/random` | GET | Random roast voor event |

### Acceptatiecriteria

#### MVP (Fase 1)
- [ ] Basis gameplay werkend (tap to drop, stacking)
- [ ] Score systeem functioneel
- [ ] Mobile-first responsive design
- [ ] Highscore opslaan in database
- [ ] Simpel leaderboard tonen
- [ ] Koppeling met bestaande auth (ingelogde gebruikers)

#### Uitbreiding (Fase 2)
- [ ] Speciale items implementeren
- [ ] Combo systeem met visuele feedback
- [ ] Grill Guru commentaar (statische teksten eerst)
- [ ] Thema's unlockbaar
- [ ] Persoonlijke statistieken pagina

#### Event Features (Fase 3)
- [ ] LLM Roast Generator voor live event
- [ ] Admin panel voor roast selectie
- [ ] Projectie-modus voor groot scherm
- [ ] Export roasts als afbeeldingen

### Grill Guru Logging

Alle LLM-gegenereerde commentaren worden gelogd voor analyse en hergebruik:

```sql
-- Logging tabel voor Grill Guru uitspraken
CREATE TABLE grill_guru_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  context_type VARCHAR(50),        -- 'game_start', 'game_over', 'highscore', 'roast', etc.
  trigger_data JSONB,              -- Input data die de comment triggerde
  generated_text TEXT,             -- De gegenereerde uitspraak
  roast_category VARCHAR(100),     -- Welke award/categorie (indien roast)
  intensity_used INTEGER,          -- 1-3 schaal
  tokens_used INTEGER,             -- Voor kosten tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index voor analyse
CREATE INDEX idx_guru_logs_user ON grill_guru_logs(user_id);
CREATE INDEX idx_guru_logs_type ON grill_guru_logs(context_type);
```

**Gebruik van logs:**
- Admin kan populaire/grappige uitspraken terugvinden
- Hergebruik beste roasts tijdens event
- Analyse welke contexts de beste output geven
- Kosten monitoring (tokens per dag/user)

### Multiplayer: Async Challenge Mode

**Concept:** Spelers kunnen elkaar uitdagen vóór het event. Async (niet real-time).

#### Flow
```
┌─────────────────────────────────────────────────────────┐
│  🎯 UITDAGING                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Jouw score: 8.450 pts (32 lagen)                      │
│                                                         │
│  Daag iemand uit:                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Klaas   │ │ Marie   │ │ Piet    │ │ Jan     │      │
│  │ 🟢 online│ │ ⚪ 2u   │ │ 🟢 online│ │ ⚪ 1d   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  [📤 Verstuur Uitdaging]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Challenge Notificatie
```
┌─────────────────────────────────────────────────────────┐
│  ⚔️ NIEUWE UITDAGING!                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [NAAM] daagt je uit!                                   │
│  Hun score: 8.450 pts                                   │
│                                                         │
│  Grill Guru zegt:                                       │
│  "Laat je dit zomaar gebeuren? Je zelfvertrouwen       │
│   van 7/10 suggereert van niet."                       │
│                                                         │
│  [🎮 Accepteer]  [😴 Later]  [🏳️ Weiger]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Resultaat
```
┌─────────────────────────────────────────────────────────┐
│  🏆 DUEL RESULTAAT                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│       [NAAM 1]          vs         [NAAM 2]            │
│        8.450 pts         ⚔️         9.120 pts          │
│        32 lagen                     38 lagen           │
│                                                         │
│                    🎉 WINNAAR! 🎉                       │
│                                                         │
│  Grill Guru zegt:                                       │
│  "[WINNAAR] wint! [VERLIEZER], met jouw guilty        │
│   pleasure '[SONG]' had ik beter verwacht. Of juist   │
│   niet."                                                │
│                                                         │
│  [🔄 Rematch]  [📤 Deel]  [🏠 Menu]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Database voor Challenges
```sql
CREATE TABLE game_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID REFERENCES users(id),
  challenged_id UUID REFERENCES users(id),
  challenger_score_id UUID REFERENCES game_scores(id),
  challenged_score_id UUID REFERENCES game_scores(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, completed, declined, expired
  winner_id UUID REFERENCES users(id),
  guru_comment TEXT,                     -- LLM gegenereerd resultaat commentaar
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                  -- Challenge verloopt na X dagen
  completed_at TIMESTAMP
);
```

### Beslissingen US-005

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
| Dagelijkse challenges | Nee, niet in MVP (zie toekomstige uitbreidingen) |
| Live quiz integratie | Nee, game blijft puur pre-event |
| Challenge expiratie | Geen tijdslimiet - hoogste score wint |

### Challenge Winnaar Bepaling

Challenges hebben geen expiratie. De winnaar wordt bepaald door:
- **Hoogste score wint** - Wie de meeste punten haalt
- Beide spelers kunnen onbeperkt proberen tot ze tevreden zijn
- Challenge blijft open tot beide partijen klaar zijn of tot event-datum

```
┌─────────────────────────────────────────────────────────┐
│  ⚔️ LOPENDE CHALLENGE                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Jij: 8.450 pts (beste poging)                         │
│  vs                                                     │
│  Klaas: 7.200 pts (beste poging)                       │
│                                                         │
│  Status: Jij leidt! 🏆                                  │
│                                                         │
│  [🎮 Verbeter je score]  [✅ Ik ben klaar]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Toekomstige Uitbreidingen (Backlog)

De volgende features zijn gedocumenteerd maar NIET in scope voor MVP:

#### Dagelijkse Challenges
Speciale spelvarianten met eigen leaderboard:
| Challenge | Beschrijving |
|-----------|--------------|
| "Bacon Day" | Alleen bacon ingrediënten (zeer snel) |
| "Vegetarisch" | Geen vlees, alleen groenten |
| "Speed Run" | Alles 2x sneller |
| "Combo King" | Alleen combo's tellen voor punten |
| "One Life" | Geen fouten toegestaan |

*Implementatie: Automatisch roterende challenges, elke dag om middernacht nieuwe challenge.*

#### Live Event Modus
Projectie battle tijdens het evenement:
- 4-8 spelers tegelijk op telefoon
- Live scores op groot scherm
- Tijdslimiet (60-90 sec)
- Winnaar krijgt quiz-punten

*Reden uitgesteld: Focus op pre-event engagement, live event heeft al quiz.*

---

## US-006: Einde-Avond Awards & Persoonlijke Samenvattingen

### User Story
> Als Bovenkamer-lid wil ik aan het einde van de avond een persoonlijke samenvatting ontvangen op mijn telefoon, gebaseerd op al mijn data, zodat ik kan lachen om mezelf en zelf kan kiezen of ik dit met de groep deel.

### Achtergrond
Geïnspireerd op JKV traditie waar aan het einde van het jaar awards werden uitgereikt (zoals "De Bezem" voor wie het laatst naar huis ging). Nu een digitale versie met LLM-gegenereerde persoonlijke samenvattingen die ALLE beschikbare data combineren.

### Concept

#### Flow
```
┌─────────────────────────────────────────────────────────┐
│  EINDE VAN DE AVOND (±23:00)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Admin activeert "Awards Modus"                      │
│                                                         │
│  2. Iedereen krijgt notificatie:                        │
│     "🏆 Je persoonlijke Bovenkamer-rapport is klaar!"   │
│                                                         │
│  3. Elk persoon opent rapport op eigen telefoon         │
│                                                         │
│  4. Keuze: [🔒 Alleen voor mij] of [📢 Delen met groep] │
│                                                         │
│  5. Gedeelde rapporten verschijnen op Live Dashboard    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Persoonlijk Rapport

Elke deelnemer ontvangt een uniek, LLM-gegenereerd rapport:

```
┌─────────────────────────────────────────────────────────┐
│  🎭 JOUW BOVENKAMER RAPPORT 2026                        │
│  Voor: [NAAM]                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏆 JOUW AWARDS                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🧹 DE BEZEM                                      │   │
│  │ "Weer de laatste die wegging. Sommige dingen    │   │
│  │  veranderen nooit. Net als je guilty pleasure:  │   │
│  │  [SONG]."                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 JOUW AVOND IN CIJFERS                               │
│  • Burger Stack gespeeld: 12x (hoogste: 8.450)         │
│  • Quiz positie: #4 van 15                              │
│  • Voorspellingen correct: 3/8                          │
│  • Tijd bij de BBQ: 45 min (claimde: "expert")         │
│                                                         │
│  💬 DE GRILL GURU OVER JOU                              │
│  "Na 18 jaar JKV zou je denken dat [NAAM] wist         │
│   wanneer het tijd is om te gaan. Maar nee. Met       │
│   een zelfvertrouwen van 8/10 en 0 afwas-skills       │
│   stond je tot 3:00 te discussiëren over [TOPIC].     │
│   Je partner [PARTNER] is een heilige."               │
│                                                         │
│  🔮 VOORSPELLING VOOR VOLGEND JAAR                      │
│  "Je zegt 8/10 borrels te komen. We zetten in op 3."   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [🔒 Alleen voor mij]  [📢 Delen met groep]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Award Categorieën

#### Klassieke JKV Awards (gemoderniseerd)
| Award | Criteria | Data |
|-------|----------|------|
| 🧹 De Bezem | Laatste die wegging | Event check-out tijd |
| 🌅 De Vroege Vogel | Eerste die wegging | Event check-out tijd |
| 🎤 De Karaoke Koning | Meeste "spontane" optredens | Live tracking/voting |
| 🍖 De Grill Sergeant | Langste tijd bij BBQ | Self-report of tracking |
| 🍷 De Sommelier | Meeste wijn gedronken (self-report) | Fun survey |

#### Data-Gedreven Awards
| Award | Criteria | Data |
|-------|----------|------|
| 🎮 De Burger Baas | Hoogste Burger Stack score | game_scores |
| 🔮 De Waarzegger | Meeste voorspellingen correct | predictions |
| 🧠 De Quizmaster | Hoogste quiz score | quiz_answers |
| 📱 De Verslaafde | Meeste app-gebruik | activity_logs |
| 🎯 De Overschatter | Grootste verschil claim vs realiteit | skills vs performance |
| 💬 De Netwerker | Kent iedereen het langst | longestKnownMember |
| 👴 De Veteraan | Langste JKV-carrière | jkvJoinYear |
| 🌟 De Rookie | Nieuwste Bovenkamer-lid | bovenkamerJoinYear |

#### Borrel-Gerelateerde Awards
| Award | Criteria | Data |
|-------|----------|------|
| 📅 De Trouwe | Hoogste borrel-opkomst 2025 | borrelAttendance2025 |
| 🤥 De Optimist | Meeste beloofd, minste gekomen | planned vs attended |
| 👻 De Geest | Minste borrels bezocht | borrelAttendance2025 |

#### Combinatie Awards (LLM bepaalt)
| Award | Beschrijving |
|-------|--------------|
| 🎭 De Dubbelganger | "Je claimt X maar doet Y" |
| 🏆 De Allrounder | Goed in alles, uitblinker in niks |
| 🎪 De Entertainer | Combinatie van alle sociale data |
| 🤔 De Mysterie | Minste data ingevuld, meeste vragen |

### Live Sharing Dashboard

Wanneer iemand kiest voor "Delen met groep":

```
┌─────────────────────────────────────────────────────────┐
│  📺 BOVENKAMER AWARDS LIVE                    [12/15 gedeeld] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🆕 NIEUW RAPPORT GEDEELD!                       │   │
│  │                                                  │   │
│  │ KLAAS krijgt: 🧹 DE BEZEM                       │   │
│  │                                                  │   │
│  │ "Weer de laatste. Na 18 jaar JKV weet hij      │   │
│  │  nog steeds niet wanneer het feest voorbij     │   │
│  │  is. Zijn guilty pleasure 'Dancing Queen'      │   │
│  │  verklaart veel."                               │   │
│  │                                                  │   │
│  │                              [👍 23] [😂 45]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Marie    │ │ Piet     │ │ Jan      │  ... +9       │
│  │ 🎮       │ │ 🔮       │ │ 🧹       │               │
│  │ Gedeeld  │ │ Gedeeld  │ │ Wacht... │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  [📊 Alle Awards]  [🏆 Leaderboard]  [⏭️ Volgende]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Dashboard Features
- **Real-time updates** wanneer iemand deelt
- **Reacties**: 👍 😂 🔥 emoji reactions
- **Queue systeem**: Rapporten worden één voor één getoond
- **Skip optie**: Admin kan doorgaan naar volgende
- **Projectie-modus**: Optimaal voor groot scherm

### Data Combinatie voor Rapport

Het rapport combineert ALLE beschikbare data:

```typescript
interface PersonalReportData {
  // Profiel
  profile: {
    name: string;
    birthDate: Date;
    gender: string;
    jkvJoinYear: number;
    jkvExitYear: number;
    bovenkamerJoinYear: number;
    selfConfidence: number;
    partner?: string;
  };

  // Skills & Registratie
  skills: SkillSelection[];        // 8 categorieën
  registrationAnswers: {
    guiltyPleasureSong: string;
    bestConcert: string;
    hiddenTalent: string;
    childhoodDream: string;
    // ... alle quiz antwoorden
  };

  // Borrel Geschiedenis
  borrelStats: {
    attended2025: string[];        // Welke borrels
    planned2026: string[];         // Welke gepland
    attendanceRatio: number;       // % gekomen vs gepland
  };

  // Game Performance
  gameStats?: {
    burgerStackPlayed: number;
    burgerStackHighscore: number;
    totalGamePoints: number;
    favoriteIngredient: string;
  };

  // Quiz & Predictions
  quizStats?: {
    totalScore: number;
    rank: number;
    bestCategory: string;
  };
  predictionStats?: {
    correct: number;
    total: number;
    bestPrediction: string;
  };

  // Event-Specifiek (live tracking)
  eventStats?: {
    checkInTime: Date;
    checkOutTime?: Date;
    bbqTime: number;              // Minuten bij de grill
    activitiesJoined: string[];
  };

  // Vergelijking met groep
  groupComparison: {
    ageRank: number;              // Oudste/jongste
    jkvVeteranRank: number;       // Ervaring
    gameRank: number;
    socialRank: number;           // Borrel opkomst
  };
}
```

### LLM Rapport Generator

```typescript
interface ReportGeneratorConfig {
  // Input
  participantData: PersonalReportData;
  allParticipants: PersonalReportData[];  // Voor vergelijkingen
  guruConfig: GrillGuruConfig;

  // Output instructies
  sections: {
    awards: boolean;              // Welke awards verdient deze persoon
    statsOverview: boolean;       // Cijfers samenvatting
    guruRoast: boolean;           // Persoonlijke roast
    prediction: boolean;          // Voorspelling volgend jaar
    insideJokes: boolean;         // Referenties naar registratie-antwoorden
  };

  // Constraints
  maxLength: number;              // Max karakters
  roastIntensity: 1 | 2 | 3;
  excludeTopics: string[];
}
```

**Voorbeeld LLM Prompt:**
```
Je bent De Grill Guru. Genereer een persoonlijk jaarrapport voor [NAAM].

Beschikbare data:
- 18 jaar JKV (langste van de groep!)
- Zelfvertrouwen: 8/10, claimt "BBQ expert"
- Burger Stack: 12 games, hoogste 8.450 (rank #3)
- Quiz: #4 van 15
- Voorspellingen: 3/8 correct
- Borrel 2025: 4/10 geweest (8/10 gepland)
- Guilty pleasure: "Dancing Queen"
- Partner: Marie
- Check-out tijd: 03:15 (laatste!)

Vergelijking met groep:
- Oudste: nee (#4)
- Langste JKV: JA (#1!)
- Beste gamer: #3
- Trouwste borrelganger: #8

Genereer:
1. Welke awards verdient hij (kies 2-3 passende)
2. Een sarcastische samenvatting van zijn avond
3. Een voorspelling voor volgend jaar

Roast intensiteit: Medium
Vermijd: [geconfigureerd]
```

### Admin Controls

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ AWARDS CONFIGURATIE (Admin)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Status: [🔴 Inactief]  [🟢 Activeer Awards Modus]      │
│                                                         │
│  Timing:                                                │
│  • Auto-activeren om: [23:00] ⏰                        │
│  • Of: [▶️ Nu Handmatig Starten]                        │
│                                                         │
│  Rapporten:                                             │
│  • [🔄 Genereer Alle Rapporten] (duurt ±2 min)         │
│  • Status: 15/15 gegenereerd ✅                         │
│                                                         │
│  Live Dashboard:                                        │
│  • [📺 Open Projectie Scherm]                          │
│  • [⏭️ Forceer Volgende]                               │
│  • [🔇 Pauzeer Queue]                                  │
│                                                         │
│  Pre-generatie:                                        │
│  ☑️ Genereer rapporten vooraf (aanbevolen)             │
│  ☐ Genereer live (langzamer, duurder)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Privacy & Consent

```
┌─────────────────────────────────────────────────────────┐
│  🔒 PRIVACY INSTELLINGEN                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Je rapport is ALLEEN voor jou zichtbaar totdat je     │
│  kiest om te delen.                                     │
│                                                         │
│  [🔒 Houd privé]                                       │
│  → Alleen jij ziet je rapport                          │
│  → Verschijnt NIET op het grote scherm                 │
│  → Awards tellen wel mee voor statistieken             │
│                                                         │
│  [📢 Deel met groep]                                   │
│  → Verschijnt op het live dashboard                    │
│  → Anderen kunnen reageren (emoji's)                   │
│  → Je kunt dit later niet ongedaan maken               │
│                                                         │
│  Tip: Je kunt eerst lezen, dan beslissen!              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Scherpte Aanpassen (Regenerate)

Gebruikers kunnen hun rapport laten regenereren met andere scherpte. **Max 3 keer.**

```
┌─────────────────────────────────────────────────────────┐
│  🌶️ SCHERPTE AANPASSEN                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Huidige scherpte: ████████░░ (80%)                    │
│                                                         │
│  Te scherp? Te mild? Pas aan:                          │
│                                                         │
│  😇 ──────●────── 😈                                    │
│  Mild    Medium    Spicy                                │
│                                                         │
│  [🔄 Regenereer Rapport]                                │
│                                                         │
│  ⚠️ Nog 2 van 3 aanpassingen over                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Scherpte Schaal (stappen van 5)
| Waarde | Label | Beschrijving |
|--------|-------|--------------|
| 0-20 | 😇 Fluweelzacht | Bijna alleen complimenten |
| 25-40 | 🙂 Mild | Lichte humor, geen scherpe kantjes |
| 45-60 | 😏 Medium | Standaard, vriendelijke roast |
| 65-80 | 😈 Spicy | Scherpe opmerkingen, confronterend |
| 85-100 | 🔥 Genadeloos | Volledige roast, geen genade |

#### Zichtbaar op Dashboard
Als iemand deelt, toont het dashboard hun gekozen scherpte:

```
┌─────────────────────────────────────────────────────────┐
│  🆕 NIEUW RAPPORT GEDEELD!                              │
│                                                         │
│  KLAAS krijgt: 🧹 DE BEZEM                              │
│                                                         │
│  Scherpte: ██████████ 100% 🔥                          │
│  (Klaas vroeg om MEER scherpte!)                        │
│                                                         │
│  "Weer de laatste. Na 18 jaar JKV weet hij             │
│   nog steeds niet wanneer het feest voorbij            │
│   is. Met een guilty pleasure als 'Dancing             │
│   Queen' is dat misschien maar beter ook."             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  🆕 NIEUW RAPPORT GEDEELD!                              │
│                                                         │
│  PIET krijgt: 🎮 BURGER BAAS                           │
│                                                         │
│  Scherpte: ████░░░░░░ 40% 😇                           │
│  (Piet heeft 3x om milder gevraagd... 🐔)              │
│                                                         │
│  "Piet heeft veel Burger Stack gespeeld.               │
│   Heel veel. Echt heel erg veel."                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Roast Materiaal
Het aantal regeneraties wordt zelf roast materiaal:

| Regeneraties | Dashboard Tekst | Extra Roast |
|--------------|-----------------|-------------|
| 0 | - | Neutraal |
| 1 (milder) | "Vroeg om milder..." | Grill Guru noemt dit |
| 2 (milder) | "Twee keer milder gevraagd..." | Extra aandacht |
| 3 (milder) | "3x om milder gevraagd 🐔" | "Kan er niet tegen" |
| 1+ (scherper) | "Vroeg om MEER!" | Respect emoji 💪 |
| Max scherp | "100% - durft alles" | Held status |

#### Database Tracking
```sql
-- Toevoegen aan personal_reports tabel
ALTER TABLE personal_reports ADD COLUMN intensity_chosen INTEGER DEFAULT 60;
ALTER TABLE personal_reports ADD COLUMN regeneration_count INTEGER DEFAULT 0;
ALTER TABLE personal_reports ADD COLUMN intensity_history JSONB DEFAULT '[]';
-- Bijv: [{"intensity": 80, "timestamp": "...", "direction": "initial"},
--        {"intensity": 40, "timestamp": "...", "direction": "milder"}]
```

### Database Schema

```sql
-- Persoonlijke rapporten
CREATE TABLE personal_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  event_year INTEGER NOT NULL,
  report_data JSONB NOT NULL,           -- Alle input data
  generated_content TEXT NOT NULL,      -- LLM output
  awards JSONB NOT NULL,                -- Welke awards
  is_shared BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP,
  reactions JSONB DEFAULT '{}',         -- {userId: emoji}
  generated_at TIMESTAMP DEFAULT NOW(),
  tokens_used INTEGER
);

-- Event check-in/out voor live tracking
CREATE TABLE event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  activities JSONB DEFAULT '[]',        -- Welke activiteiten
  self_reported_data JSONB              -- Fun survey antwoorden
);

-- Reacties op gedeelde rapporten
CREATE TABLE report_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES personal_reports(id),
  user_id UUID REFERENCES users(id),
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(report_id, user_id)            -- 1 reactie per persoon
);
```

### Acceptatiecriteria

#### MVP (Fase 1)
- [ ] Admin kan "Awards Modus" activeren
- [ ] Rapporten worden gegenereerd voor alle deelnemers
- [ ] Elk persoon ziet eigen rapport op telefoon
- [ ] Basis award categorieën (5-8 awards)
- [ ] Keuze: privé houden of delen

#### Uitbreiding (Fase 2)
- [ ] Live dashboard met queue systeem
- [ ] Emoji reactions op gedeelde rapporten
- [ ] Projectie-modus voor groot scherm
- [ ] Event check-in/out tracking
- [ ] Real-time notificaties

#### Polish (Fase 3)
- [ ] Animaties bij nieuwe shares
- [ ] Sound effects (optioneel)
- [ ] Export rapport als afbeelding
- [ ] Jaarlijkse vergelijking (als er meerdere events zijn)

### Open Vragen US-006

1. **Event tracking**: Hoe tracken we check-in/out tijden? (QR code? Handmatig? Honor system?)
2. **Fun survey**: Willen we een korte survey tijdens het event? ("Hoeveel wijn heb je gedronken?")
3. **Reactie types**: Welke emoji's voor reactions? (👍 😂 🔥 😱 ?)
4. **Timing**: Wanneer precies activeren? (Vaste tijd of admin kiest?)

---

## Beslissingen

| Vraag | Beslissing |
|-------|------------|
| Bestaande registraties | N.v.t. - app is nog niet live |
| Borrel historie 2025 | 10 borrels, elke 4e donderdag (geen juli/december) |
| December borrels | Vervallen (zowel 2025 als 2026) |
| Privacy | Geen issue - individuele awards met namen zijn toegestaan |
| Geboortejaar → Geboortedatum | Volledige geboortedatum met soft validatie (40+ bij inschrijving) |

---

## Prioriteit & Volgorde

1. **US-001** - Skill categorieën (registratieformulier aanpassen)
2. **US-002** - Extra profielvelden (formulier uitbreiden)
3. **US-005** - Burger Stack mini-game (MVP)
4. **US-003** - Sarcastisch dashboard (nieuwe module)
5. **US-006** - Einde-avond awards & persoonlijke samenvattingen
6. ~~US-004~~ - Taaktoewijzing (later)
