# US-007: Progressieve Registratie met Punten

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | #1 (Hoogste) |
| **Status** | In Planning |
| **Complexiteit** | Medium-Hoog |
| **PACT Fase** | Prepare + Architecture |

## User Story
> Als deelnemer wil ik snel kunnen registreren met alleen mijn naam en e-mail, en later mijn profiel verder aanvullen voor extra punten, zodat de drempel laag is maar ik toch gemotiveerd word om alles in te vullen.

## Achtergrond
De huidige registratie vereist alle stappen in één keer. Dit kan een barrière zijn. Door gefaseerde registratie met puntenbeloning wordt de drempel verlaagd én wordt engagement verhoogd.

## Registratie Fases

### Fase 0: Minimale Registratie (Verplicht)
```
┌─────────────────────────────────────────────────────────────┐
│  📝 AANMELDEN BOVENKAMER WINTERPROEF                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Naam: [_______________________]                            │
│                                                              │
│  E-mail: [_______________________]                          │
│                                                              │
│  PIN (4 cijfers): [____]                                    │
│                                                              │
│  [✓ Aanmelden]                                              │
│                                                              │
│  💡 Je kunt later je profiel verder invullen voor           │
│     extra punten en een persoonlijkere ervaring!            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Na aanmelding:**
- Account aangemaakt
- Verificatie e-mail verzonden
- Direct toegang tot basis functies
- Dashboard toont "Profiel aanvullen" prompt

### Fase 1-6: Profiel Aanvullen (Optioneel, voor punten)

| Fase | Sectie | Velden | Punten |
|------|--------|--------|--------|
| 1 | Persoonlijk | Geboortedatum, geslacht, partner | 50 |
| 2 | JKV Historie | JKV/Bovenkamer jaren | 30 |
| 3 | Skills | 8 skill categorieën | 40 |
| 4 | Muziek | Decennium, genre | 20 |
| 5 | Borrel Stats | 2025 geweest, 2026 planning | 30 |
| 6 | Fun Quiz | 15 grappige vragen | 80 |
| **Totaal** | | | **250** |

## Dashboard Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ PROFIEL NIET COMPLEET (32%)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Je mist nog 170 punten!                                    │
│                                                              │
│  📊 Voortgang:                                               │
│  ████████░░░░░░░░░░░░░░░░░░░░ 32%                          │
│                                                              │
│  Volgende stap: Skills invullen (+40 punten)                │
│  → Dan passeer je Henk (#5) op het leaderboard!            │
│                                                              │
│  [📝 Nu Invullen]                [Later]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Herinneringen

### In-App Notificatie
Verschijnt bij elke login als profiel niet compleet:
```
┌─────────────────────────────────────────────────────────────┐
│  🔔 HERINNERING                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Hey [NAAM]! Je profiel is nog niet compleet.               │
│                                                              │
│  🎯 Als je de Skills sectie invult:                         │
│     • Verdien je 40 extra punten                            │
│     • Stijg je naar plek #4 op het leaderboard              │
│     • Passeer je Henk (die heeft maar 520 punten 😏)        │
│                                                              │
│  De Grill Guru heeft al 12 persoonlijke roasts klaar.       │
│  Zonder complete profiel... krijg je een generieke. Saai.   │
│                                                              │
│  [📝 Invullen]  [🔕 Herinner me morgen]  [❌ Niet meer]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### E-mail Herinneringen

**Trigger Momenten:**
| Trigger | Timing | Max |
|---------|--------|-----|
| Na registratie | 24 uur na aanmelding | 1x |
| Wekelijks | Elke maandag om 10:00 | 4x |
| Laatste kans | 48 uur voor event | 1x |

**E-mail Template:**
```
Onderwerp: [NAAM], je mist nog 170 punten! 🎯

Hey [NAAM],

Je hebt je aangemeld voor de Bovenkamer Winterproef - top!
Maar je profiel is pas [X]% compleet.

📊 JOUW STATUS:
━━━━━━━━━━━━━━━
✅ Naam & e-mail
✅ Persoonlijke info
❌ Skills (40 punten)
❌ Fun Quiz (80 punten)
❌ Borrel stats (30 punten)

🏆 LEADERBOARD UPDATE:
Je staat nu op plek #[X] met [Y] punten.
Als je alles invult, spring je naar plek #[Z]!
Dan passeer je: [PERSOON_1], [PERSOON_2], [PERSOON_3]

De Grill Guru zegt:
"[NAAM], met [JKV_JAREN] jaar JKV ervaring zou je beter
moeten weten. Invullen. Nu."

[KNOP: Profiel Aanvullen →]
```

## Admin Controle

```
┌─────────────────────────────────────────────────────────────┐
│  📧 PROFIEL HERINNERINGEN (Admin)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Profiel Status:                                            │
│  ✅ 100% compleet: 8 personen                               │
│  🟡 50-99%: 4 personen                                      │
│  🔴 <50%: 3 personen                                        │
│                                                              │
│  Volgende automatische reminder: maandag 10:00              │
│                                                              │
│  [📧 Stuur Nu Reminder aan Incompleten]                     │
│  [⚙️ Reminder Instellingen]                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Acceptatiecriteria

### MVP
- [ ] Minimale registratie met alleen naam, e-mail, PIN
- [ ] Dashboard toont profiel compleetheid percentage
- [ ] Secties kunnen los ingevuld worden
- [ ] Punten worden toegekend per voltooide sectie
- [ ] Leaderboard toont profiel-punten

### Uitbreiding
- [ ] In-app notificatie bij incomplete profiel
- [ ] Gepersonaliseerde "passeer X" berekening
- [ ] E-mail herinneringen (automatisch + handmatig)
- [ ] Admin dashboard voor reminder beheer

### Polish
- [ ] Animatie bij punten verdienen
- [ ] Confetti bij 100% compleet
- [ ] Grill Guru commentaar bij elke sectie

## Beslissingen

| Vraag | Beslissing |
|-------|------------|
| Minimale velden | Naam, e-mail, PIN (4 cijfers) |
| Totaal profiel-punten | 250 punten |
| Max e-mail reminders | 6 (1 + 4 wekelijks + 1 laatste kans) |
| Opt-out mogelijk | Ja, per reminder type |

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-001 (Skills) | Wordt onderdeel van profiel secties |
| US-002 (Profielvelden) | Wordt onderdeel van profiel secties |
| US-003 (Dashboard) | Moet wachten op profiel data |
| US-005 (Game) | Grill Guru heeft minder data bij incomplete profielen |
| US-006 (Awards) | Rapporten minder persoonlijk bij incomplete profielen |
