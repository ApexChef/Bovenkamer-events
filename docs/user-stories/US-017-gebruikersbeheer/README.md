# Gebruikersbeheer

## Beschrijving

Als administrator wil ik gebruikers kunnen beheren zodat ik hun gegevens kan aanpassen, punten kan corrigeren en accounts kan verwijderen.

## Requirements (na interview)

| Aspect | Beslissing |
|--------|------------|
| Real-time updates | Handmatig refresh |
| Toegang | Alleen Admin |
| Punten correctie | Direct aanpassen (geen bevestiging) |
| Verwijderen | Soft + hard delete opties |
| Kolommen | Naam, Email, Punten (basis) |
| Bulk acties | Niet nodig |
| Punten detail | Alleen totaal (geen ledger view) |
| Audit log | Niet nodig |
| Navigatie | Integreren in bestaande deelnemers pagina |
| Detail view | Aparte pagina (/admin/gebruikers/[id]) |
| Zoeken | Ja, basis zoeken op naam of email |

## Functionaliteiten

### 1. Gebruikers Overzicht (uitbreiding van /admin/deelnemers)

Uitbreiden van de bestaande deelnemers pagina met:

- Tabel met kolommen: Naam, Email, Punten
- Zoekbalk voor naam of email
- Klikbare rijen naar detail pagina
- Handmatige refresh knop

### 2. Gebruiker Detail Pagina (/admin/gebruikers/[id])

Aparte pagina om gebruiker te bekijken en bewerken:

- **Basisgegevens tonen**: Naam, email, rol, punten
- **Rol wijzigen**: Dropdown om rol te wijzigen (participant/admin/quizmaster)
- **Punten aanpassen**:
  - Huidig totaal tonen
  - Input om punten toe te voegen of af te trekken
  - Veld voor reden/beschrijving
  - Direct opslaan (geen bevestigingsdialoog)
- **Account verwijderen**:
  - Soft delete knop (deactiveren)
  - Hard delete knop (permanent verwijderen + alle data)
  - Bevestigingsdialoog alleen bij hard delete

### 3. Geen Extra Features

Expliciet NIET implementeren:
- Geen audit logging
- Geen bulk acties
- Geen real-time updates
- Geen gedetailleerde punten ledger view
- Geen filters (behalve zoeken)

## Technische Details

### Routes

| Route | Beschrijving |
|-------|-------------|
| `/admin/deelnemers` | Bestaande pagina uitbreiden met zoekfunctie |
| `/admin/gebruikers/[id]` | Nieuwe detail/bewerk pagina |

### API Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|-------------|
| `/api/admin/users` | GET | Lijst gebruikers (bestaand, evt. uitbreiden) |
| `/api/admin/users/[id]` | GET | Gebruiker details |
| `/api/admin/users/[id]` | PATCH | Gebruiker bewerken (rol, status) |
| `/api/admin/users/[id]` | DELETE | Gebruiker verwijderen |
| `/api/admin/users/[id]/points` | POST | Punten toevoegen/aftrekken |

### Database

Bestaande tabellen:
- `users` - Gebruikergegevens (role, is_active)
- `points_ledger` - Voor punten correcties
- `registrations` - Profielgegevens

Wijzigingen:
- `users.is_active` - Boolean voor soft delete (indien niet aanwezig)

## Acceptatiecriteria

- [ ] Admin kan alle gebruikers zien in deelnemers tabel
- [ ] Admin kan zoeken op naam of email
- [ ] Admin kan naar detail pagina navigeren
- [ ] Admin kan rol wijzigen
- [ ] Admin kan punten toevoegen met reden
- [ ] Admin kan punten aftrekken met reden
- [ ] Admin kan account deactiveren (soft delete)
- [ ] Admin kan account permanent verwijderen (hard delete met bevestiging)

## UI Schets

```
/admin/deelnemers
┌─────────────────────────────────────────────┐
│ Deelnemers                      [Refresh]   │
├─────────────────────────────────────────────┤
│ [🔍 Zoeken op naam of email...           ]  │
├─────────────────────────────────────────────┤
│ Naam          │ Email              │ Punten │
├───────────────┼────────────────────┼────────┤
│ Jan Jansen    │ jan@email.nl       │ 280    │ → klik
│ Piet Pieterse │ piet@email.nl      │ 120    │
│ ...           │ ...                │ ...    │
└─────────────────────────────────────────────┘

/admin/gebruikers/[id]
┌─────────────────────────────────────────────┐
│ ← Terug   Jan Jansen                        │
├─────────────────────────────────────────────┤
│ Email: jan@email.nl                         │
│ Rol: [Participant ▼]                        │
│ Status: Actief                              │
├─────────────────────────────────────────────┤
│ Punten: 280                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Punten aanpassen:                       │ │
│ │ [+50 / -50] punten                      │ │
│ │ Reden: [________________]               │ │
│ │ [Opslaan]                               │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [Deactiveren]  [Permanent Verwijderen]      │
└─────────────────────────────────────────────┘
```

---

*Aangemaakt: 2026-01-28*
*Laatste update: 2026-01-28 (na interview)*
