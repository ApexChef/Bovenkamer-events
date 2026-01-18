# Bovenkamer Winterproef

A registration and live quiz platform for the Bovenkamer Winterproef New Year's BBQ event (Dutch).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand (with localStorage persistence)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth**: Custom JWT-based with PIN codes + email verification
- **Payments**: Tikkie QR code integration
- **Email**: Resend API
- **AI**: Anthropic Claude API (for humorous task assignments)

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page with login/register CTAs
│   ├── layout.tsx                # Root layout with fonts
│   ├── globals.css               # Global styles
│   │
│   ├── login/                    # Login page
│   ├── register/                 # Multi-step registration flow
│   ├── dashboard/                # Personal dashboard after login
│   ├── predictions/              # Predictions module
│   ├── rate/                     # Boy Boom rating page
│   │
│   ├── quiz/                     # Live quiz (player interface)
│   │   └── master/               # Quizmaster control panel
│   │
│   ├── admin/                    # Admin dashboard
│   │   ├── page.tsx              # Main admin overview
│   │   ├── registraties/         # Registration management
│   │   ├── deelnemers/           # Participant management
│   │   ├── payments/             # Payment tracking (Tikkie)
│   │   ├── predictions/          # Prediction overview
│   │   ├── quiz/                 # Quiz management
│   │   └── ratings/              # Rating overview
│   │
│   ├── bevestig/[token]/         # Email verification page
│   ├── vergeet-pin/              # Forgot PIN page
│   ├── reset-pin/[token]/        # PIN reset page
│   │
│   └── api/                      # API routes
│       ├── auth/                 # Authentication endpoints
│       │   ├── register/         # POST: Create account
│       │   ├── login/            # POST: Login with email+PIN
│       │   ├── logout/           # POST: Logout
│       │   ├── verify-email/     # GET: Verify email token
│       │   ├── resend-verification/ # POST: Resend verification email
│       │   └── reset-pin/        # POST/GET: PIN reset flow
│       │
│       ├── admin/                # Admin-only endpoints
│       │   ├── registrations/    # GET: All registrations
│       │   │   └── [id]/
│       │   │       ├── approve/  # POST: Approve registration
│       │   │       └── reject/   # POST: Reject registration
│       │   └── participants/     # GET: Admin participant list
│       │
│       ├── payments/             # Payment endpoints
│       │   ├── route.ts          # GET/POST: List & create payments
│       │   ├── [id]/             # PATCH: Update payment status
│       │   ├── settings/         # GET/POST: Tikkie settings
│       │   ├── reminder/         # POST: Send payment reminder
│       │   └── webhook/          # POST: Tikkie webhook
│       │
│       ├── registration/         # POST: Save registration data
│       ├── predictions/          # POST: Save predictions
│       ├── participants/         # GET: Public participant list
│       ├── rating/               # POST/GET: Ratings
│       ├── leaderboard/          # GET: Points leaderboard
│       └── assignment/           # POST: AI task assignment
│
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx            # Primary button component
│   │   ├── Card.tsx              # Card container
│   │   ├── Input.tsx             # Text input
│   │   ├── TextArea.tsx          # Textarea input
│   │   ├── Select.tsx            # Dropdown select
│   │   ├── Checkbox.tsx          # Checkbox input
│   │   ├── RadioGroup.tsx        # Radio button group
│   │   ├── Slider.tsx            # Range slider
│   │   ├── PINInput.tsx          # 4-digit PIN input
│   │   ├── ProgressSteps.tsx     # Step indicator
│   │   └── index.ts              # Barrel export
│   │
│   ├── forms/                    # Registration step components
│   │   ├── Step0Auth.tsx         # Account creation (email + PIN)
│   │   ├── Step1Personal.tsx     # Personal info
│   │   ├── Step2Skills.tsx       # Skills & preferences
│   │   ├── Step3Quiz.tsx         # Fun quiz questions
│   │   ├── Step4Assignment.tsx   # AI-generated task reveal
│   │   └── index.ts              # Barrel export
│   │
│   ├── AuthGuard.tsx             # Route protection component
│   └── PaymentCard.tsx           # Payment/Tikkie QR display
│
├── lib/
│   ├── supabase.ts               # Supabase client initialization
│   ├── store.ts                  # Zustand stores (auth, registration, predictions)
│   ├── tikkie.ts                 # Tikkie payment integration
│   │
│   └── auth/                     # Authentication utilities
│       ├── jwt.ts                # JWT token creation/verification
│       ├── pin.ts                # PIN hashing with bcrypt
│       ├── rate-limit.ts         # Rate limiting for auth endpoints
│       ├── email-service.ts      # Email sending via Resend
│       └── email-templates.ts    # HTML email templates
│
└── types/
    └── index.ts                  # TypeScript types and constants
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Authentication
JWT_SECRET=your-secure-jwt-secret

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Payments (Tikkie)
TIKKIE_API_KEY=your-tikkie-api-key
TIKKIE_SANDBOX_KEY=your-tikkie-sandbox-key

