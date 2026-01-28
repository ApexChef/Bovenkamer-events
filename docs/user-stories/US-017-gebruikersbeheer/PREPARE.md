# US-017 Gebruikersbeheer - Preparation Phase

## Executive Summary

This document provides comprehensive research findings for implementing user management functionality (US-017) in the Bovenkamer Winterproef application. The research covers the existing database structure, authentication system, API endpoints, and UI components that will be used or extended for this feature.

**Key Findings**:
- Users table has NO `is_active` column currently - must be added for soft delete functionality
- Existing admin infrastructure provides solid foundation for user management
- Points ledger table supports adding/subtracting points with descriptions
- Authentication and authorization system is mature and uses JWT tokens
- Rich set of UI components available for building the interface
- Role-based access control (RBAC) is implemented via JWT claims

**Critical Dependencies**:
- Database migration required to add `is_active` column and `deleted_at` timestamp
- Must extend existing admin API patterns
- Should integrate with existing `/admin/deelnemers` and `/admin/registraties` pages

---

## 1. Database Structure Analysis

### 1.1 Users Table

**Location**: `supabase/migrations/001_initial_schema.sql` (lines 8-21)
**Extended by**: `supabase/migrations/20260117_auth_system.sql` (lines 116-132)
**Further extended by**: `supabase/migrations/20260128_name_split.sql` (lines 6-8)

#### Current Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,                    -- Added in 20260128_name_split.sql
  last_name TEXT,                     -- Added in 20260128_name_split.sql
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'quizmaster')),
  auth_code TEXT UNIQUE,

  -- Points
  total_points INTEGER DEFAULT 0,
  registration_points INTEGER DEFAULT 0,
  prediction_points INTEGER DEFAULT 0,
  quiz_points INTEGER DEFAULT 0,
  game_points INTEGER DEFAULT 0,

  -- Authentication fields (added in 20260117_auth_system.sql)
  email_verified BOOLEAN DEFAULT FALSE,
  registration_status TEXT DEFAULT 'pending'
    CHECK (registration_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  blocked_features TEXT[] DEFAULT '{}',
  last_login_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Available Roles

Defined in `role` column CHECK constraint:
- `participant` (default)
- `admin`
- `quizmaster`

#### Registration Statuses

Defined in `registration_status` column CHECK constraint:
- `pending` - Email not verified or awaiting admin approval
- `approved` - Full access granted
- `rejected` - Registration rejected by admin
- `cancelled` - User cancelled their own registration

#### Missing Fields for US-017

**CRITICAL**: The following columns are MISSING and must be added:

```sql
-- Required for soft delete functionality
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN deletion_reason TEXT;

-- Add index for performance
CREATE INDEX idx_users_is_active ON users(is_active);
```

#### Existing Indexes

From `001_initial_schema.sql` and `20260117_auth_system.sql`:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_registration_status ON users(registration_status);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_users_auth_status
  ON users(email, email_verified, registration_status)
  WHERE registration_status != 'cancelled';
```

### 1.2 Points Ledger Table

**Location**: `supabase/migrations/001_initial_schema.sql` (lines 121-128)

```sql
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('registration', 'prediction', 'quiz', 'game', 'bonus')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);
```

#### Points Sources

Available values for `source` column:
- `registration` - Points from completing registration
- `prediction` - Points from predictions
- `quiz` - Points from quiz participation
- `game` - Points from games
- `bonus` - Manual bonus points (admin-awarded)

**Note**: For manual point adjustments, use `source = 'bonus'` with positive or negative `points` values.

#### Related Functionality

When points are added/subtracted, the following user columns must be updated:
- `total_points` - Sum of all points
- Optionally category-specific: `registration_points`, `prediction_points`, `quiz_points`, `game_points`

**Recommendation**: Create a database function to handle point updates atomically:

```sql
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source TEXT,
  p_description TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert into ledger
  INSERT INTO points_ledger (user_id, points, source, description)
  VALUES (p_user_id, p_points, p_source, p_description);

  -- Update user total
  UPDATE users
  SET total_points = total_points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 Registrations Table

