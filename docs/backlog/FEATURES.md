# Bovenkamer Winterproef - Feature Backlog

Dit document bevat alle ideeën en features die we nog willen bouwen.

---

## 🎯 Vaardigheden Uitbreiding

### Groepering van vaardigheden
Per groep een hoofdvaardigheid en subvaardigheden.

#### CULINAIR (Eten & Drinken)
**Hoofdvaardigheid: Chef de cuisine**
- Koken (algemeen)
- BBQ-meester
- Salades & bijgerechten
- Hapjes & borrelhappen
- Desserts & zoet

**Hoofdvaardigheid: Drankenexpert**
- Wijn selecteren
- Bier tappen
- Cocktails mixen
- Koffie & thee
- Alcoholvrij specialist

#### SFEER & AMBIANCE
**Hoofdvaardigheid: Sfeermaker**
- Vuur maken & onderhouden
- DJ-en / muziek
- Decoratie & aankleding
- Verlichting regelen

#### ENTERTAINMENT
**Hoofdvaardigheid: Entertainer**
- Gesprekken leiden
- Spelletjes organiseren
- Toastmaster / speeches
- Foto's & video's maken
- Storyteller

#### PRAKTISCH & LOGISTIEK
**Hoofdvaardigheid: Organisator**
- Algemene organisatie
- Afwassen & opruimen
- Tafels dekken/afruimen
- Inkopen doen
- Gastheer/-vrouw

#### OVERIG
**Hoofdvaardigheid: Gezelschap**
- Niks (ik ben er gewoon)
- Morele steun
- Criticus (proeven & oordelen)

---

## 🎮 Spelletjes (Mobiel)

### 1. "Wie Ben Ik?" - Bovenkamer Editie
- Iedereen krijgt een naam van een andere deelnemer op z'n scherm
- Telefoon tegen voorhoofd houden, alleen zichtbaar voor anderen
- Raad wie je bent door ja/nee vragen
- **Twist:** Gebruik quiz-antwoorden uit registratie als hints

### 2. Leugen Detectie ⭐ (Aanbevolen)
- Elke speler ziet 3 statements over een deelnemer (uit registratie-data)
- Eén statement is verzonnen, raad de leugen
- **Mobiel:** Swipe links/rechts om te kiezen
- **Punten:** Sneller antwoord = meer punten
- **Voordeel:** Gebruikt bestaande registratie-data

### 3. Bovenkamer Bingo ⭐ (Aanbevolen)
- Live bingo met voorspellingen van de avond
- Voorbeelden:
  - "Iemand morst wijn"
  - "Boy Boom vertelt een lang verhaal"
  - "Eerste persoon gaat naar bed voor 23:00"
- **Mobiel:** Tik om af te vinken
- **Winnaar:** Eerste volle kaart
- **Voordeel:** Interactief tijdens hele feest, laagdrempelig

### 4. Hot Takes - Stemspel
- Controversiële stellingen, anoniem stemmen
- Voorbeelden:
  - "Biefstuk hoort well-done"
  - "Rosé is geen echte wijn"
  - "De 80s hadden de beste muziek"
- **Mobiel:** Slider van "Absoluut niet" tot "100% mee eens"
- **Punten:** Bij de meerderheid = punten

### 5. Foto Challenge
- Realtime foto-opdrachten tijdens het feest
- Voorbeelden:
  - "Maak een foto met de BBQ-meester"
  - "Selfie met iemand die danst"
  - "Vind iets roods"
- **Mobiel:** Camera direct in de app
- **Punten:** Stemmen op beste foto's

### 6. Speed Matching ⭐ (Aanbevolen)
- Koppel quiz-antwoorden aan de juiste persoon
- Voorbeelden:
  - "Wie had als guilty pleasure song: Dancing Queen?"
  - "Wie droomde als kind ervan om astronaut te worden?"
- **Mobiel:** Drag & drop of multiple choice
- **Punten:** Gebaseerd op snelheid + correctheid
- **Voordeel:** Leuk om elkaar beter te leren kennen

### 7. Schatspel / Gok de Uitkomst
- Live gokken op events
- Voorbeelden:
  - "Hoe laat valt de eerste persoon in slaap?"
  - "Hoeveel flessen wijn gaan er open voor middernacht?"
- **Mobiel:** Slider of nummer invoer
- **Punten:** Dichtstbij = meeste punten

---

## 🎵 Muziek Wizard & Playlist Generator

### Interactieve Wizard Flow

