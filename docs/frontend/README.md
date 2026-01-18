# Frontend Documentatie

Dit document bevat een overzicht van de frontend implementatie documentatie voor de Bovenkamer Winterproef.

## Status

| Aspect | Status |
|--------|--------|
| **Auth UI** | ✅ Compleet |
| **Registration Flow** | ✅ Compleet |
| **Dashboard** | ✅ Basis |
| **Admin Pages** | ✅ Compleet |
| **Quiz Interface** | ✅ Compleet |

## Documentatie

| Document | Beschrijving |
|----------|--------------|
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Auth UI implementatie details |

## Tech Stack

| Technologie | Versie | Gebruik |
|-------------|--------|---------|
| Next.js | 14 | App Router |
| TypeScript | 5.x | Taal |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 10.x | Animaties |
| Zustand | 4.x | State management |
| Lucide React | - | Icons |

## Component Structuur

```
src/
├── app/                          # Next.js pages
│   ├── page.tsx                  # Landing
│   ├── login/                    # Login page
│   ├── register/                 # Registration flow
│   ├── dashboard/                # User dashboard
│   ├── predictions/              # Predictions module
│   ├── rate/                     # Rating page
│   ├── quiz/                     # Quiz player
│   │   └── master/               # Quizmaster panel
│   └── admin/                    # Admin pages
│
├── components/
│   ├── ui/                       # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── PINInput.tsx          # PIN input component
│   │   └── ...
│   │
│   ├── forms/                    # Registration steps
│   │   ├── Step0Auth.tsx         # PIN creation
│   │   ├── Step1Personal.tsx
│   │   ├── Step2Skills.tsx
│   │   ├── Step3Quiz.tsx
│   │   └── Step4Assignment.tsx
│   │
│   └── AuthGuard.tsx             # Route protection
│
└── lib/
    └── store.ts                  # Zustand stores
```

## Key Components

### PINInput

Herbruikbare PIN input component met 4 karakter slots (2 letters + 2 cijfers).

**Features**:
- Auto-focus naar volgende input
- Keyboard navigatie (pijltjes, backspace)
- Plak ondersteuning met format validatie
- Visuele feedback voor validatie
- Mobile-friendly met grote touch targets

**Props**:
```typescript
interface PINInputProps {
  value?: string;
  onChange?: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}
```

### AuthGuard

Route bescherming component voor authenticatie en autorisatie.

**Features**:
- Check localStorage cache voor API validatie
- Valideer sessie met backend
- Role-based access (admin, participant)
- Status-based access (approved, verified)
- Aanpasbare redirects en loading states

**Props**:
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
  requireVerified?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}
```

## Design System

### Kleuren

| Naam | Hex | Gebruik |
|------|-----|---------|
| `deep-green` | #1B4332 | Achtergrond |
| `gold` | #D4AF37 | Accent, CTAs |
| `cream` | #F5F5DC | Tekst |
| `dark-wood` | #2C1810 | Cards |
| `warm-red` | #8B0000 | Errors |
| `success-green` | #2D5A27 | Success states |

### Fonts

| Type | Font | Gebruik |
|------|------|---------|
| Titels | Playfair Display | Headers |
| Body | Source Sans Pro | Tekst |
| Mono | JetBrains Mono | Code |

## State Management

```typescript
// Auth Store
interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: 'participant' | 'admin' | 'quizmaster' | null;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | null;
  emailVerified: boolean;
  isAuthenticated: boolean;
}

// Registration Store
interface RegistrationState {
  currentStep: number;
  formData: RegistrationFormData;
  aiAssignment: AIAssignment | null;
}

// Predictions Store
interface PredictionsState {
  predictions: Predictions;
}
```

## Gerelateerde Documentatie

- [Auth Systeem](../auth/README.md) - Backend authenticatie
- [User Stories](../user-stories/README.md) - Feature specificaties
- [CLAUDE.md](../../CLAUDE.md) - Project overzicht
