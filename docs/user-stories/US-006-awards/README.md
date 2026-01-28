---
id: US-006
title: Einde-Avond Awards & Persoonlijke Samenvattingen
status: planning
priority: 6
complexity: Very High
type: Feature
pr: null
created: 2026-01-18
updated: 2026-01-18
---

# US-006: Einde-Avond Awards & Persoonlijke Samenvattingen

## User Story
> Als Bovenkamer-lid wil ik aan het einde van de avond een persoonlijke samenvatting ontvangen op mijn telefoon, gebaseerd op al mijn data, zodat ik kan lachen om mezelf en zelf kan kiezen of ik dit met de groep deel.

## Achtergrond
Geïnspireerd op JKV traditie waar aan het einde van het jaar awards worden uitgereikt (zoals "De Bezem" voor wie het laatst naar huis ging). Nu een digitale versie met LLM-gegenereerde persoonlijke samenvattingen die ALLE beschikbare data combineren.

## Concept Flow

```
┌─────────────────────────────────────────────────────────────┐
│  EINDE VAN DE AVOND (±23:00)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Admin activeert "Awards Modus"                          │
│                                                              │
│  2. Iedereen krijgt notificatie:                            │
│     "🏆 Je persoonlijke Bovenkamer-rapport is klaar!"       │
│                                                              │
│  3. Elk persoon opent rapport op eigen telefoon             │
│                                                              │
│  4. Keuze: [🔒 Alleen voor mij] of [📢 Delen met groep]     │
│                                                              │
│  5. Gedeelde rapporten verschijnen op Live Dashboard        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Persoonlijk Rapport

```
┌─────────────────────────────────────────────────────────────┐
│  🎭 JOUW BOVENKAMER RAPPORT 2026                            │
│  Voor: [NAAM]                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🏆 JOUW AWARDS                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🧹 DE BEZEM                                      │       │
│  │ "Weer de laatste die wegging. Sommige dingen    │       │
│  │  veranderen nooit. Net als je guilty pleasure:  │       │
│  │  [SONG]."                                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                              │
│  📊 JOUW AVOND IN CIJFERS                                   │
│  • Burger Stack gespeeld: 12x (hoogste: 8.450)             │
│  • Quiz positie: #4 van 15                                  │
│  • Voorspellingen correct: 3/8                              │
│  • Tijd bij de BBQ: 45 min (claimde: "expert")             │
│                                                              │
│  💬 DE GRILL GURU OVER JOU                                  │
│  "Na 18 jaar JKV zou je denken dat [NAAM] wist             │
│   wanneer het tijd is om te gaan. Maar nee. Met           │
│   een zelfvertrouwen van 8/10 en 0 afwas-skills           │
│   stond je tot 3:00 te discussiëren over [TOPIC].         │
│   Je partner [PARTNER] is een heilige."                   │
│                                                              │
│  🔮 VOORSPELLING VOOR VOLGEND JAAR                          │
│  "Je zegt 8/10 borrels te komen. We zetten in op 3."       │
│                                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │  [🔒 Alleen voor mij]  [📢 Delen met groep]     │       │
│  └─────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Award Categorieën

### Klassieke JKV Awards (gemoderniseerd)
| Award | Criteria | Data |
|-------|----------|------|
| 🧹 De Bezem | Laatste die wegging | Event check-out tijd |
| 🌅 De Vroege Vogel | Eerste die wegging | Event check-out tijd |
| 🎤 De Karaoke Koning | Meeste "spontane" optredens | Live tracking/voting |
| 🍖 De Grill Sergeant | Langste tijd bij BBQ | Self-report of tracking |
| 🍷 De Sommelier | Meeste wijn gedronken (self-report) | Fun survey |

### Data-Gedreven Awards
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

### Borrel-Gerelateerde Awards
| Award | Criteria | Data |
|-------|----------|------|
| 📅 De Trouwe | Hoogste borrel-opkomst 2025 | borrelAttendance2025 |
| 🤥 De Optimist | Meeste beloofd, minste gekomen | planned vs attended |
| 👻 De Geest | Minste borrels bezocht | borrelAttendance2025 |

