# Authenticatie Systeem

Dit document bevat een overzicht van alle authenticatie-gerelateerde documentatie voor de Bovenkamer Winterproef.

## Status

| Aspect | Status |
|--------|--------|
| **Backend** | ✅ Compleet |
| **Frontend** | ✅ Compleet |
| **Database** | ✅ Compleet |
| **Testing** | 🟡 Handmatig getest |
| **Productie** | ⏳ Wacht op deployment |

## Documentatie

| Document | Beschrijving | Locatie |
|----------|--------------|---------|
| **Quick Start** | 5-minuten setup guide | [QUICK_START.md](./QUICK_START.md) |
| **Backend Implementatie** | Overzicht van backend code | [BACKEND.md](./BACKEND.md) |
| **Implementatie Details** | Volledige technische details | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| **PACT Prepare** | Requirements & analyse | [PACT-PREPARE.md](./PACT-PREPARE.md) |
| **PACT Architecture** | Systeem architectuur | [PACT-ARCHITECTURE.md](./PACT-ARCHITECTURE.md) |

## Overzicht

Het authenticatiesysteem biedt:

- **PIN-gebaseerde authenticatie** (XX## formaat, bcrypt hashing)
- **Email verificatie** (token-based met 48-uur expiratie)
- **Admin approval workflow** (pending → approved/rejected)
- **Rate limiting** (IP + email based, configureerbaar per endpoint)
- **Session management** (JWT tokens in httpOnly cookies)
- **Security hardening** (account lockout, input validatie, XSS/CSRF bescherming)

## Architectuur Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Registratie                Login                               │
│   ──────────────            ─────────                           │
│   1. Naam/Email             1. Email + PIN                      │
│   2. PIN aanmaken           2. JWT token ontvangen              │
│   3. Email verificatie      3. Redirect naar dashboard          │
│   4. Wacht op approval                                          │
│   5. Toegang tot app                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   /api/auth/register      → Nieuwe account aanmaken             │
│   /api/auth/login         → Inloggen met email + PIN            │
│   /api/auth/verify-email  → Email bevestigen via token          │
│   /api/auth/logout        → Uitloggen                           │
│   /api/auth/reset-pin     → PIN reset aanvragen                 │
│                                                                  │
│   /api/admin/participants → Verwachte deelnemers beheren        │
│   /api/admin/registrations→ Registraties goedkeuren/afwijzen    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Nieuwe tabellen:                                               │
│   • auth_pins              - PIN opslag (gehashed)              │
│   • email_verifications    - Email verificatie tokens           │
│   • expected_participants  - Verwachte deelnemers lijst         │
│   • rate_limits            - Rate limiting data                 │
│                                                                  │
│   Uitgebreide tabellen:                                         │
│   • users                  - Auth status velden                 │
│   • registrations          - Status tracking                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## PIN Formaat

**Formaat**: `XX##` (2 hoofdletters + 2 cijfers)

| Voorbeeld | Geldig |
|-----------|--------|
| `AB12` | ✅ |
| `ZZ99` | ✅ |
| `ab12` | ✅ (wordt genormaliseerd naar `AB12`) |
| `1234` | ❌ Geen letters |
| `ABCD` | ❌ Geen cijfers |

**Security**:
- 67.600 unieke combinaties (26² × 10²)
- bcrypt hashing (10 rounds)
- Account lockout na 10 mislukte pogingen
- Rate limiting: 10 pogingen per 15 minuten

## User States

```
Registratie → Email Verificatie → Admin Approval → Login
    ↓               ↓                   ↓            ↓
  pending    email_verified=false   approved    full access
             email_verified=true    pending
                                    rejected (blocked)
```

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

# Authentication
JWT_SECRET=your-32-char-secret-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Email (productie)
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@bovenkamer-winterproef.nl
```

## Gerelateerde Documentatie

- [Frontend Implementatie](../frontend/IMPLEMENTATION.md) - UI componenten
- [CLAUDE.md](../../CLAUDE.md) - Project overzicht
- [HANDOVER.md](../../HANDOVER.md) - Deployment instructies
