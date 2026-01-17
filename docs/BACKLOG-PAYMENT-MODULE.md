# Backlog Item: Betaalmodule met Tikkie Integratie

## PACT Framework

### Problem (Probleem)
Event organisatoren moeten handmatig betalingen innen van gasten via losse Tikkie links, bank apps, of contant. Dit leidt tot:
- Geen overzicht wie wel/niet betaald heeft
- Handmatig bijhouden in spreadsheets
- Herinneringen sturen is arbeidsintensief
- Geen koppeling tussen registratie en betaling

### Action (Actie)
Implementeer een geïntegreerde betaalmodule die:
1. Automatisch Tikkie betaalverzoeken genereert per registratie
2. Betalingsstatus real-time synchroniseert
3. Automatische herinneringen stuurt
4. Dashboard toont met betaaloverzicht

### Context
- **Platform**: Feestify / Bovenkamer Winterproef
- **Doelgroep**: Event organisatoren in Nederland
- **Betaalmethode**: Tikkie (ABN AMRO API) - meest gebruikte in NL
- **Gemiddeld bedrag**: €25-75 per persoon
- **Volume**: 10-100 gasten per event

### Target (Doel)
- **Conversie**: 95% betalingen binnen 7 dagen
- **Tijdsbesparing**: 2 uur per event voor organisator
- **Revenue**: +€5 per event als add-on

---

## User Stories

### US-001: Betaling instellen
**Als** event organisator
**Wil ik** een bedrag per persoon kunnen instellen
**Zodat** gasten weten hoeveel ze moeten betalen

**Acceptatiecriteria:**
- [ ] Bedrag invoerveld (€0.01 - €999.99)
- [ ] Optioneel: verschillende prijzen (met/zonder partner)
- [ ] Beschrijving voor betaalverzoek
- [ ] Deadline instellen

### US-002: Automatisch betaalverzoek
**Als** gast die zich registreert
**Wil ik** automatisch een Tikkie ontvangen
**Zodat** ik direct kan betalen

**Acceptatiecriteria:**
- [ ] Tikkie link gegenereerd na registratie
- [ ] Email met betaallink verstuurd
- [ ] Link ook zichtbaar in dashboard
- [ ] QR code optie

### US-003: Betalingsstatus bekijken
**Als** event organisator
**Wil ik** zien wie betaald heeft
**Zodat** ik weet wie ik moet herinneren

**Acceptatiecriteria:**
- [ ] Lijst met alle gasten + betaalstatus
- [ ] Filter: betaald / openstaand / verlopen
- [ ] Totaalbedrag ontvangen vs verwacht
- [ ] Export naar CSV

### US-004: Betaalherinnering sturen
**Als** event organisator
**Wil ik** herinneringen kunnen sturen
**Zodat** openstaande betalingen binnenkomen

**Acceptatiecriteria:**
- [ ] Handmatig herinnering sturen per persoon
- [ ] Bulk herinnering naar alle openstaande
- [ ] Automatische herinnering na X dagen (optioneel)

---

## Technische Specificaties

### Tikkie API Integratie

**API Documentatie:** https://developer.abnamro.com/api-products/tikkie

**Benodigde endpoints:**
```
POST /paymentrequests     - Nieuw betaalverzoek
GET  /paymentrequests/:id - Status ophalen
GET  /paymentrequests     - Alle verzoeken
```

**Authenticatie:**
- OAuth 2.0 (API Key + Secret)
- Sandbox beschikbaar voor testen

**Webhook:**
- Betaling ontvangen notificatie
- Status updates

### Database Schema