## Scherpte Aanpassen (Regenerate)

Gebruikers kunnen hun rapport laten regenereren met andere scherpte. **Max 3 keer.**

```
┌─────────────────────────────────────────────────────────────┐
│  🌶️ SCHERPTE AANPASSEN                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Huidige scherpte: ████████░░ (80%)                        │
│                                                              │
│  Te scherp? Te mild? Pas aan:                              │
│                                                              │
│  😇 ──────●────── 😈                                        │
│  Mild    Medium    Spicy                                    │
│                                                              │
│  [🔄 Regenereer Rapport]                                    │
│                                                              │
│  ⚠️ Nog 2 van 3 aanpassingen over                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Scherpte Schaal (stappen van 5)
| Waarde | Label | Beschrijving |
|--------|-------|--------------|
| 0-20 | 😇 Fluweelzacht | Bijna alleen complimenten |
| 25-40 | 🙂 Mild | Lichte humor, geen scherpe kantjes |
| 45-60 | 😏 Medium | Standaard, vriendelijke roast |
| 65-80 | 😈 Spicy | Scherpe opmerkingen, confronterend |
| 85-100 | 🔥 Genadeloos | Volledige roast, geen genade |

### Regeneratie wordt Roast Materiaal
| Regeneraties | Dashboard Tekst | Extra Roast |
|--------------|-----------------|-------------|
| 0 | - | Neutraal |
| 1 (milder) | "Vroeg om milder..." | Grill Guru noemt dit |
| 2 (milder) | "Twee keer milder gevraagd..." | Extra aandacht |
| 3 (milder) | "3x om milder gevraagd 🐔" | "Kan er niet tegen" |
| 1+ (scherper) | "Vroeg om MEER!" | Respect emoji 💪 |
| Max scherp | "100% - durft alles" | Held status |

## Voorspellingen Status Tracker

```
┌─────────────────────────────────────────────────────────────┐
│  📋 VOORSPELLINGEN STATUS                    [Admin]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Ingevuld (12/15):                                       │
│  Klaas, Marie, Piet, Jan, Lisa, Tom, Eva, Dirk,            │
│  Sophie, Mark, Anne, Frank                                  │
│                                                              │
│  ⏳ Nog niet ingevuld (3/15):                               │
│  • Henk (laatste reminder: 2 dagen geleden)                │
│  • Ingrid (nog geen reminder verstuurd)                    │
│  • Bas (3 reminders verstuurd, reageert niet)              │
│                                                              │
│  [📧 Stuur Reminder aan Allen]  [📧 Selectief Reminder]     │
│                                                              │
│  Deadline: 2 uur voor event start                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Acceptatiecriteria

### MVP (Fase 1)
- [ ] Admin kan "Awards Modus" activeren
- [ ] Rapporten worden gegenereerd voor alle deelnemers
- [ ] Elk persoon ziet eigen rapport op telefoon
- [ ] Basis award categorieën (5-8 awards)
- [ ] Keuze: privé houden of delen

### Uitbreiding (Fase 2)
- [ ] Live dashboard met queue systeem
- [ ] Emoji reactions op gedeelde rapporten
- [ ] Projectie-modus voor groot scherm
- [ ] Real-time notificaties

### Polish (Fase 3)
- [ ] Animaties bij nieuwe shares
- [ ] Sound effects (optioneel)
- [ ] Export rapport als afbeelding
- [ ] Jaarlijkse vergelijking (als er meerdere events zijn)

## Beslissingen

| Vraag | Beslissing |
|-------|------------|
| Event tracking (check-in/out) | Niet nodig - registratie + betaling volstaat |
| Timing awards activeren | Admin kiest het moment handmatig |
| Scherpte aanpassen | Max 3x regenereren, wordt zelf roast materiaal |

## Relaties met andere US

| User Story | Relatie |
|------------|---------|
| US-001 (Skills) | Skills data in rapporten |
| US-002 (Profielvelden) | Profiel data in rapporten |
| US-003 (Dashboard) | Deelt LLM Service |
| US-005 (Game) | Game stats in rapporten |
| US-007 (Progressieve Registratie) | Incomplete profielen = minder persoonlijk |
