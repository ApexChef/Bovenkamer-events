# Betaalmodule Documentatie

Dit document bevat een overzicht van de betaalmodule documentatie voor de Bovenkamer Winterproef.

## Status

| Aspect | Status |
|--------|--------|
| **Specificatie** | ✅ Compleet |
| **Implementatie** | ⏳ Backlog |
| **Tikkie API** | 📋 Nog niet geïntegreerd |

## Documentatie

| Document | Beschrijving |
|----------|--------------|
| [BACKLOG.md](./BACKLOG.md) | Volledige specificatie van de betaalmodule |

## Overzicht

De betaalmodule biedt:

- **Automatische Tikkie generatie** - Betaalverzoeken per registratie
- **Betalingsstatus tracking** - Real-time overzicht van betalingen
- **Automatische herinneringen** - Na configureerbaar aantal dagen
- **Admin dashboard** - Volledig overzicht en bulk acties

## Architectuur

```
┌─────────────────────────────────────────────────────────────────┐
│                        BETAALFLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Registratie Compleet                                          │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────┐                                           │
│   │ Tikkie Genereren│ ──► Tikkie API (POST /paymentrequests)   │
│   └────────┬────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │ Email Versturen │ ──► Betaallink + QR code                  │
│   └────────┬────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐      ┌─────────────────┐                 │
│   │ Wacht op        │◄─────│ Tikkie Webhook  │                 │
│   │ Betaling        │      │ (status update) │                 │
│   └────────┬────────┘      └─────────────────┘                 │
│            │                                                     │
│            ▼                                                     │
│   ✅ Betaling Ontvangen                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
-- Betaalinstellingen per event
payment_settings
├── id
├── amount_cents
├── amount_partner_cents
├── description
├── deadline
├── tikkie_enabled
├── auto_reminder_days
└── created_at

-- Individuele betaalverzoeken
payment_requests
├── id
├── registration_id
├── tikkie_id
├── tikkie_url
├── amount_cents
├── status (pending/paid/expired/cancelled)
├── paid_at
├── reminder_sent_at
└── created_at
```

## API Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/payments/settings` | GET/POST | Betaalinstellingen |
| `/api/payments/request` | POST | Nieuw betaalverzoek |
| `/api/payments/status` | GET | Alle betalingsstatussen |
| `/api/payments/reminder` | POST | Herinnering versturen |
| `/api/payments/webhook` | POST | Tikkie webhook |

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

## Dependencies

- Tikkie Business account (ABN AMRO)
- API credentials (sandbox + productie)
- Email service (Resend - al geconfigureerd)

## Gerelateerde Documentatie

- [Auth Systeem](../auth/README.md) - Gebruikers authenticatie
- [Frontend](../frontend/IMPLEMENTATION.md) - UI componenten
