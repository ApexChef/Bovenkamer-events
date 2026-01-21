# US-012: Desktop Navigatie & Feature Toggles

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | High |
| **Status** | Code Complete |
| **Complexiteit** | Medium |
| **Type** | Feature |

## Beschrijving

### User Story
Als gebruiker wil ik op desktop dezelfde navigatie-ervaring hebben als op mobiel, met een duidelijke header navigatie en de mogelijkheid voor admins om bepaalde features aan/uit te zetten.

### Context
- Mobiel heeft een bottom navigation met tabs (Home, Predictions, Leaderboard, Profile)
- Desktop mist deze navigatie structuur
- Admin moet features kunnen in/uitschakelen voor alle gebruikers
- Home tab moet een mini leaderboard CTA tonen

## Specificaties

### 1. Desktop Header Navigatie

**Locatie:** Sticky top header bar

**Elementen:**
| Element | Positie | Beschrijving |
|---------|---------|--------------|
| Logo/Titel | Links | "Bovenkamer" met subtitel |
| Nav Items | Midden | Home, Voorspellingen, Ranking, Profiel |
| User Info | Rechts | Naam + Logout button |

**Styling:**
- Sticky header (blijft zichtbaar bij scrollen)
- Donkere achtergrond (dark-wood/deep-green)
- Gold accenten voor active state
- Smooth transitions

### 2. Feature Toggle Systeem

**Beheer:** Admin-controlled (database)

**Architectuur:**
```
┌─────────────────────────────────────────────────────┐
│                  Feature Toggle Flow                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Database (feature_toggles)                         │
│       │                                              │
│       ▼                                              │
│  API: GET /api/features                             │
│       │                                              │
│       ▼                                              │
│  FeatureProvider (React Context)                    │
│       │                                              │
│       ▼                                              │
│  <FeatureToggle name="countdown">                   │
│       <CountdownComponent />                        │
│  </FeatureToggle>                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Toggle Features:**
| Feature Key | Naam | Default | Beschrijving |
|-------------|------|---------|--------------|
| `show_countdown` | Countdown Timer | true | Event afteller op dashboard |
| `show_ai_assignment` | AI Toewijzing | true | "Uw officiële toewijzing" sectie |
| `show_leaderboard_preview` | Ranking Preview | true | Mini leaderboard op home tab |
| `show_burger_game` | Burger Stack | true | Game CTA op dashboard |
| `show_predictions` | Voorspellingen | true | Predictions tab/sectie |

**Component Wrapper Pattern:**
```typescript
// Gebruik:
<FeatureToggle feature="show_countdown">
  <CountdownTimer />
</FeatureToggle>

// Of met hook:
const { isEnabled } = useFeature('show_countdown');
if (isEnabled) { ... }
```

### 3. Mini Leaderboard CTA (Home Tab)

**Stijl:** Top 5 mini leaderboard

**Layout:**
```
┌─────────────────────────────────────┐
│  🏆 Ranking                         │
├─────────────────────────────────────┤
│  1. 🥇 Jan van der Berg    520 pts  │
│  2. 🥈 Piet Jansen         480 pts  │
│  3. 🥉 Marie de Vries      450 pts  │
│  4.    Karel Smit          420 pts  │
│  5.    Anna Bakker         400 pts  │
├─────────────────────────────────────┤
│  Jouw positie: #12 (280 pts)        │
│  [Bekijk volledige ranking →]       │
└─────────────────────────────────────┘
```

**Features:**
- Top 5 gebruikers met punten
- Medaille emojis voor top 3
- Eigen positie onderaan
- Link naar volledige ranking tab

### 4. Logout Functionaliteit

**Desktop:** Logout button in header (rechts)
**Mobiel:** Behouden in hamburger menu

## Database Schema

### Nieuwe Tabel: `feature_toggles`

```sql
CREATE TABLE feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Initial data
INSERT INTO feature_toggles (feature_key, display_name, description, is_enabled) VALUES
  ('show_countdown', 'Countdown Timer', 'Toon event countdown op dashboard', true),
  ('show_ai_assignment', 'AI Toewijzing', 'Toon "Uw officiële toewijzing" sectie', true),
  ('show_leaderboard_preview', 'Ranking Preview', 'Toon mini leaderboard op home tab', true),
  ('show_burger_game', 'Burger Stack Game', 'Toon game CTA op dashboard', true),
  ('show_predictions', 'Voorspellingen', 'Toon voorspellingen tab', true);
```

## API Endpoints

| Endpoint | Method | Auth | Beschrijving |
|----------|--------|------|--------------|
| `/api/features` | GET | Public | Haal alle feature toggles op |
| `/api/admin/features` | GET | Admin | Admin overzicht van toggles |
| `/api/admin/features/[key]` | PATCH | Admin | Toggle feature aan/uit |

### Response Format
```json
{
  "features": {
    "show_countdown": true,
    "show_ai_assignment": true,
    "show_leaderboard_preview": true,
    "show_burger_game": true,
    "show_predictions": true
  }
}
```

## Componenten

### Nieuw
| Component | Locatie | Beschrijving |
|-----------|---------|--------------|
| `DesktopHeader` | `/components/ui/DesktopHeader.tsx` | Desktop navigatie header |
| `FeatureProvider` | `/components/FeatureProvider.tsx` | React Context voor features |
| `FeatureToggle` | `/components/FeatureToggle.tsx` | Wrapper component |
| `MiniLeaderboard` | `/components/dashboard/MiniLeaderboard.tsx` | Top 5 ranking CTA |

### Te Wijzigen
| Component | Wijziging |
|-----------|-----------|
| `DashboardPage` | DesktopHeader toevoegen, FeatureToggle wrappen |
| `HomeTab` | MiniLeaderboard toevoegen |
| `layout.tsx` | FeatureProvider wrappen |

## Acceptatiecriteria

- [x] Desktop heeft sticky header met navigatie
- [x] Header toont: Logo, Nav items, User info, Logout
- [x] Feature toggles werken via database
- [x] Admin kan features aan/uit zetten
- [x] FeatureToggle component wrapt features correct
- [x] Mini leaderboard toont top 5 op home
- [x] Logout button werkt op desktop
- [ ] Geen regressies op mobiel (handmatig te testen)

## Test Scenarios

| Scenario | Verwacht Resultaat |
|----------|-------------------|
| Desktop dashboard laden | Header met nav zichtbaar |
| Klik op nav item | Navigeert naar juiste tab/pagina |
| Admin zet feature uit | Feature verdwijnt voor alle users |
| Feature toggle aan/uit | Component toont/verbergt correct |
| Logout klikken | User wordt uitgelogd, redirect naar home |

## Mockup

### Desktop Header
```
┌────────────────────────────────────────────────────────────────────┐
│  🔥 Bovenkamer              Home  Voorspellingen  Ranking  Profiel │
│     Winterproef                                     Jan ▼  [Logout]│
└────────────────────────────────────────────────────────────────────┘
```

## Relaties

| User Story | Impact |
|------------|--------|
| US-007 (Dashboard) | Dashboard layout wijzigt |
| US-005 (Burger Stack) | Wrapped in FeatureToggle |
| US-008 (Predictions) | Wrapped in FeatureToggle |