#### Stap 1: Vibe Check (Swipe interface)
- Luister 10-15 seconden van een nummer
- Swipe rechts = "Ja, dit mag op de playlist"
- Swipe links = "Nee, liever niet"
- Swipe omhoog = "MUST HAVE!"
- Mix van decennia en genres om voorkeuren te ontdekken

#### Stap 2: Energie Curve
- Slider tijdlijn van de avond (18:00 - 02:00)
- Per fase (Chill → Opbouw → Feest → Afsluiten) voorkeur kiezen:
  - Achtergrond / Relaxed
  - Opzwepend
  - Volle bak dansen
  - Meezingers

#### Stap 3: Guilty Pleasures
- "Welke nummers MOETEN gedraaid worden?"
- Zoekbalk (Spotify-style)
- Top 3 kiezen
- Optioneel: "Alleen als ik genoeg gedronken heb"

#### Stap 4: No-Go Zone
- "Welke nummers absoluut NIET?"
- Artiesten blacklisten
- Genres vermijden
- "Als dit gedraaid wordt, ga ik naar huis"

#### Stap 5: Geheime Wapen
- "Eén nummer dat JOU aan het dansen krijgt, 100% gegarandeerd"
- Wordt later als 'surprise' gedraaid

### Playlist Resultaat
- Combineert alle input van deelnemers
- Toont statistieken:
  - Top genres (percentages)
  - Most requested nummers
  - Totale duur
- Export naar Spotify

### Live Features tijdens Feest
| Feature | Beschrijving |
|---------|-------------|
| Live Requests | Tijdens feest nummers aanvragen via app |
| Vote Skip | Als 50% stemt, skip naar volgende |
| DJ Mode | Quizmaster kan playlist live aanpassen |
| Dedication | "Dit nummer is voor..." met melding |
| Stats achteraf | "Meest geskipte nummer", "Langst meegezongen" |

### Spotify Integratie Opties
1. **Simpel:** Export als tekstlijst / linkjes
2. **Medium:** Spotify Web API - playlist aanmaken in gezamenlijk account
3. **Advanced:** OAuth login, iedereen draagt bij aan collaborative playlist

---

## 🎁 Cadeau-idee Lijst

### Concept
De gastheer/gastvrouw kan een verlanglijst met cadeau-ideeën aanmaken. Gasten kunnen vervolgens kiezen welk cadeautje zij willen geven, zodat er geen dubbele cadeaus komen.

### Gastheer/Gastvrouw
- Lijst aanmaken met cadeau-ideeën
- Per cadeau: naam, omschrijving, optioneel een link/afbeelding, prijsindicatie
- Cadeau markeren als "meerdere welkom" (bijv. fles wijn) of "uniek" (maar één nodig)
- Overzicht wie welk cadeau heeft geclaimd

### Gast
- Verlanglijst bekijken met beschikbare cadeaus
- Cadeau claimen ("Dit geef ik!")
- Geclaimde cadeaus zijn niet meer zichtbaar/kiesbaar voor andere gasten (tenzij "meerdere welkom")
- Optie om claim weer los te laten

### Privacy
- Gasten zien niet wie welk cadeau heeft gekozen — alleen de gastheer/gastvrouw ziet dit
- Zo blijft het een verrassing

---

## 📋 Prioriteit Matrix

| Feature                        | Impact | Effort | Prioriteit  |
|--------------------------------|--------|--------|-------------|
| **AUTHENTICATIE**              |        |        |             |
| Verwachte deelnemerslijst      | Hoog   | Laag   | 🔴 Hoog     |
| PIN systeem (2 letters+2 cijf) | Hoog   | Medium | 🔴 Hoog     |
| Email bevestigingslink         | Hoog   | Medium | 🔴 Hoog     |
| Admin registratie goedkeuring  | Hoog   | Medium | 🔴 Hoog     |
| Login pagina (naam + PIN)      | Hoog   | Laag   | 🔴 Hoog     |
| Vergeet PIN pagina             | Medium | Laag   | 🟡 Medium   |
| Afmelden pagina                | Medium | Laag   | 🟡 Medium   |
| Boy Blokkade                   | Hoog   | Laag   | 🔴 Hoog     |
| **SPELLETJES**                 |        |        |             |
| Leugen Detectie                | Hoog   | Laag   | 🔴 Hoog     |
| Bovenkamer Bingo               | Hoog   | Medium | 🔴 Hoog     |
| Speed Matching                 | Hoog   | Medium | 🟡 Medium   |
| Foto Challenge                 | Medium | Medium | 🟢 Laag     |
| Hot Takes                      | Medium | Laag   | 🟢 Laag     |
| **OVERIG**                     |        |        |             |
| Muziek Wizard                  | Hoog   | Hoog   | 🟡 Medium   |
| Vaardigheden groepering        | Medium | Laag   | 🟡 Medium   |
| Spotify integratie             | Medium | Hoog   | 🟢 Laag     |