**Location**: `supabase/migrations/001_initial_schema.sql` (lines 24-58)
**Extended by**: `20260117_auth_system.sql` (lines 134-142), `20260128_name_split.sql` (lines 11-15)

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Personal details
  name TEXT NOT NULL,
  first_name TEXT,              -- Added in 20260128_name_split.sql
  last_name TEXT,               -- Added in 20260128_name_split.sql
  email TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  has_partner BOOLEAN DEFAULT FALSE,
  partner_name TEXT,
  partner_first_name TEXT,      -- Added in 20260128_name_split.sql
  partner_last_name TEXT,       -- Added in 20260128_name_split.sql
  dietary_requirements TEXT,

  -- Skills & preferences
  primary_skill TEXT NOT NULL,
  additional_skills TEXT,
  music_decade TEXT CHECK (music_decade IN ('80s', '90s', '00s', '10s')),
  music_genre TEXT,

  -- Quiz answers & AI assignment (stored as JSONB)
  quiz_answers JSONB DEFAULT '{}',
  ai_assignment JSONB,
  predictions JSONB DEFAULT '{}',

  -- Status tracking (added in 20260117_auth_system.sql)
  is_complete BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);
```

**Relationship**: One-to-one with `users` table via `user_id` foreign key.

### 1.4 Auth Pins Table

**Location**: `supabase/migrations/20260117_auth_system.sql` (lines 29-44)

```sql
CREATE TABLE auth_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_pins_user_id ON auth_pins(user_id);
```

**Security Note**: PINs are hashed using bcrypt. Never expose PIN hashes in user management interfaces.

---

## 2. Existing API Endpoints

### 2.1 Admin Registration Endpoints

#### GET /api/admin/registrations

**Location**: `src/app/api/admin/registrations/route.ts`

**Functionality**:
- Lists all users with registration data
- Supports filtering by `status` query parameter
- Pagination via `page` and `limit` query parameters
- Returns statistics (pending, approved, rejected counts)

**Response Format**:
```typescript
{
  registrations: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    registrationStatus: 'pending' | 'approved' | 'rejected';
    emailVerified: boolean;
    createdAt: string;
    primarySkill: string;
    hasPartner: boolean;
  }>,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  }
}
```

**Authorization**: Requires admin role (checked via `getUserFromRequest` + `isAdmin`)

#### POST /api/admin/registrations/[id]/approve

**Location**: `src/app/api/admin/registrations/[id]/approve/route.ts`

**Functionality**: Approves a registration (sets `registration_status = 'approved'`)

#### POST /api/admin/registrations/[id]/reject

**Location**: `src/app/api/admin/registrations/[id]/reject/route.ts`

**Functionality**: Rejects a registration with optional reason

**Request Body**:
```typescript
{
  reason?: string
}
```

### 2.2 Admin Participants Endpoints

#### GET /api/admin/participants

**Location**: `src/app/api/admin/participants/route.ts`

**Functionality**: Lists expected participants (separate table for pre-approved attendees)

**Note**: This endpoint is for the `expected_participants` table, NOT the `users` table. It's used for managing a pre-approved guest list.

### 2.3 Missing Endpoints for US-017

The following endpoints need to be created:

1. **GET /api/admin/users** - List all users with search/filter
2. **GET /api/admin/users/[id]** - Get detailed user info
3. **PATCH /api/admin/users/[id]/role** - Change user role
4. **POST /api/admin/users/[id]/points** - Add/subtract points
5. **PATCH /api/admin/users/[id]/deactivate** - Soft delete (set `is_active = false`)
6. **DELETE /api/admin/users/[id]** - Hard delete (permanent removal)

---

## 3. Authentication & Authorization System

### 3.1 JWT Token System

**Location**: `src/lib/auth/jwt.ts`

#### JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  emailVerified: boolean;
  iat?: number;  // Issued at
  exp?: number;  // Expiration (30 days)
}
```

#### Key Functions

```typescript
// Token creation
createToken(payload: JWTPayload): Promise<string>

// Token verification
verifyToken(token: string): Promise<JWTPayload | null>

// Extract user from request
getUserFromRequest(request): Promise<JWTPayload | null>

// Role checks
isAdmin(payload: JWTPayload | null): boolean
isApproved(payload: JWTPayload | null): boolean
isEmailVerified(payload: JWTPayload | null): boolean
```

#### Cookie Management