```sql
-- Payment settings per event
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  amount_cents INTEGER NOT NULL,
  amount_partner_cents INTEGER,
  description TEXT,
  deadline DATE,
  tikkie_enabled BOOLEAN DEFAULT true,
  auto_reminder_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual payment requests
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id),
  tikkie_id TEXT UNIQUE,
  tikkie_url TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, expired, cancelled
  paid_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment webhooks log
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY,
  tikkie_id TEXT,
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

```
POST /api/payments/settings     - Betaalinstellingen opslaan
GET  /api/payments/settings     - Instellingen ophalen
POST /api/payments/request      - Nieuw betaalverzoek genereren
GET  /api/payments/status       - Alle betalingsstatussen
POST /api/payments/reminder     - Herinnering versturen
POST /api/payments/webhook      - Tikkie webhook endpoint
```

### Environment Variables

```env
TIKKIE_API_KEY=xxx
TIKKIE_API_SECRET=xxx
TIKKIE_SANDBOX=true  # false voor productie
```

---

## Wireframes

### Admin: Betaalinstellingen
```
┌─────────────────────────────────────┐
│ 💰 Betaalinstellingen               │
├─────────────────────────────────────┤
│ Bedrag per persoon:  [€ 50.00    ]  │
│ Bedrag met partner:  [€ 90.00    ]  │
│                                     │
│ Beschrijving:                       │
│ [Bovenkamer Winterproef 2026     ]  │
│                                     │
│ Deadline: [20 januari 2026    📅]   │
│                                     │
│ ☑ Automatische herinnering na 3 dgn │
│                                     │
│ [Tikkie Koppelen 🔗]   [Opslaan ✓]  │
└─────────────────────────────────────┘
```

### Admin: Betaaloverzicht
```
┌─────────────────────────────────────────────────┐
│ 💳 Betalingen                    [Herinner Alle]│
├─────────────────────────────────────────────────┤
│ Ontvangen: €450 / €600 verwacht (75%)           │
│ ████████████░░░░                                │
├─────────────────────────────────────────────────┤
│ ✓ Jan de Vries      €50    Betaald  14 jan     │
│ ✓ PietAnsen        €90    Betaald  15 jan     │
│ ○ Marie Smit        €50    Openstaand [Herinner]│
│ ○ Kees Bakker       €50    Openstaand [Herinner]│
│ ✗ Anne Jansen       €50    Verlopen  [Opnieuw] │
└─────────────────────────────────────────────────┘
```

### Gast: Dashboard met betaalknop
```
┌─────────────────────────────────────┐
│ 💰 Betaling                         │
├─────────────────────────────────────┤
│ Bedrag: €50,00                      │
│ Status: ○ Openstaand                │
│                                     │
│ Deadline: 20 januari 2026           │
│                                     │
│ [████ Betaal met Tikkie ████]       │
│                                     │
│ Of scan QR code:                    │
│      ▄▄▄▄▄▄▄                       │
│      █ QR  █                       │
│      ▀▀▀▀▀▀▀                       │
└─────────────────────────────────────┘
```

---

## Acceptatiecriteria (DoD)

- [ ] Unit tests voor API routes
- [ ] Integration test met Tikkie sandbox
- [ ] Error handling voor API failures
- [ ] Webhook retry mechanisme
- [ ] Logging voor audit trail
- [ ] GDPR compliant (geen betaaldata opslaan)
- [ ] Mobile responsive UI
- [ ] Documentatie bijgewerkt

---

## Risico's & Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Tikkie API downtime | Hoog | Fallback: handmatige link, retry queue |
| Webhook niet ontvangen | Medium | Polling als backup, handmatige sync |
| Dubbele betalingen | Hoog | Idempotency keys, duplicate check |
| Privacy concerns | Medium | Minimale data opslag, GDPR compliant |

---

## Tijdsinschatting

| Fase | Uren |
|------|------|
| API setup & auth | 2 |
| Database schema | 1 |
| Payment request flow | 3 |
| Webhook handling | 2 |
| Admin UI | 3 |
| Guest UI | 2 |
| Testing | 2 |
| **Totaal** | **15** |

---

## Dependencies

- Tikkie Business account (ABN AMRO)
- API credentials (sandbox + productie)
- Email service voor herinneringen (optioneel: Resend, SendGrid)