---

## 🔐 Authenticatie & Registratie Systeem

### PIN Systeem
- **Formaat:** 2 letters + 2 cijfers (bijv. `AB12`, `XY99`)
- Gebruiker kiest zelf PIN bij registratie
- PIN wordt gebruikt om in te loggen (samen met naam)
- **Vergeet PIN pagina:**
  - Voer email in → ontvang PIN via email
  - Of: admin kan PIN resetten

### Registratie Flow

```
1. Bezoeker komt op /register
2. Kies je naam uit de verwachte deelnemerslijst
   └── "Ik sta niet in de lijst" optie voor onbekenden
3. Vul registratieformulier in
4. Kies je PIN (2 letters + 2 cijfers)
5. Bevestig email adres
6. ✉️ Email met bevestigingslink wordt verstuurd
7. Klik op link → registratie bevestigd
8. ⏳ Wacht op admin goedkeuring
9. ✅ Admin keurt goed → toegang tot dashboard
```

### Verwachte Deelnemerslijst (Admin)

Admin beheert een vaste lijst met verwachte deelnemers:

| Veld | Beschrijving |
|------|-------------|
| Naam | Volledige naam |
| Email | Verwacht email adres |
| Status | Uitgenodigd / Geregistreerd / Afgezegd / Goedgekeurd |
| Gekoppelde registratie | Link naar registratie indien aanwezig |

**Admin functies:**
- Deelnemers toevoegen/verwijderen aan lijst
- Registraties koppelen aan verwachte deelnemers
- Registraties goedkeuren of afwijzen
- Overzicht wie nog niet geregistreerd is
- Herinneringsmail sturen naar niet-geregistreerden

### Afmelden / Niet Komen

- Optie in registratieformulier: **"Ik kan helaas niet komen"**
- Aparte /afmelden pagina voor snelle afmelding
- Reden opgeven (optioneel)
- Admin ziet overzicht van afmeldingen

### Email Notificaties

| Trigger | Email naar | Inhoud |
|---------|-----------|--------|
| Registratie voltooid | Deelnemer | Bevestigingslink |
| Link bevestigd | Admin | "Nieuwe registratie wacht op goedkeuring" |
| Goedgekeurd door admin | Deelnemer | "Je bent goedgekeurd! Log in met je PIN" |
| Afgewezen door admin | Deelnemer | "Neem contact op met organisatie" |
| Afmelding | Admin | "X heeft zich afgemeld" |
| PIN vergeten | Deelnemer | "Je PIN is: XX00" |

### Rollen & Rechten

| Rol | Rechten |
|-----|---------|
| **Gast** | Registreren, afmelden |
| **Deelnemer** | Dashboard, voorspellingen, quiz, Boy beoordelen |
| **Boy Boom** | Alles BEHALVE eigen beoordeling bekijken |
| **Quizmaster** | Alles + quiz aansturen |
| **Admin** | Alles + deelnemers beheren, registraties goedkeuren |

### Boy Blokkade
- Herkenning via naam in deelnemerslijst (Boy Boom = speciale rol)
- Bij /rate: "Sorry Boy, je kunt jezelf niet beoordelen!"

### Pagina's Nodig

| Route | Beschrijving |
|-------|-------------|
| `/register` | Registratieformulier met deelnemerskeuze |
| `/login` | Inloggen met naam + PIN |
| `/vergeet-pin` | PIN opvragen via email |
| `/afmelden` | Snel afmelden voor het event |
| `/bevestig/[token]` | Email bevestigingslink |
| `/admin/deelnemers` | Beheer verwachte deelnemerslijst |
| `/admin/registraties` | Registraties goedkeuren/afwijzen |

### Database Tabellen Nodig

```
expected_participants (verwachte deelnemers)
├── id
├── name
├── email
├── role (deelnemer/boy/quizmaster/admin)
├── status (invited/registered/declined/approved)
├── registration_id (FK, nullable)
└── created_at

registrations (uitbreiding)
├── ...bestaande velden...
├── pin_hash (gehashte PIN)
├── email_verified (boolean)
├── email_token (voor bevestigingslink)
├── admin_approved (boolean)
├── approved_by (admin user id)
├── approved_at (timestamp)
├── declined (boolean)
└── decline_reason
```

---

## 🗒️ Notities

*Ruimte voor brainstorm notities...*
