# US-018: Aanpassen Predictions

## Beschrijving

Verbeteringen en uitbreidingen van de predictions (voorspellingen) module.

## Requirements

### 1. Bug Fix: Deelnemerslijst
**Probleem:** De dropdown met deelnemers toont maar 2 personen.
**Verwacht:** Alle geregistreerde gebruikers moeten zichtbaar zijn.

### 2. Gebruiker Herbewerken
Gebruikers mogen hun voorspellingen aanpassen na indiening (tot het event begint).

| Aspect | Beslissing |
|--------|------------|
| Deadline | Tot event start (EVENT_START) |
| Na indiening | Nog steeds bewerkbaar |
| Feedback | Melding dat wijzigingen zijn opgeslagen |

### 3. Admin Voorspellingen Beheer
Admin kan voorspellingen van gebruikers bekijken en corrigeren.

| Aspect | Beslissing |
|--------|------------|
| Bekijken | Overzicht van alle voorspellingen per gebruiker |
| Corrigeren | Admin kan voorspellingen aanpassen |
| Navigatie | Via /admin/predictions of via gebruikersbeheer |

### 4. Prediction Vragen Aanpassen
De mogelijkheid om de prediction vragen zelf te wijzigen.

**Te bespreken:**
- Waar worden vragen beheerd? (database vs code)
- Welke vragen moeten worden aangepast?
- Moeten vragen dynamisch configureerbaar zijn?

## Huidige Implementatie

### Predictions pagina (`/predictions`)
- Consumptie sliders: wijn, bier, vlees
- Sociale voorspellingen: wie slaapt eerst, wie zingt, etc.
- Draft opslaan of definitief indienen
- Vergrendeld na event start of definitieve indiening

### Admin predictions (`/admin/predictions`)
- Uitkomsten invullen (bestaand)

### API
- `GET /api/participants` - Haalt deelnemers op voor dropdowns
- `POST /api/predictions` - Opslaan voorspellingen

## Acceptatiecriteria

- [ ] Deelnemerslijst toont alle geregistreerde gebruikers
- [ ] Gebruiker kan voorspellingen bewerken na indiening (tot event)
- [ ] Admin kan alle voorspellingen bekijken
- [ ] Admin kan voorspellingen van gebruikers corrigeren

---

*Aangemaakt: 2026-01-28*