- Cookie name: `bovenkamer_auth_token`
- httpOnly: `true` (XSS protection)
- Secure: `true` in production
- SameSite: `lax`
- Max age: 30 days

**Usage Pattern in API Routes**:

```typescript
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getUserFromRequest(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
      { status: 403 }
    );
  }

  // Proceed with admin logic
}
```

### 3.2 Client-Side Auth Guard

**Location**: `src/components/AuthGuard.tsx`

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

**Usage**:
```tsx
<AuthGuard requireAdmin requireApproved>
  <UserManagementPage />
</AuthGuard>
```

**Behavior**:
- Checks localStorage cache for session
- Validates session via JWT
- Redirects to login if not authenticated
- Redirects to dashboard if missing required role
- Shows loading spinner during auth check

### 3.3 Zustand Auth Store

**Location**: `src/lib/store.ts`

```typescript
interface AuthStore {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  checkSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}
```

**AuthUser Type** (from `src/types/index.ts`):
```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  emailVerified: boolean;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  blockedFeatures: string[];
}
```

---

## 4. UI Components

### 4.1 Available UI Components

**Location**: `src/components/ui/`

| Component | File | Usage |
|-----------|------|-------|
| `Card` | `Card.tsx` | Container for content sections |
| `CardHeader` | `Card.tsx` | Card title area |
| `CardTitle` | `Card.tsx` | Card title text |
| `CardContent` | `Card.tsx` | Card body content |
| `Button` | `Button.tsx` | Primary actions |
| `Input` | `Input.tsx` | Text input fields |
| `TextArea` | `TextArea.tsx` | Multi-line text input |
| `Select` | `Select.tsx` | Dropdown selection |

### 4.2 Button Component

**Variants**:
- `primary` - Gold background (default)
- `secondary` - Transparent with gold border
- `ghost` - Transparent with hover effect

**Sizes**:
- `sm` - Small (px-4 py-2)
- `md` - Medium (px-6 py-3, default)
- `lg` - Large (px-8 py-4)

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Example**:
```tsx
<Button
  variant="secondary"
  size="sm"
  onClick={handleDelete}
  isLoading={isDeleting}
>
  Verwijderen
</Button>
```

### 4.3 Input Component

**Props**:
```typescript
interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

**Example**:
```tsx
<Input
  label="Naam zoeken"
  placeholder="Zoek op naam of email..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  hint="Typ minimaal 3 karakters"
/>
```

### 4.4 Card Component

**Example Structure**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Gebruikersbeheer</CardTitle>
    <CardDescription>Beheer gebruikersaccounts en rechten</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### 4.5 Design System Colors

**From**: `tailwind.config.ts` and `CLAUDE.md`

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Deep Green | #1B4332 | `bg-deep-green` | Page background |
| Gold | #D4AF37 | `bg-gold`, `text-gold` | Primary accent, CTAs |
| Cream | #F5F5DC | `text-cream` | Primary text |
| Dark Wood | #2C1810 | `bg-dark-wood` | Card backgrounds |
| Warm Red | #8B0000 | `bg-warm-red`, `text-warm-red` | Errors, danger actions |
| Success Green | #2D5A27 | `bg-success-green` | Success states |

**Opacity Modifiers**:
- `/70` - 70% opacity (e.g., `text-cream/70`)
- `/50` - 50% opacity (e.g., `text-cream/50`)
- `/30` - 30% opacity (e.g., `bg-dark-wood/30`)

### 4.6 Fonts

- **Display/Titles**: Playfair Display (serif) - `font-serif`
- **Body**: Source Sans Pro (sans-serif) - default
- **Mono**: JetBrains Mono - `font-mono`

---

## 5. Existing Admin Pages Structure

### 5.1 Admin Dashboard

**Location**: `src/app/admin/page.tsx`

**Features**:
- Statistics cards (total registrations, persons, etc.)
- Quick action links to sub-pages
- Feature toggles management
- Protected with `<AuthGuard requireAdmin requireApproved>`

**Navigation Cards**:
- Betalingen (`/admin/payments`)
- Quiz Beheer (`/admin/quiz`)
- Voorspellingen (`/admin/predictions`)
- Beoordelingen (`/admin/ratings`)

**Layout**: Uses `<DashboardLayout>` wrapper component

### 5.2 Admin Registrations Page

**Location**: `src/app/admin/registraties/page.tsx`

**Features**:
- Lists pending registrations
- Split view: list on left, details on right
- Approve/reject actions with reason
- Shows unverified registrations separately
- Real-time filtering

**UI Pattern**:
```tsx
<div className="grid md:grid-cols-2 gap-6">
  {/* Left: List of items */}
  <div className="space-y-4">
    {/* Clickable cards */}
  </div>

  {/* Right: Detail view */}
  <div className="sticky top-4">
    <AnimatePresence mode="wait">
      {selectedItem ? (
        <DetailCard />
      ) : (
        <EmptyState />
      )}
    </AnimatePresence>
  </div>