# AI (Optional)
ANTHROPIC_API_KEY=sk-ant-...
```

## Database Schema

Supabase PostgreSQL tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts with auth info, roles, and points |
| `registrations` | Registration data including quiz answers and AI assignment |
| `points_ledger` | Points tracking per category |
| `ratings` | Boy Boom ratings (location, hospitality, etc.) |
| `quiz_questions` | Quiz questions with types and answers |
| `quiz_sessions` | Quiz game sessions |
| `quiz_players` | Players in quiz sessions |
| `quiz_answers` | Player answers to quiz questions |
| `payments` | Payment records with Tikkie integration |
| `payment_settings` | Tikkie configuration |

## Authentication Flow

1. **Registration**: Email + 4-digit PIN → verification email sent
2. **Email Verification**: Click link → account activated
3. **Login**: Email + PIN → JWT token issued
4. **Session**: 30-day localStorage cache with PIN hash validation
5. **PIN Reset**: Request → email with reset link → new PIN

User roles: `participant`, `admin`, `quizmaster`

Registration statuses: `pending`, `approved`, `rejected`, `cancelled`

## Zustand Stores

Located in `src/lib/store.ts`:

- **useRegistrationStore**: Multi-step form data, current step, AI assignment
- **usePredictionsStore**: User predictions data
- **useAuthStore**: Current user, auth token, session management

All stores use localStorage persistence with the `bovenkamer-` prefix.

## Design System

### Colors (tailwind.config.ts)

| Name | Hex | Usage |
|------|-----|-------|
| `deep-green` | #1B4332 | Background |
| `gold` | #D4AF37 | Accent, CTAs |
| `cream` | #F5F5DC | Text |
| `dark-wood` | #2C1810 | Cards |
| `warm-red` | #8B0000 | Errors |
| `success-green` | #2D5A27 | Success states |

### Fonts

- **Titles**: Playfair Display (serif)
- **Body**: Source Sans Pro (sans-serif)
- **Mono**: JetBrains Mono (code)

### UI Components

Use the components from `src/components/ui/`:
- Consistent styling with theme colors
- Framer Motion animations built-in
- Accessible form controls

## Key Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login page |
| `/register` | Public | Multi-step registration |
| `/bevestig/[token]` | Public | Email verification |
| `/vergeet-pin` | Public | Forgot PIN |
| `/reset-pin/[token]` | Public | Reset PIN form |
| `/dashboard` | Auth | Personal dashboard |
| `/predictions` | Auth | Make predictions |
| `/rate` | Auth | Rate the venue |
| `/quiz` | Auth | Live quiz (player) |
| `/quiz/master` | Quizmaster | Quiz control panel |
| `/admin/*` | Admin | Admin pages |

## API Conventions

- All API routes use Next.js App Router conventions (`route.ts`)
- JSON responses with consistent structure
- Error responses: `{ error: string, code?: string }`
- Auth via JWT in cookies or Authorization header
- Rate limiting on auth endpoints

## Development Guidelines

### Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Prefer named exports for components
- Use barrel exports (`index.ts`) for component directories

### State Management

- Use Zustand stores for global state
- Local state with `useState` for component-specific data
- Form state in registration store persists across page reloads

### API Patterns

```typescript
// Example API route pattern
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input
    // Process request
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: 'Error message' }, { status: 500 });
  }
}
```

### Protected Routes

Use `AuthGuard` component for client-side protection:
```tsx
<AuthGuard requiredRole="admin">
  <AdminContent />
</AuthGuard>
```

### Animations

Use Framer Motion for page transitions and interactions:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## Deployment

Hosted on Netlify with automatic deploys from `main` branch.

- **Build command**: `npm run build`
- **Publish directory**: `.next`

## Common Tasks

### Adding a new page

1. Create folder in `src/app/` with `page.tsx`
2. Use `AuthGuard` if authentication required
3. Follow design system colors and components

### Adding a new API route

1. Create folder in `src/app/api/` with `route.ts`
2. Export HTTP method handlers (`GET`, `POST`, etc.)
3. Add rate limiting for sensitive endpoints
4. Return consistent JSON responses

### Modifying registration flow

1. Update types in `src/types/index.ts`
2. Modify relevant step component in `src/components/forms/`
3. Update Zustand store if new fields needed
4. Update API route if server-side changes needed

## Language

The UI is in Dutch. Key terms:
- Registratie = Registration
- Deelnemers = Participants
- Voorspellingen = Predictions
- Beoordeling = Rating
- Bevestig = Confirm/Verify
- Vergeet PIN = Forgot PIN