</div>
```

### 5.3 Admin Participants Page

**Location**: `src/app/admin/deelnemers/page.tsx`

**Features**:
- Add new expected participants
- List with registration status indicators
- Delete unregistered participants
- Form validation

**Form Pattern**:
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {error && (
    <div className="p-3 bg-warm-red/20 border border-warm-red rounded-lg">
      <p className="text-sm text-warm-red">{error}</p>
    </div>
  )}

  <div className="grid md:grid-cols-2 gap-4">
    <Input label="Field 1" /* ... */ />
    <Input label="Field 2" /* ... */ />
  </div>

  <Button type="submit" isLoading={isSubmitting}>
    Submit
  </Button>
</form>
```

### 5.4 Common Admin Page Structure

**Recommended Pattern**:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminUsersContent />
    </AuthGuard>
  );
}

function AdminUsersContent() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setData(data);
      } else {
        setError(data.message || 'Kon data niet laden');
      }
    } catch (err) {
      setError('Netwerkfout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            ← Terug naar admin dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-gold mb-2">
            Page Title
          </h1>
          <p className="text-cream/60">Description</p>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Section Title</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Content here */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## 6. TypeScript Types

### 6.1 User Type

**Location**: `src/types/index.ts` (lines 38-58)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  auth_code?: string;
  email_verified: boolean;
  registration_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  blocked_features: string[];
  last_login_at?: string;
  total_points: number;
  registration_points: number;
  prediction_points: number;
  quiz_points: number;
  game_points: number;
  created_at: string;
  updated_at: string;
}
```

**Missing Fields** (need to add to type):
```typescript
first_name?: string;
last_name?: string;
is_active?: boolean;        // For soft delete
deleted_at?: string;        // For soft delete tracking
deleted_by?: string;        // Admin who deleted
deletion_reason?: string;   // Reason for deletion
```

### 6.2 Registration Type

**Location**: `src/types/index.ts` (lines 125-159)

```typescript
interface Registration {
  id: string;
  user_id: string;

  // Personal
  name: string;
  email: string;
  birth_year: number;
  has_partner: boolean;
  partner_name?: string;
  dietary_requirements?: string;

  // Skills
  primary_skill: string;
  additional_skills?: string;
  music_decade: '80s' | '90s' | '00s' | '10s';
  music_genre: string;

  // JSONB fields
  quiz_answers: QuizAnswers;
  ai_assignment?: AIAssignment;
  predictions: Predictions;

  // Status
  is_complete: boolean;
  current_step: number;

  // Meta
  created_at: string;
  updated_at: string;
}
```

---

## 7. Search and Filter Requirements

### 7.1 Search Functionality

For US-017, users need to search by:
- Name (first_name, last_name, or full name)
- Email address

**Recommended Implementation**:

**Backend** (PostgreSQL full-text search):
```typescript
// In GET /api/admin/users route
const searchQuery = request.nextUrl.searchParams.get('search');

let query = supabase.from('users').select('*');

if (searchQuery && searchQuery.length >= 3) {
  query = query.or(
    `name.ilike.%${searchQuery}%,` +
    `first_name.ilike.%${searchQuery}%,` +
    `last_name.ilike.%${searchQuery}%,` +
    `email.ilike.%${searchQuery}%`
  );
}
```

**Frontend** (debounced input):
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch] = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch.length >= 3) {
    fetchUsers(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 7.2 Filter Options

Recommended filters:
- **Role**: All / Participant / Admin / Quizmaster
- **Status**: All / Pending / Approved / Rejected / Cancelled
- **Active**: All / Active / Deactivated
- **Email Verified**: All / Verified / Unverified

**URL Structure**:
```
/api/admin/users?search=john&role=participant&status=approved&active=true&page=1&limit=20
```

---

## 8. Points Management

### 8.1 Adding/Subtracting Points

**Database Operation**:
```typescript
// Add points
await supabase.from('points_ledger').insert({
  user_id: userId,
  source: 'bonus',
  points: 50,  // positive
  description: 'Handmatig toegevoegd door admin: Goede bijdrage tijdens quiz'
});

// Subtract points
await supabase.from('points_ledger').insert({
  user_id: userId,
  source: 'bonus',
  points: -25,  // negative
  description: 'Handmatig afgetrokken door admin: Penalty voor te laat komen'
});

// Update user total
await supabase
  .from('users')
  .update({
    total_points: supabase.raw('total_points + ?', [points])
  })
  .eq('id', userId);
```

**API Endpoint Structure**:
```typescript
// POST /api/admin/users/[id]/points
{
  points: number;      // Can be positive or negative
  reason: string;      // Required description
  source?: string;     // Optional, defaults to 'bonus'
}
```

**Response**:
```typescript
{
  success: true;
  user: {
    id: string;
    total_points: number;  // Updated total
  };
  ledgerEntry: {
    id: string;
    points: number;
    description: string;
    created_at: string;
  }
}
```

### 8.2 Points History View

Should display recent point transactions for the user:

```typescript
// GET /api/admin/users/[id]/points-history
const { data } = await supabase
  .from('points_ledger')
  .select('id, points, source, description, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 9. Soft Delete vs Hard Delete

### 9.1 Soft Delete (Deactivate)

**Purpose**: Temporarily disable user without losing data

**Implementation**:
```typescript
// PATCH /api/admin/users/[id]/deactivate
await supabase
  .from('users')
  .update({
    is_active: false,
    deleted_at: new Date().toISOString(),
    deleted_by: adminUserId,
    deletion_reason: reason
  })
  .eq('id', userId);
```

**Effects**:
- User cannot login
- Data remains in database
- Can be reactivated by admin
- Maintains referential integrity

**UI Indicator**:
```tsx
{!user.is_active && (
  <span className="px-2 py-1 bg-warm-red/20 text-warm-red text-xs rounded-full">
    Gedeactiveerd
  </span>
)}
```

### 9.2 Hard Delete (Permanent)

**Purpose**: Permanently remove user and all related data

**Implementation**:
```typescript
// DELETE /api/admin/users/[id]
// Cascade deletes due to ON DELETE CASCADE in foreign keys:
// - registrations
// - points_ledger
// - auth_pins
// - ratings
// - quiz_players
// - quiz_answers

await supabase
  .from('users')
  .delete()
  .eq('id', userId);
```

**CRITICAL**: Add confirmation dialog with user awareness:
```tsx
const handleHardDelete = async (userId: string, userName: string) => {
  const confirmed = window.confirm(
    `WAARSCHUWING: Dit verwijdert ${userName} permanent uit het systeem.\n\n` +
    `Alle data wordt verwijderd:\n` +
    `- Gebruikersaccount\n` +
    `- Registratie gegevens\n` +
    `- Punten geschiedenis\n` +
    `- Quiz deelnames\n` +
    `- Beoordelingen\n\n` +
    `Deze actie kan NIET ongedaan gemaakt worden.\n\n` +
    `Typ "DELETE" om te bevestigen.`
  );

  if (confirmed) {
    const userInput = prompt('Typ "DELETE" om te bevestigen:');
    if (userInput === 'DELETE') {
      await deleteUser(userId);
    }
  }
};
```

### 9.3 Reactivation

**Implementation**:
```typescript
// PATCH /api/admin/users/[id]/reactivate
await supabase
  .from('users')
  .update({
    is_active: true,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null
  })
  .eq('id', userId);
```

---

## 10. Role Management

### 10.1 Role Change Endpoint

**Implementation**:
```typescript
// PATCH /api/admin/users/[id]/role
interface RoleChangeRequest {
  role: 'participant' | 'admin' | 'quizmaster';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getUserFromRequest(request);
  if (!admin || !isAdmin(admin)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const { role } = await request.json();

  // Validate role
  if (!['participant', 'admin', 'quizmaster'].includes(role)) {
    return NextResponse.json(
      { error: 'INVALID_ROLE' },
      { status: 400 }
    );
  }

  // Prevent self-demotion (admin removing their own admin role)
  if (params.id === admin.userId && role !== 'admin') {
    return NextResponse.json(
      { error: 'CANNOT_DEMOTE_SELF' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, user: data });
}
```

### 10.2 Role Change UI

**Select Component**:
```tsx
<Select
  label="Rol"
  value={selectedRole}
  onChange={(e) => handleRoleChange(user.id, e.target.value)}
  disabled={isCurrentUser}
>
  <option value="participant">Deelnemer</option>
  <option value="admin">Admin</option>
  <option value="quizmaster">Quizmaster</option>
</Select>

{isCurrentUser && (
  <p className="text-xs text-cream/50 mt-1">
    Je kunt je eigen rol niet wijzigen
  </p>
)}
```

---

## 11. Detail Page Structure

### 11.1 URL Pattern

```
/admin/gebruikers/[id]
```

Example: `/admin/gebruikers/123e4567-e89b-12d3-a456-426614174000`

### 11.2 Page Sections

**Recommended Layout**:

1. **Header**
   - Name (first_name + last_name)
   - Email
   - Role badge
   - Status badge (Active/Inactive)
   - Back button to list

2. **Account Information Card**
   - Email
   - Email verified status
   - Registration status
   - Role (with change dropdown)
   - Created date
   - Last login
   - Approved by (if approved)

3. **Personal Information Card** (from registrations table)
   - Full name
   - Birth year
   - Partner info (if has_partner)
   - Dietary requirements
   - Primary skill
   - Music preferences

4. **Points Management Card**
   - Current total points
   - Breakdown by category
   - Add/subtract points form
   - Recent point history (last 10 transactions)

5. **Danger Zone Card**
   - Deactivate account button (soft delete)
   - Delete account button (hard delete)
   - Warning text

### 11.3 API Endpoint

```typescript
// GET /api/admin/users/[id]
const { data, error } = await supabase
  .from('users')
  .select(`
    *,
    registrations (
      id,
      name,
      first_name,
      last_name,
      birth_year,
      has_partner,
      partner_name,
      partner_first_name,
      partner_last_name,
      dietary_requirements,
      primary_skill,
      additional_skills,
      music_decade,
      music_genre
    ),
    points_ledger (
      id,
      points,
      source,
      description,
      created_at
    )
  `)
  .eq('id', userId)
  .order('created_at', { foreignTable: 'points_ledger', ascending: false })
  .limit(10, { foreignTable: 'points_ledger' })
  .single();
```

---

## 12. Security Considerations

### 12.1 Authorization Checks

**Critical**: ALL admin endpoints must verify:

```typescript
const user = await getUserFromRequest(request);
if (!user || !isAdmin(user)) {
  return NextResponse.json(
    { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
    { status: 403 }
  );
}
```

### 12.2 Self-Protection

Admins should not be able to:
- Delete their own account
- Demote themselves from admin role
- Deactivate their own account

```typescript
if (targetUserId === currentUser.userId) {
  return NextResponse.json(
    { error: 'CANNOT_MODIFY_SELF' },
    { status: 400 }
  );
}
```

### 12.3 Input Validation

**Required validations**:
- User ID must be valid UUID
- Role must be one of: participant, admin, quizmaster
- Points must be integer (can be negative)
- Reason/description required for destructive actions

### 12.4 Rate Limiting

Consider adding rate limiting for:
- User deletion (max 5 per minute)
- Role changes (max 10 per minute)
- Bulk operations

**Note**: Rate limiting infrastructure exists (`src/lib/auth/rate-limit.ts`) but is primarily used for authentication endpoints. Can be extended.

---

## 13. Error Handling

### 13.1 Standard Error Response

```typescript
interface ErrorResponse {
  error: string;        // Error code
  message: string;      // User-friendly message (Dutch)
  details?: unknown;    // Optional additional context
}
```

### 13.2 Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 403 | Not authenticated or not admin |
| `NOT_FOUND` | 404 | User does not exist |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `CANNOT_MODIFY_SELF` | 400 | Attempted self-modification |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `SERVER_ERROR` | 500 | Unexpected server error |

### 13.3 Frontend Error Display

```tsx
{error && (
  <div className="p-4 bg-warm-red/20 border border-warm-red rounded-lg">
    <p className="text-warm-red font-semibold mb-1">Fout</p>
    <p className="text-warm-red/80 text-sm">{error}</p>
  </div>
)}
```

---

## 14. Testing Considerations

### 14.1 Database Test Users

Should create test users with various states:
- Active participant
- Active admin
- Inactive/deactivated user
- User with high points
- User with negative points
- User without registration data

### 14.2 Edge Cases to Test

1. **Role Changes**:
   - Admin demoting themselves (should fail)
   - Last admin changing role (should warn)
   - Invalid role value

2. **Points**:
   - Adding points to reach exactly 0
   - Subtracting more points than user has (should allow, go negative)
   - Very large point values (test integer limits)

3. **Deletion**:
   - Self-deletion (should fail)
   - Deleting user with active quiz participation
   - Deleting user with pending payments

4. **Search**:
   - Empty search
   - Special characters in search
   - Very long search query
   - SQL injection attempts

### 14.3 API Testing Checklist

- [ ] List users with pagination
- [ ] Search by name (partial match)
- [ ] Search by email
- [ ] Filter by role
- [ ] Filter by status
- [ ] View user detail
- [ ] Change user role
- [ ] Add positive points
- [ ] Subtract points (go negative)
- [ ] Soft delete user
- [ ] Reactivate user
- [ ] Hard delete user
- [ ] Unauthorized access (non-admin)
- [ ] Missing admin token

---

## 15. Recommendations

### 15.1 Database Changes Required

**Priority: HIGH**

Create new migration file: `supabase/migrations/20260128_user_management.sql`

```sql
-- Add soft delete columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comments
COMMENT ON COLUMN users.is_active IS 'Indicates if user account is active (soft delete)';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was deactivated';
COMMENT ON COLUMN users.deleted_by IS 'Admin user ID who deactivated this user';
COMMENT ON COLUMN users.deletion_reason IS 'Reason provided for deactivation';

-- Add function for atomic point updates
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source TEXT,
  p_description TEXT
) RETURNS TABLE(
  new_total_points INTEGER,
  ledger_entry_id UUID
) AS $$
DECLARE
  v_ledger_id UUID;
  v_new_total INTEGER;
BEGIN
  -- Insert into ledger
  INSERT INTO points_ledger (user_id, points, source, description)
  VALUES (p_user_id, p_points, p_source, p_description)
  RETURNING id INTO v_ledger_id;

  -- Update user total
  UPDATE users
  SET total_points = total_points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_total;

  RETURN QUERY SELECT v_new_total, v_ledger_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_user_points IS
  'Atomically add/subtract points from user and create ledger entry';
```

### 15.2 API Endpoints to Create

**Priority: HIGH**

1. `GET /api/admin/users` - List with search/filter
2. `GET /api/admin/users/[id]` - Detail view
3. `PATCH /api/admin/users/[id]/role` - Change role
4. `POST /api/admin/users/[id]/points` - Add/subtract points
5. `GET /api/admin/users/[id]/points-history` - Points ledger
6. `PATCH /api/admin/users/[id]/deactivate` - Soft delete
7. `PATCH /api/admin/users/[id]/reactivate` - Reactivate
8. `DELETE /api/admin/users/[id]` - Hard delete

### 15.3 UI Pages to Create

**Priority: HIGH**

1. `/admin/gebruikers` - List page with search
2. `/admin/gebruikers/[id]` - Detail page

### 15.4 TypeScript Types to Update

**Priority: MEDIUM**

Update `src/types/index.ts`:
```typescript
interface User {
  // ... existing fields
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
}

interface PointsLedgerEntry {
  id: string;
  user_id: string;
  source: 'registration' | 'prediction' | 'quiz' | 'game' | 'bonus';
  points: number;
  description?: string;
  created_at: string;
}

interface AdminUserDetail extends User {
  registration?: Registration;
  points_history?: PointsLedgerEntry[];
}
```

### 15.5 Navigation Integration

**Priority: MEDIUM**

Add link to admin dashboard (`src/app/admin/page.tsx`):

```tsx
<Link href="/admin/gebruikers">
  <Card className="hover:border-gold/50 transition-colors cursor-pointer">
    <CardContent className="py-6 text-center">
      <p className="text-gold font-semibold mb-1">Gebruikersbeheer</p>
      <p className="text-cream/50 text-sm">Beheer accounts en rechten</p>
    </CardContent>
  </Card>
</Link>
```

### 15.6 Audit Logging (Future Enhancement)

**Priority: LOW** (Not in US-017 scope)

For future implementation, consider adding:

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'role_change', 'deactivate', 'delete', 'points_add', etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 16. Next Steps for Architecture Phase

The Architect should focus on:

1. **Data Flow Design**:
   - User list → detail page navigation
   - Real-time updates after actions
   - Optimistic UI updates vs. server confirmation

2. **Component Architecture**:
   - Reusable UserCard component
   - PointsManager component
   - DangerZone component

3. **State Management**:
   - Should user list use Zustand or local state?
   - How to handle search/filter state?
   - Cache invalidation after mutations

4. **API Design Decisions**:
   - Single endpoint with query params vs. multiple specialized endpoints
   - Pagination strategy (offset vs. cursor)
   - Response format standardization

5. **Error Handling Strategy**:
   - Toast notifications vs. inline errors
   - Rollback on failure
   - Retry logic

6. **Performance Optimization**:
   - Debounced search
   - Virtual scrolling for large lists
   - Lazy loading of user details

---

## 17. Resources and References

### 17.1 Key Files to Review

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Original database schema |
| `supabase/migrations/20260117_auth_system.sql` | Auth tables and user extensions |
| `src/lib/auth/jwt.ts` | Authentication utilities |
| `src/app/api/admin/registrations/route.ts` | Example admin API endpoint |
| `src/app/admin/registraties/page.tsx` | Example admin page with list/detail view |
| `src/components/AuthGuard.tsx` | Client-side auth protection |
| `src/types/index.ts` | TypeScript type definitions |

### 17.2 Documentation

- **Project README**: `/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/CLAUDE.md`
- **Database Schema**: Check migration files in `supabase/migrations/`
- **API Conventions**: Documented in CLAUDE.md under "API Conventions"

### 17.3 External Dependencies

- **Supabase** (v2.x): PostgreSQL database and client
- **Next.js** (v14): App Router for API routes and pages
- **jose**: JWT token library
- **bcrypt**: PIN hashing (in `src/lib/auth/pin.ts`)
- **Framer Motion**: Animations (already used in admin pages)

### 17.4 Design System

All colors, fonts, and component styles documented in:
- `tailwind.config.ts`
- Section 4.5 of this document

---

## 18. Summary and Critical Gaps

### 18.1 What Exists

- Solid authentication and authorization system
- Admin role-based access control
- JWT token management
- User and registration tables with relationships
- Points ledger system
- Rich UI component library
- Existing admin page patterns to follow

### 18.2 What's Missing

**CRITICAL**:
- `is_active` column on users table (soft delete)
- `deleted_at`, `deleted_by`, `deletion_reason` columns
- All 8 admin API endpoints for user management
- User list page (`/admin/gebruikers`)
- User detail page (`/admin/gebruikers/[id]`)
- TypeScript types for extended User interface

**NICE TO HAVE** (not in scope):
- Audit logging
- Bulk operations
- Real-time updates
- Advanced search filters

### 18.3 Integration Points

The user management feature will integrate with:
- Existing admin dashboard (add navigation link)
- Authentication system (JWT verification)
- Points ledger (for point adjustments)
- Registrations table (for displaying user profile)

### 18.4 Technical Debt

None identified. The existing codebase is well-structured and follows consistent patterns.

---

## Document Metadata

- **Prepared by**: PACT Preparer (Documentation Specialist)
- **Date**: 2026-01-28
- **User Story**: US-017 Gebruikersbeheer
- **Version**: 1.0
- **Status**: Ready for Architecture Phase

**Next Phase**: Pass to Architect for technical design and component architecture.
