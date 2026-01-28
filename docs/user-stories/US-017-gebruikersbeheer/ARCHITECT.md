# US-017 Gebruikersbeheer - Architecture Document

## Executive Summary

This document provides the complete technical architecture for implementing user management functionality in the Bovenkamer Winterproef application. The system enables administrators to view, search, and manage user accounts including role changes, point adjustments, and account activation/deletion.

**Key Architectural Decisions**:
- Two-page approach: list page (`/admin/gebruikers`) and detail page (`/admin/gebruikers/[id]`)
- RESTful API design with 8 specialized endpoints
- Database extension with soft delete columns
- Read-only impersonation feature for viewing user registration data
- Client-side search with debouncing
- Local component state (no Zustand needed)
- Optimistic UI updates with server confirmation

**Technical Stack**:
- Next.js 14 App Router
- TypeScript with strict mode
- Supabase PostgreSQL
- Tailwind CSS with custom theme
- Framer Motion for animations
- JWT authentication

**Critical Dependencies**:
- Database migration required BEFORE implementation
- Admin authentication system (already exists)
- Points ledger system (already exists)
- Existing UI component library

---

## Table of Contents

1. [System Context](#1-system-context)
2. [Component Architecture](#2-component-architecture)
3. [Database Design](#3-database-design)
4. [API Architecture](#4-api-architecture)
5. [Page Layouts](#5-page-layouts)
6. [Impersonation Feature](#6-impersonation-feature)
7. [State Management](#7-state-management)
8. [Data Flow](#8-data-flow)
9. [Security Architecture](#9-security-architecture)
10. [Error Handling](#10-error-handling)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. System Context

### 1.1 System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin User Interface                      │
│  ┌──────────────────┐      ┌────────────────────────────┐   │
│  │  User List Page  │──────│  User Detail Page          │   │
│  │  /admin/         │      │  /admin/gebruikers/[id]    │   │
│  │  gebruikers      │      │                            │   │
│  └──────────────────┘      │  - View Info               │   │
│          │                 │  - Change Role             │   │
│          │                 │  - Adjust Points           │   │
│          │                 │  - Deactivate/Delete       │   │
│          │                 │  - View Registration Data  │   │
│          │                 └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GET    /api/admin/users                               │ │
│  │  GET    /api/admin/users/[id]                          │ │
│  │  PATCH  /api/admin/users/[id]/role                     │ │
│  │  POST   /api/admin/users/[id]/points                   │ │
│  │  PATCH  /api/admin/users/[id]/deactivate               │ │
│  │  PATCH  /api/admin/users/[id]/reactivate               │ │
│  │  DELETE /api/admin/users/[id]                          │ │
│  │  GET    /api/admin/users/[id]/registration             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   users     │──│ registrations│──│  points_ledger   │   │
│  │             │  │              │  │                  │   │
│  │ - is_active │  │ - quiz_answ. │  │ - points         │   │
│  │ - deleted_at│  │ - skills     │  │ - description    │   │
│  │ - deleted_by│  │ - preferences│  │                  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 External Actors

| Actor | Role | Access Level |
|-------|------|-------------|
| Admin User | Administrator who manages users | Full access to all user management functions |
| Target User | User being managed | No direct interaction (passive) |
| System | Background processes | Cascade deletes, point calculations |

### 1.3 Integration Points

| System Component | Integration Type | Purpose |
|------------------|------------------|---------|
| JWT Auth System | Authentication | Verify admin role for all endpoints |
| Points Ledger | Data modification | Add/subtract points with description |
| Registration System | Data display | Show user's filled-in registration data |
| Email System | Notification | Future enhancement (not in US-017 scope) |

---

## 2. Component Architecture

### 2.1 High-Level Component Structure

```
src/app/admin/gebruikers/
├── page.tsx                          # User list page
├── [id]/
│   └── page.tsx                      # User detail page
│
src/app/api/admin/users/
├── route.ts                          # GET: list users
├── [id]/
│   ├── route.ts                      # GET: user detail, DELETE: hard delete
│   ├── role/
│   │   └── route.ts                  # PATCH: change role
│   ├── points/
│   │   └── route.ts                  # POST: add/subtract points
│   ├── deactivate/
│   │   └── route.ts                  # PATCH: soft delete
│   ├── reactivate/
│   │   └── route.ts                  # PATCH: reactivate
│   └── registration/
│       └── route.ts                  # GET: full registration data (impersonation)
│
src/components/admin/
├── UserCard.tsx                      # Reusable user card component
├── PointsManager.tsx                 # Points adjustment form
├── DangerZone.tsx                    # Deactivate/delete section
├── RoleSelector.tsx                  # Role change dropdown
└── RegistrationViewer.tsx            # Read-only registration display
```

### 2.2 Component Responsibilities

#### Frontend Components

**UserListPage** (`/admin/gebruikers/page.tsx`)
- Display paginated list of users
- Search functionality (name, email)
- Manual refresh button
- Navigate to detail page on row click

**UserDetailPage** (`/admin/gebruikers/[id]/page.tsx`)
- Display user information
- Coordinate sub-components
- Handle route parameters
- Orchestrate API calls

**UserCard** (`src/components/admin/UserCard.tsx`)
- Display user basic info (name, email, role, status)
- Clickable navigation to detail page
- Status badges (active/inactive, role)
- Used in list page

**RoleSelector** (`src/components/admin/RoleSelector.tsx`)
- Dropdown to change user role
- Prevent self-demotion
- Optimistic UI update
- API integration

**PointsManager** (`src/components/admin/PointsManager.tsx`)
- Display current points breakdown
- Form to add/subtract points
- Reason/description input (required)
- Points history display (last 10 entries)

**DangerZone** (`src/components/admin/DangerZone.tsx`)
- Soft delete button (deactivate)
- Hard delete button (permanent)
- Confirmation dialogs
- Warning text

**RegistrationViewer** (`src/components/admin/RegistrationViewer.tsx`)
- Read-only display of user's registration data
- Show all profile sections
- Display quiz answers
- Show AI assignment

#### API Endpoints

**GET /api/admin/users**
- List all users with search/filter
- Pagination support
- Return user summaries

**GET /api/admin/users/[id]**
- Get detailed user information
- Include points breakdown
- Include registration relationship

**PATCH /api/admin/users/[id]/role**
- Change user role
- Prevent self-demotion
- Update JWT claims reference

**POST /api/admin/users/[id]/points**
- Add or subtract points
- Create points_ledger entry
- Update user total_points

**PATCH /api/admin/users/[id]/deactivate**
- Set is_active = false
- Record deletion metadata
- Prevent login

**PATCH /api/admin/users/[id]/reactivate**
- Set is_active = true
- Clear deletion metadata
- Allow login

**DELETE /api/admin/users/[id]**
- Permanently delete user
- Cascade to related tables
- Cannot be undone

**GET /api/admin/users/[id]/registration**
- Get full registration data
- Include quiz answers
- Include AI assignment
- For impersonation feature

### 2.3 Component Dependency Graph

```
┌──────────────────────┐
│   UserListPage       │
│  (page.tsx)          │
└──────────┬───────────┘
           │
           │ uses
           ▼
    ┌──────────────┐
    │  UserCard    │
    │  Component   │
    └──────────────┘


┌──────────────────────────────────────────────────────┐
│         UserDetailPage                               │
│         (page.tsx)                                   │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       │ uses     │ uses     │ uses     │ uses
       ▼          ▼          ▼          ▼
┌──────────┐ ┌───────────┐ ┌────────┐ ┌──────────────────┐
│  Role    │ │  Points   │ │ Danger │ │  Registration    │
│Selector  │ │ Manager   │ │  Zone  │ │    Viewer        │
└──────────┘ └───────────┘ └────────┘ └──────────────────┘
```

---

## 3. Database Design

### 3.1 Required Database Migration

**File**: `supabase/migrations/20260128_user_management.sql`

```sql
-- ============================================================================
-- Migration: Add User Management Columns
-- Purpose: Enable soft delete and user management tracking
-- User Story: US-017
-- Created: 2026-01-28
-- ============================================================================

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

-- ============================================================================
-- Function: Atomic Point Updates
-- Purpose: Add/subtract points and update user total in a transaction
-- ============================================================================

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
  -- Validate source
  IF p_source NOT IN ('registration', 'prediction', 'quiz', 'game', 'bonus') THEN
    RAISE EXCEPTION 'Invalid source: %', p_source;
  END IF;

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

  -- Return results
  RETURN QUERY SELECT v_new_total, v_ledger_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_user_points IS
  'Atomically add/subtract points from user and create ledger entry';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check that columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_active', 'deleted_at', 'deleted_by', 'deletion_reason')
ORDER BY column_name;

-- Check that index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname = 'idx_users_is_active';

-- Check that function was created
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_name = 'add_user_points';
```

### 3.2 Updated Users Table Schema

After migration, the `users` table will have:

```typescript
interface User {
  // Existing columns
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: 'participant' | 'admin' | 'quizmaster';
  auth_code?: string;

  // Points
  total_points: number;
  registration_points: number;
  prediction_points: number;
  quiz_points: number;
  game_points: number;

  // Authentication
  email_verified: boolean;
  registration_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  blocked_features: string[];
  last_login_at?: string;

  // NEW: User Management Columns
  is_active: boolean;           // Default: true
  deleted_at?: string;          // Timestamp of deactivation
  deleted_by?: string;          // Admin user ID who deactivated
  deletion_reason?: string;     // Reason for deactivation

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### 3.3 Points Ledger Usage

The `points_ledger` table will be used for manual point adjustments:

```sql
-- Example: Add 50 bonus points
INSERT INTO points_ledger (user_id, points, source, description)
VALUES (
  'user-uuid-here',
  50,
  'bonus',
  'Admin bonus: Goede bijdrage tijdens quiz - toegekend door admin@example.com'
);

-- Example: Subtract 25 penalty points
INSERT INTO points_ledger (user_id, points, source, description)
VALUES (
  'user-uuid-here',
  -25,
  'bonus',
  'Admin correctie: Te laat gekomen - toegekend door admin@example.com'
);
```

**Note**: Using the `add_user_points()` function is preferred as it handles the user total update atomically.

---

## 4. API Architecture

### 4.1 API Endpoint Specifications

#### 4.1.1 GET /api/admin/users

**Purpose**: List all users with search and filtering

**Query Parameters**:
```typescript
{
  search?: string;          // Search in name, first_name, last_name, email
  role?: string;            // Filter by role
  status?: string;          // Filter by registration_status
  active?: string;          // Filter by is_active (true/false/all)
  page?: number;            // Default: 1
  limit?: number;           // Default: 20, max: 100
}
```

**Response**:
```typescript
{
  users: Array<{
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: 'participant' | 'admin' | 'quizmaster';
    total_points: number;
    is_active: boolean;
    email_verified: boolean;
    registration_status: string;
    last_login_at?: string;
    created_at: string;
  }>,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  }
}
```

**Implementation Notes**:
- Use Supabase `.ilike()` for case-insensitive search
- Search across `name`, `first_name`, `last_name`, `email` columns
- Default ordering: `created_at DESC`
- Minimum search length: 3 characters

#### 4.1.2 GET /api/admin/users/[id]

**Purpose**: Get detailed information for a specific user

**Response**:
```typescript
{
  user: {
    // All user table columns
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: string;
    total_points: number;
    registration_points: number;
    prediction_points: number;
    quiz_points: number;
    game_points: number;
    email_verified: boolean;
    registration_status: string;
    is_active: boolean;
    deleted_at?: string;
    deleted_by?: string;
    deletion_reason?: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
  },
  registration?: {
    // Basic registration info (NOT full detail - use /registration endpoint)
    id: string;
    has_partner: boolean;
    partner_name?: string;
    primary_skill?: string;
    created_at: string;
  },
  pointsHistory: Array<{
    id: string;
    points: number;
    source: string;
    description?: string;
    created_at: string;
  }>,
  deletedByAdmin?: {
    name: string;
    email: string;
  }
}
```

**Implementation Notes**:
- Join with `registrations` table for basic info
- Join with `points_ledger` for last 10 entries
- If `deleted_by` exists, join with `users` to get admin info
- Return 404 if user not found

#### 4.1.3 PATCH /api/admin/users/[id]/role

**Purpose**: Change a user's role

**Request Body**:
```typescript
{
  role: 'participant' | 'admin' | 'quizmaster';
}
```

**Response**:
```typescript
{
  success: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}
```

**Validation Rules**:
- Role must be one of: `participant`, `admin`, `quizmaster`
- Cannot change own role if admin (self-demotion protection)
- User must exist and be found

**Error Codes**:
- `UNAUTHORIZED` (403): Not authenticated or not admin
- `INVALID_ROLE` (400): Invalid role value
- `CANNOT_DEMOTE_SELF` (400): Attempt to change own admin role
- `NOT_FOUND` (404): User does not exist

#### 4.1.4 POST /api/admin/users/[id]/points

**Purpose**: Add or subtract points from a user

**Request Body**:
```typescript
{
  points: number;           // Can be positive or negative
  reason: string;           // Required description
  source?: string;          // Optional, defaults to 'bonus'
}
```

**Response**:
```typescript
{
  success: true;
  user: {
    id: string;
    total_points: number;   // Updated total
  };
  ledgerEntry: {
    id: string;
    points: number;
    description: string;
    created_at: string;
  }
}
```

**Validation Rules**:
- `points` must be an integer (can be negative)
- `reason` is required and must be non-empty
- `reason` will be prefixed with admin's email for tracking
- Use database function `add_user_points()` for atomicity

**Implementation**:
```typescript
// Call database function
const description = `${reason} - toegekend door ${adminEmail}`;
await supabase.rpc('add_user_points', {
  p_user_id: userId,
  p_points: points,
  p_source: source || 'bonus',
  p_description: description
});
```

#### 4.1.5 PATCH /api/admin/users/[id]/deactivate

**Purpose**: Soft delete a user (deactivate account)

**Request Body**:
```typescript
{
  reason?: string;          // Optional reason for deactivation
}
```

**Response**:
```typescript
{
  success: true;
  user: {
    id: string;
    is_active: false;
    deleted_at: string;
  }
}
```

**Implementation**:
```sql
UPDATE users
SET is_active = false,
    deleted_at = NOW(),
    deleted_by = $adminUserId,
    deletion_reason = $reason,
    updated_at = NOW()
WHERE id = $userId;
```

**Effects**:
- User cannot login (JWT validation will fail)
- Data remains in database
- Can be reactivated
- Maintains referential integrity

**Error Codes**:
- `CANNOT_MODIFY_SELF` (400): Attempt to deactivate own account

#### 4.1.6 PATCH /api/admin/users/[id]/reactivate

**Purpose**: Reactivate a soft-deleted user

**Response**:
```typescript
{
  success: true;
  user: {
    id: string;
    is_active: true;
  }
}
```

**Implementation**:
```sql
UPDATE users
SET is_active = true,
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    updated_at = NOW()
WHERE id = $userId;
```

#### 4.1.7 DELETE /api/admin/users/[id]

**Purpose**: Permanently delete a user (hard delete)

**Query Parameters**:
```typescript
{
  confirm?: string;         // Must be "DELETE" to proceed
}
```

**Response**:
```typescript
{
  success: true;
  message: 'Gebruiker permanent verwijderd'
}
```

**Cascading Deletes**:
Due to `ON DELETE CASCADE` foreign keys, this will also delete:
- `registrations` entry
- `points_ledger` entries
- `auth_pins` entry
- `ratings` entries
- `quiz_players` entries
- `quiz_answers` entries
- `payments` entries (if any)

**Validation Rules**:
- User must exist
- Cannot delete own account (self-protection)
- Confirmation required (UI handles this)

**Error Codes**:
- `CANNOT_MODIFY_SELF` (400): Attempt to delete own account
- `CONFIRMATION_REQUIRED` (400): Missing confirmation parameter

#### 4.1.8 GET /api/admin/users/[id]/registration

**Purpose**: Get full registration data for impersonation view

**Response**:
```typescript
{
  registration: {
    id: string;
    user_id: string;

    // Personal info
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    birth_year: number;
    has_partner: boolean;
    partner_name?: string;
    partner_first_name?: string;
    partner_last_name?: string;
    dietary_requirements?: string;

    // Skills
    primary_skill: string;
    additional_skills?: string;
    music_decade: string;
    music_genre: string;

    // JSONB fields (parsed)
    quiz_answers: {
      [key: string]: string;
    };
    ai_assignment?: {
      officialTitle: string;
      task: string;
      reasoning: string;
      warningLevel: string;
      specialPrivilege: string;
    };
    predictions: {
      [key: string]: any;
    };

    // Meta
    is_complete: boolean;
    current_step: number;
    created_at: string;
    updated_at: string;
  }
}
```

**Implementation Notes**:
- Return full registration object including JSONB fields
- Parse JSONB fields to proper objects
- Return 404 if no registration found
- Read-only endpoint (no mutations)

### 4.2 API Error Handling

All API endpoints will use consistent error responses:

```typescript
interface ErrorResponse {
  error: string;            // Error code (SCREAMING_SNAKE_CASE)
  message: string;          // User-friendly Dutch message
  details?: unknown;        // Optional additional context
}
```

**Standard Error Codes**:

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 403 | Not authenticated or not admin |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CANNOT_MODIFY_SELF` | 400 | Attempted prohibited self-modification |
| `INVALID_ROLE` | 400 | Invalid role value |
| `CANNOT_DEMOTE_SELF` | 400 | Attempted self-demotion from admin |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `SERVER_ERROR` | 500 | Unexpected server error |

### 4.3 Authentication Flow

All API endpoints follow this authentication pattern:

```typescript
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Extract and verify JWT
  const user = await getUserFromRequest(request);

  // 2. Check authentication
  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Niet ingelogd' },
      { status: 403 }
    );
  }

  // 3. Check admin role
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
      { status: 403 }
    );
  }

  // 4. Proceed with business logic
  // ...
}
```

---

## 5. Page Layouts

### 5.1 User List Page (`/admin/gebruikers`)

**Route**: `/admin/gebruikers`
**File**: `src/app/admin/gebruikers/page.tsx`

**Layout Wireframe**:
```
┌─────────────────────────────────────────────────────────┐
│ ← Terug naar admin dashboard                            │
│                                                          │
│ Gebruikersbeheer                                         │
│ Beheer gebruikersaccounts en rechten                     │
│                                                          │
│ ┌────────────────────────────────────┐  [Refresh 🔄]    │
│ │ 🔍 Zoek op naam of email...        │                  │
│ └────────────────────────────────────┘                  │
│                                                          │
│ 45 gebruikers gevonden                                   │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Jan Jansen                          [Admin Badge]   │ │
│ │ jan@email.nl                        280 punten      │ │
│ │ Laatst ingelogd: 2 dagen geleden    ✓ Actief       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Piet Pieterse                       [Member Badge]  │ │
│ │ piet@email.nl                       120 punten      │ │
│ │ Laatst ingelogd: 1 week geleden     ✓ Actief       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Marie Curie                         [Inactive]      │ │
│ │ marie@email.nl                      50 punten       │ │
│ │ Gedeactiveerd op: 15 jan 2026       ✗ Inactief     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [← Vorige]  Pagina 1 van 3  [Volgende →]                │
└─────────────────────────────────────────────────────────┘
```

**Component Structure**:
```tsx
<AuthGuard requireAdmin requireApproved>
  <div className="min-h-screen bg-deep-green p-4 md:p-8">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin">← Terug naar admin dashboard</Link>
        <h1>Gebruikersbeheer</h1>
        <p>Beheer gebruikersaccounts en rechten</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Zoek op naam of email..."
          value={searchQuery}
          onChange={handleSearch}
        />
        <Button onClick={handleRefresh}>
          Refresh 🔄
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 text-cream/70">
        {totalUsers} gebruikers gevonden
      </div>

      {/* User List */}
      <div className="space-y-3">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onClick={() => router.push(`/admin/gebruikers/${user.id}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-4">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ← Vorige
          </Button>
          <span>Pagina {page} van {totalPages}</span>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Volgende →
          </Button>
        </div>
      )}
    </div>
  </div>
</AuthGuard>
```

**Features**:
- Debounced search (300ms delay)
- Minimum search length: 3 characters
- Manual refresh button
- Pagination controls
- Clickable user cards
- Status badges (Active/Inactive, Role)
- Loading spinner during fetch
- Error message display

### 5.2 User Detail Page (`/admin/gebruikers/[id]`)

**Route**: `/admin/gebruikers/[id]`
**File**: `src/app/admin/gebruikers/[id]/page.tsx`

**Layout Wireframe**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Terug naar gebruikerslijst                             │
│                                                           │
│ Jan Jansen                                    [Admin]    │
│ jan@email.nl                                  ✓ Actief   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ ACCOUNT INFORMATIE                                        │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Email: jan@email.nl                 ✓ Geverifieerd │   │
│ │ Rol: [Admin ▼]                                     │   │
│ │ Status: Goedgekeurd                                │   │
│ │ Aangemaakt: 15 dec 2025                            │   │
│ │ Laatst ingelogd: 2 dagen geleden                   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                           │
│ PUNTEN                                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Totaal: 280 punten                                 │   │
│ │                                                     │   │
│ │ Breakdown:                                          │   │
│ │ • Registratie: 50                                   │   │
│ │ • Voorspellingen: 80                                │   │
│ │ • Quiz: 120                                         │   │
│ │ • Spelletjes: 30                                    │   │
│ │                                                     │   │
│ │ ┌───────────────────────────────────────────────┐  │   │
│ │ │ Punten aanpassen                              │  │   │
│ │ │ [+50] [-50] punten                            │  │   │
│ │ │ Reden: [_________________________]            │  │   │
│ │ │ [Opslaan]                                     │  │   │
│ │ └───────────────────────────────────────────────┘  │   │
│ │                                                     │   │
│ │ Recente transacties:                                │   │
│ │ • +50 punten - Admin bonus (2 dagen geleden)        │   │
│ │ • -25 punten - Correctie (1 week geleden)           │   │
│ └────────────────────────────────────────────────────┘   │
│                                                           │
│ REGISTRATIE GEGEVENS                                      │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [Toon registratie gegevens →]                      │   │
│ └────────────────────────────────────────────────────┘   │
│                                                           │
│ DANGER ZONE                                               │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [Deactiveren]  [Permanent Verwijderen]             │   │
│ │                                                     │   │
│ │ ⚠️ Let op: Permanent verwijderen kan NIET          │   │
│ │ ongedaan gemaakt worden. Alle data wordt verwijderd│   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Component Structure**:
```tsx
<AuthGuard requireAdmin requireApproved>
  <div className="min-h-screen bg-deep-green p-4 md:p-8">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/gebruikers">← Terug</Link>
        <div className="flex justify-between items-start">
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
          <div>
            <RoleBadge role={user.role} />
            <StatusBadge isActive={user.is_active} />
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Informatie</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountInfo user={user} />
          <RoleSelector
            currentRole={user.role}
            userId={user.id}
            isCurrentUser={isCurrentUser}
            onRoleChange={handleRoleChange}
          />
        </CardContent>
      </Card>

      {/* Points Card */}
      <Card>
        <CardHeader>
          <CardTitle>Punten</CardTitle>
        </CardHeader>
        <CardContent>
          <PointsManager
            user={user}
            pointsHistory={pointsHistory}
            onPointsUpdate={handlePointsUpdate}
          />
        </CardContent>
      </Card>

      {/* Registration Data Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registratie Gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowRegistration(!showRegistration)}>
            {showRegistration ? 'Verberg' : 'Toon'} registratie gegevens
          </Button>
          {showRegistration && (
            <RegistrationViewer userId={user.id} />
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-warm-red/30">
        <CardHeader>
          <CardTitle className="text-warm-red">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerZone
            user={user}
            isCurrentUser={isCurrentUser}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  </div>
</AuthGuard>
```

**Features**:
- All user information displayed
- Role change dropdown (prevents self-demotion)
- Points adjustment form with history
- Expandable registration data viewer
- Deactivate button (soft delete)
- Reactivate button (if inactive)
- Hard delete button with confirmation
- Loading states for each action
- Error messages for failed operations

---

## 6. Impersonation Feature

### 6.1 Purpose

Allow admins to view what a user has filled in during registration, including:
- Personal information
- Skills and preferences
- Music preferences
- Quiz answers
- AI assignment

**Important**: This is READ-ONLY viewing, not actual impersonation (admin doesn't become the user).

### 6.2 Implementation

**Component**: `RegistrationViewer` (`src/components/admin/RegistrationViewer.tsx`)

```tsx
interface RegistrationViewerProps {
  userId: string;
}

export function RegistrationViewer({ userId }: RegistrationViewerProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegistration();
  }, [userId]);

  const fetchRegistration = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/registration`);
      const data = await res.json();

      if (res.ok) {
        setRegistration(data.registration);
      } else {
        setError(data.message || 'Kon registratie niet laden');
      }
    } catch (err) {
      setError('Netwerkfout');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!registration) return <EmptyState />;

  return (
    <div className="space-y-6 mt-4">
      {/* Personal Info Section */}
      <Section title="Persoonlijke Gegevens">
        <Field label="Naam" value={registration.name} />
        <Field label="Geboortejaar" value={registration.birth_year} />
        {registration.has_partner && (
          <Field label="Partner" value={registration.partner_name} />
        )}
        <Field label="Dieetwensen" value={registration.dietary_requirements} />
      </Section>

      {/* Skills Section */}
      <Section title="Vaardigheden">
        <Field label="Primaire vaardigheid" value={registration.primary_skill} />
        <Field label="Extra vaardigheden" value={registration.additional_skills} />
      </Section>

      {/* Music Section */}
      <Section title="Muziekvoorkeur">
        <Field label="Decennium" value={registration.music_decade} />
        <Field label="Genre" value={registration.music_genre} />
      </Section>

      {/* Quiz Answers Section */}
      <Section title="Quiz Antwoorden">
        {Object.entries(registration.quiz_answers).map(([key, value]) => (
          <Field
            key={key}
            label={formatQuestionLabel(key)}
            value={value}
          />
        ))}
      </Section>

      {/* AI Assignment Section */}
      {registration.ai_assignment && (
        <Section title="AI Opdracht">
          <Field
            label="Officiële Titel"
            value={registration.ai_assignment.officialTitle}
          />
          <Field
            label="Taak"
            value={registration.ai_assignment.task}
          />
          <Field
            label="Waarschuwingsniveau"
            value={registration.ai_assignment.warningLevel}
          />
          <Field
            label="Speciaal Privilege"
            value={registration.ai_assignment.specialPrivilege}
          />
        </Section>
      )}

      {/* Predictions Section */}
      {Object.keys(registration.predictions).length > 0 && (
        <Section title="Voorspellingen">
          {Object.entries(registration.predictions).map(([key, value]) => (
            <Field
              key={key}
              label={formatPredictionLabel(key)}
              value={formatPredictionValue(key, value)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-gold/30 pl-4">
      <h3 className="text-gold font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-cream/60 text-sm">{label}</p>
      <p className="text-cream">{value}</p>
    </div>
  );
}
```

### 6.3 API Endpoint

**GET /api/admin/users/[id]/registration**

See section 4.1.8 for full specification.

**Security Considerations**:
- Admin authentication required
- Read-only endpoint (no mutations)
- Returns comprehensive registration data
- Does NOT expose PIN or password hashes
- Does NOT expose other sensitive auth data

---

## 7. State Management

### 7.1 State Strategy

**Decision**: Use **local component state** (not Zustand)

**Rationale**:
- User management is admin-only feature
- Data is fetched per-page-load
- No need to share state across unrelated components
- Simpler implementation
- Easier to maintain

### 7.2 State Structure

**User List Page**:
```typescript
const [users, setUsers] = useState<UserSummary[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalUsers, setTotalUsers] = useState(0);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
```

**User Detail Page**:
```typescript
const [user, setUser] = useState<User | null>(null);
const [pointsHistory, setPointsHistory] = useState<PointsEntry[]>([]);
const [registration, setRegistration] = useState<Registration | null>(null);
const [showRegistration, setShowRegistration] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');

// Action states
const [isChangingRole, setIsChangingRole] = useState(false);
const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
const [isDeactivating, setIsDeactivating] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

### 7.3 Search Debouncing

Implement debounced search to avoid excessive API calls:

```typescript
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in component
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch.length >= 3 || debouncedSearch.length === 0) {
    fetchUsers(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 8. Data Flow

### 8.1 User List Page Data Flow

```
User Input (Search)
    │
    ▼
Local State Update (searchQuery)
    │
    ▼
Debounce (300ms)
    │
    ▼
API Call: GET /api/admin/users?search=...
    │
    ├─► Backend: Search database
    │   └─► Filter by search term
    │       └─► Apply pagination
    │           └─► Return results
    │
    ▼
Update Local State (users, pagination)
    │
    ▼
Re-render UI
```

### 8.2 Role Change Data Flow

```
User clicks Role Dropdown
    │
    ▼
Select New Role
    │
    ▼
Optimistic UI Update (role changes immediately)
    │
    ▼
API Call: PATCH /api/admin/users/[id]/role
    │
    ├─► Backend: Validate admin
    │   └─► Prevent self-demotion
    │       └─► Update database
    │           └─► Return updated user
    │
    ├─► Success
    │   └─► Keep optimistic update
    │       └─► Show success toast
    │
    └─► Error
        └─► Revert optimistic update
            └─► Show error message
```

### 8.3 Points Adjustment Data Flow

```
User enters Points & Reason
    │
    ▼
Click "Opslaan"
    │
    ▼
Validate Form (reason required)
    │
    ▼
API Call: POST /api/admin/users/[id]/points
    │
    ├─► Backend: Call add_user_points()
    │   └─► Insert into points_ledger
    │       └─► Update user.total_points
    │           └─► Return updated data
    │
    ▼
Update Local State
    │
    ├─► Update user.total_points
    ├─► Prepend new entry to pointsHistory
    └─► Clear form inputs
    │
    ▼
Re-render UI
    └─► Show updated points
        └─► Show new history entry
```

### 8.4 Soft Delete Data Flow

```
User clicks "Deactiveren"
    │
    ▼
Confirmation Dialog
    │
    ▼ Confirmed
API Call: PATCH /api/admin/users/[id]/deactivate
    │
    ├─► Backend: Set is_active = false
    │   └─► Record deleted_at, deleted_by
    │       └─► Return updated user
    │
    ▼
Update Local State
    │
    └─► user.is_active = false
        └─► user.deleted_at = timestamp
    │
    ▼
Re-render UI
    └─► Show "Inactive" badge
        └─► Enable "Reactivate" button
        └─► Disable "Deactivate" button
```

### 8.5 Hard Delete Data Flow

```
User clicks "Permanent Verwijderen"
    │
    ▼
First Confirmation Dialog
    │
    ▼ Confirmed
Second Confirmation (Type "DELETE")
    │
    ▼ Typed "DELETE"
API Call: DELETE /api/admin/users/[id]?confirm=DELETE
    │
    ├─► Backend: Validate admin
    │   └─► Prevent self-deletion
    │       └─► Delete user record
    │           └─► CASCADE to related tables
    │               └─► Return success
    │
    ▼
Redirect to User List
    │
    └─► Show success toast
        └─► User removed from list
```

---

## 9. Security Architecture

### 9.1 Authentication Layer

```
┌────────────────────────────────────────────┐
│         Client (Browser)                   │
│  - Stores JWT in cookie                    │
│  - Sends cookie with every request         │
└──────────────────┬─────────────────────────┘
                   │ Cookie: bovenkamer_auth_token
                   ▼
┌────────────────────────────────────────────┐
│         API Middleware                     │
│  1. Extract JWT from cookie/header         │
│  2. Verify signature with JWT_SECRET       │
│  3. Decode payload                         │
│  4. Check expiration (30 days)             │
└──────────────────┬─────────────────────────┘
                   │ JWTPayload
                   ▼
┌────────────────────────────────────────────┐
│         Authorization Check                │
│  1. Check user.role === 'admin'            │
│  2. Check user.emailVerified === true      │
│  3. Check user.registrationStatus === 'approved' │
└──────────────────┬─────────────────────────┘
                   │ Authorized Admin User
                   ▼
┌────────────────────────────────────────────┐
│         Business Logic                     │
│  - Process request                         │
│  - Access database                         │
│  - Return response                         │
└────────────────────────────────────────────┘
```

### 9.2 Self-Protection Rules

**Critical**: Admins cannot perform destructive actions on their own account.

```typescript
// In every API endpoint that modifies users
const adminUserId = user.userId; // From JWT
const targetUserId = params.id;  // From route

// Prevent self-modification
if (targetUserId === adminUserId) {
  return NextResponse.json(
    {
      error: 'CANNOT_MODIFY_SELF',
      message: 'Je kunt je eigen account niet aanpassen op deze manier'
    },
    { status: 400 }
  );
}
```

**Protected Actions**:
- Change own role (especially demoting from admin)
- Deactivate own account
- Delete own account

**Allowed Actions**:
- View own details
- Adjust own points (for testing)

### 9.3 Role-Based Access Control

**Access Matrix**:

| Action | Participant | Admin | Quizmaster |
|--------|------------|-------|------------|
| View user list | ❌ | ✅ | ❌ |
| View user detail | ❌ | ✅ | ❌ |
| Change user role | ❌ | ✅ | ❌ |
| Adjust points | ❌ | ✅ | ❌ |
| Deactivate user | ❌ | ✅ | ❌ |
| Delete user | ❌ | ✅ | ❌ |
| View registration data | ❌ | ✅ | ❌ |

**Implementation**:
```typescript
// Client-side (UI protection)
<AuthGuard requireAdmin requireApproved>
  <UserManagementPage />
</AuthGuard>

// Server-side (API protection)
const user = await getUserFromRequest(request);
if (!user || !isAdmin(user)) {
  return NextResponse.json(
    { error: 'UNAUTHORIZED' },
    { status: 403 }
  );
}
```

### 9.4 Input Validation

**Validation Rules**:

| Field | Validation |
|-------|-----------|
| `user_id` | Must be valid UUID format |
| `role` | Must be one of: `participant`, `admin`, `quizmaster` |
| `points` | Must be integer (can be negative) |
| `reason` | Required for point adjustments, min length 5 characters |
| `search` | Sanitize for SQL injection (use parameterized queries) |
| `page` | Must be positive integer |
| `limit` | Must be positive integer, max 100 |

**Implementation Pattern**:
```typescript
// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', message: 'Ongeldige gebruiker ID' },
    { status: 400 }
  );
}

// Role validation
const validRoles = ['participant', 'admin', 'quizmaster'];
if (!validRoles.includes(role)) {
  return NextResponse.json(
    { error: 'INVALID_ROLE', message: 'Ongeldige rol' },
    { status: 400 }
  );
}

// Points validation
const points = parseInt(body.points);
if (isNaN(points)) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', message: 'Punten moet een getal zijn' },
    { status: 400 }
  );
}

// Reason validation
const reason = body.reason?.trim();
if (!reason || reason.length < 5) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', message: 'Reden is verplicht (minimaal 5 karakters)' },
    { status: 400 }
  );
}
```

### 9.5 SQL Injection Prevention

**Always use parameterized queries** via Supabase client:

```typescript
// ✅ SAFE: Parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .ilike('name', `%${searchQuery}%`);

// ❌ UNSAFE: String interpolation (NEVER do this)
const query = `SELECT * FROM users WHERE name LIKE '%${searchQuery}%'`;
```

**For search functionality**, use Supabase's built-in operators:
```typescript
// Search across multiple columns
.or(
  `name.ilike.%${searchQuery}%,` +
  `first_name.ilike.%${searchQuery}%,` +
  `last_name.ilike.%${searchQuery}%,` +
  `email.ilike.%${searchQuery}%`
)
```

### 9.6 Data Exposure Prevention

**Never expose in API responses**:
- PIN hashes (`auth_pins.pin_hash`)
- PIN salts (`auth_pins.pin_salt`)
- Password hashes (if any)
- JWT secrets
- API keys

**Sanitize response data**:
```typescript
// Remove sensitive fields before returning
const sanitizedUser = {
  ...user,
  auth_code: undefined, // Don't expose auth codes
};

return NextResponse.json({ user: sanitizedUser });
```

---

## 10. Error Handling

### 10.1 Client-Side Error Display

**Error Message Component**:
```tsx
interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 bg-warm-red/20 border border-warm-red rounded-lg"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-warm-red font-semibold mb-1">Fout</p>
          <p className="text-warm-red/80 text-sm">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-warm-red/60 hover:text-warm-red"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}
```

**Success Message Component**:
```tsx
export function SuccessMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 bg-success-green/20 border border-success-green rounded-lg"
    >
      <p className="text-success-green font-semibold">✓ {message}</p>
    </motion.div>
  );
}
```

### 10.2 Error Handling Patterns

**Pattern 1: API Call with Try-Catch**
```typescript
const handleRoleChange = async (newRole: string) => {
  setError('');
  setIsChangingRole(true);

  try {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Kon rol niet wijzigen');
    }

    // Success
    setUser(prev => ({ ...prev, role: newRole }));
    setSuccess('Rol succesvol gewijzigd');

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Er ging iets mis');
    // Revert optimistic update if any
  } finally {
    setIsChangingRole(false);
  }
};
```

**Pattern 2: Optimistic UI with Rollback**
```typescript
const handleRoleChange = async (newRole: string) => {
  const previousRole = user.role;

  // Optimistic update
  setUser(prev => ({ ...prev, role: newRole }));

  try {
    const response = await fetch(/* ... */);

    if (!response.ok) {
      throw new Error('Failed');
    }

    // Success - keep optimistic update
    setSuccess('Rol succesvol gewijzigd');

  } catch (err) {
    // Rollback on error
    setUser(prev => ({ ...prev, role: previousRole }));
    setError('Kon rol niet wijzigen');
  }
};
```

### 10.3 User-Friendly Error Messages

**Error Code to Dutch Message Mapping**:

| Error Code | Dutch Message |
|-----------|---------------|
| `UNAUTHORIZED` | Je hebt geen toegang tot deze functie |
| `NOT_FOUND` | Gebruiker niet gevonden |
| `VALIDATION_ERROR` | Ongeldige invoer. Controleer je gegevens. |
| `CANNOT_MODIFY_SELF` | Je kunt je eigen account niet op deze manier aanpassen |
| `INVALID_ROLE` | Ongeldige rol geselecteerd |
| `CANNOT_DEMOTE_SELF` | Je kunt je eigen admin rol niet verwijderen |
| `DATABASE_ERROR` | Er ging iets mis met de database. Probeer het opnieuw. |
| `SERVER_ERROR` | Er ging iets mis op de server. Probeer het later opnieuw. |
| `CONFIRMATION_REQUIRED` | Bevestiging is vereist voor deze actie |
| `NETWORK_ERROR` | Netwerkfout. Controleer je internetverbinding. |

**Implementation**:
```typescript
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Je hebt geen toegang tot deze functie',
  NOT_FOUND: 'Gebruiker niet gevonden',
  VALIDATION_ERROR: 'Ongeldige invoer. Controleer je gegevens.',
  CANNOT_MODIFY_SELF: 'Je kunt je eigen account niet op deze manier aanpassen',
  // ... etc
};

function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'Er ging iets mis';
}

// Usage
catch (err) {
  const errorCode = data.error || 'SERVER_ERROR';
  setError(getErrorMessage(errorCode));
}
```

### 10.4 Loading States

**Loading Spinner Component**:
```tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`
        ${sizeClasses[size]}
        border-4 border-gold/20 border-t-gold
        rounded-full animate-spin
      `} />
    </div>
  );
}
```

**Skeleton Loading**:
```tsx
export function UserCardSkeleton() {
  return (
    <div className="p-4 bg-dark-wood rounded-lg animate-pulse">
      <div className="h-6 bg-cream/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-cream/10 rounded w-1/2" />
    </div>
  );
}
```

### 10.5 Confirmation Dialogs

**Deactivate Confirmation**:
```typescript
const handleDeactivate = () => {
  const confirmed = window.confirm(
    `Weet je zeker dat je ${user.name} wilt deactiveren?\n\n` +
    `De gebruiker kan niet meer inloggen, maar alle data blijft bewaard.`
  );

  if (confirmed) {
    performDeactivate();
  }
};
```

**Hard Delete Confirmation** (Two-step):
```typescript
const handleDelete = async () => {
  // Step 1: Warning dialog
  const firstConfirm = window.confirm(
    `WAARSCHUWING: Dit verwijdert ${user.name} permanent uit het systeem.\n\n` +
    `Alle data wordt verwijderd:\n` +
    `- Gebruikersaccount\n` +
    `- Registratie gegevens\n` +
    `- Punten geschiedenis\n` +
    `- Quiz deelnames\n` +
    `- Beoordelingen\n\n` +
    `Deze actie kan NIET ongedaan gemaakt worden.\n\n` +
    `Klik OK om door te gaan naar de definitieve bevestiging.`
  );

  if (!firstConfirm) return;

  // Step 2: Type "DELETE" to confirm
  const userInput = prompt(
    'Typ "DELETE" (hoofdletters) om definitief te bevestigen:'
  );

  if (userInput === 'DELETE') {
    await performDelete();
  } else {
    alert('Verwijdering geannuleerd. Type "DELETE" exact om te bevestigen.');
  }
};
```

---

## 11. Implementation Checklist

### Phase 1: Database & Types (2 hours)

- [ ] Create database migration file
  - [ ] Add `is_active` column
  - [ ] Add `deleted_at` column
  - [ ] Add `deleted_by` column
  - [ ] Add `deletion_reason` column
  - [ ] Create index on `is_active`
  - [ ] Create `add_user_points()` function
- [ ] Run migration on Supabase
- [ ] Verify migration success
- [ ] Update TypeScript types in `src/types/index.ts`
  - [ ] Add new fields to `User` interface
  - [ ] Create `UserSummary` interface
  - [ ] Create `PointsLedgerEntry` interface
  - [ ] Create `AdminUserDetail` interface

### Phase 2: API Endpoints (8 hours)

- [ ] Create `src/app/api/admin/users/route.ts`
  - [ ] Implement GET handler (list users)
  - [ ] Add search functionality
  - [ ] Add pagination
  - [ ] Add stats calculation
  - [ ] Add authentication check
  - [ ] Add error handling
  - [ ] Test with Postman/curl

- [ ] Create `src/app/api/admin/users/[id]/route.ts`
  - [ ] Implement GET handler (user detail)
  - [ ] Join with registrations
  - [ ] Join with points_ledger
  - [ ] Join with deleted_by admin
  - [ ] Implement DELETE handler (hard delete)
  - [ ] Add self-protection check
  - [ ] Add confirmation check
  - [ ] Add error handling
  - [ ] Test both endpoints

- [ ] Create `src/app/api/admin/users/[id]/role/route.ts`
  - [ ] Implement PATCH handler
  - [ ] Validate role input
  - [ ] Add self-demotion check
  - [ ] Update database
  - [ ] Add error handling
  - [ ] Test endpoint

- [ ] Create `src/app/api/admin/users/[id]/points/route.ts`
  - [ ] Implement POST handler
  - [ ] Validate points input
  - [ ] Validate reason input
  - [ ] Call `add_user_points()` function
  - [ ] Format description with admin email
  - [ ] Add error handling
  - [ ] Test positive and negative points

- [ ] Create `src/app/api/admin/users/[id]/deactivate/route.ts`
  - [ ] Implement PATCH handler
  - [ ] Add self-protection check
  - [ ] Update user record
  - [ ] Add error handling
  - [ ] Test endpoint

- [ ] Create `src/app/api/admin/users/[id]/reactivate/route.ts`
  - [ ] Implement PATCH handler
  - [ ] Clear deletion fields
  - [ ] Add error handling
  - [ ] Test endpoint

- [ ] Create `src/app/api/admin/users/[id]/registration/route.ts`
  - [ ] Implement GET handler
  - [ ] Fetch full registration data
  - [ ] Parse JSONB fields
  - [ ] Add error handling
  - [ ] Test endpoint

### Phase 3: Reusable Components (6 hours)

- [ ] Create `src/components/admin/UserCard.tsx`
  - [ ] Display user summary
  - [ ] Add role badge
  - [ ] Add status badge (active/inactive)
  - [ ] Add click handler
  - [ ] Style with Tailwind
  - [ ] Add hover effects
  - [ ] Test rendering

- [ ] Create `src/components/admin/RoleSelector.tsx`
  - [ ] Create Select dropdown
  - [ ] List all roles
  - [ ] Disable if current user
  - [ ] Add onChange handler
  - [ ] Add loading state
  - [ ] Style with theme colors
  - [ ] Test role changes

- [ ] Create `src/components/admin/PointsManager.tsx`
  - [ ] Display current points breakdown
  - [ ] Create points adjustment form
  - [ ] Add/subtract buttons
  - [ ] Reason input (required)
  - [ ] Display points history (last 10)
  - [ ] Add submit handler
  - [ ] Add validation
  - [ ] Add loading state
  - [ ] Style with theme colors
  - [ ] Test point adjustments

- [ ] Create `src/components/admin/DangerZone.tsx`
  - [ ] Create danger zone section
  - [ ] Add deactivate button
  - [ ] Add reactivate button (conditional)
  - [ ] Add hard delete button
  - [ ] Disable if current user
  - [ ] Add confirmation dialogs
  - [ ] Add loading states
  - [ ] Style with warm-red theme
  - [ ] Test all actions

- [ ] Create `src/components/admin/RegistrationViewer.tsx`
  - [ ] Fetch registration data
  - [ ] Display personal info
  - [ ] Display skills
  - [ ] Display music preferences
  - [ ] Display quiz answers
  - [ ] Display AI assignment
  - [ ] Display predictions
  - [ ] Add loading state
  - [ ] Add error state
  - [ ] Style with theme colors
  - [ ] Test data display

- [ ] Create utility components
  - [ ] `ErrorMessage.tsx`
  - [ ] `SuccessMessage.tsx`
  - [ ] `LoadingSpinner.tsx`
  - [ ] `UserCardSkeleton.tsx`

### Phase 4: User List Page (4 hours)

- [ ] Create `src/app/admin/gebruikers/page.tsx`
  - [ ] Set up AuthGuard
  - [ ] Create page structure
  - [ ] Add header with back link
  - [ ] Add search input
  - [ ] Add refresh button
  - [ ] Implement search with debouncing
  - [ ] Fetch users from API
  - [ ] Render UserCard components
  - [ ] Add pagination controls
  - [ ] Add loading state
  - [ ] Add error state
  - [ ] Add empty state
  - [ ] Style with theme colors
  - [ ] Test search functionality
  - [ ] Test pagination
  - [ ] Test navigation to detail page

### Phase 5: User Detail Page (5 hours)

- [ ] Create `src/app/admin/gebruikers/[id]/page.tsx`
  - [ ] Set up AuthGuard
  - [ ] Extract user ID from params
  - [ ] Create page structure
  - [ ] Add header with back link
  - [ ] Display user name and email
  - [ ] Add role and status badges
  - [ ] Create Account Info section
  - [ ] Integrate RoleSelector component
  - [ ] Create Points section
  - [ ] Integrate PointsManager component
  - [ ] Create Registration section
  - [ ] Integrate RegistrationViewer component (expandable)
  - [ ] Create Danger Zone section
  - [ ] Integrate DangerZone component
  - [ ] Fetch user data from API
  - [ ] Add loading state
  - [ ] Add error state
  - [ ] Add success/error message display
  - [ ] Style with theme colors
  - [ ] Test all actions
  - [ ] Test error handling
  - [ ] Test navigation

### Phase 6: Integration & Navigation (2 hours)

- [ ] Add link to admin dashboard (`src/app/admin/page.tsx`)
  - [ ] Create navigation card
  - [ ] Add icon/description
  - [ ] Link to `/admin/gebruikers`
  - [ ] Style consistently

- [ ] Test full user flow
  - [ ] Navigate from admin dashboard
  - [ ] Search for users
  - [ ] View user detail
  - [ ] Change role
  - [ ] Adjust points
  - [ ] View registration data
  - [ ] Deactivate user
  - [ ] Reactivate user
  - [ ] Navigate back to list

### Phase 7: Testing & Refinement (3 hours)

- [ ] API endpoint testing
  - [ ] Test all endpoints with valid data
  - [ ] Test all endpoints with invalid data
  - [ ] Test authentication failures
  - [ ] Test self-protection rules
  - [ ] Test search edge cases
  - [ ] Test pagination edge cases

- [ ] UI/UX testing
  - [ ] Test on desktop (Chrome, Firefox, Safari)
  - [ ] Test on mobile (responsive design)
  - [ ] Test loading states
  - [ ] Test error states
  - [ ] Test empty states
  - [ ] Test success messages
  - [ ] Test keyboard navigation
  - [ ] Test screen reader compatibility

- [ ] Edge case testing
  - [ ] User with no registration data
  - [ ] User with negative points
  - [ ] User with very long name/email
  - [ ] Search with special characters
  - [ ] Search with SQL injection attempts
  - [ ] Concurrent role changes
  - [ ] Network timeouts
  - [ ] Browser back button behavior

- [ ] Performance testing
  - [ ] Test with 100+ users
  - [ ] Test search response time
  - [ ] Test pagination performance
  - [ ] Optimize queries if needed

- [ ] Security testing
  - [ ] Verify JWT validation
  - [ ] Verify admin role check
  - [ ] Verify self-protection
  - [ ] Verify input sanitization
  - [ ] Verify no sensitive data exposure

### Phase 8: Documentation (1 hour)

- [ ] Update CLAUDE.md if needed
- [ ] Document new API endpoints
- [ ] Document new components
- [ ] Add inline code comments
- [ ] Create user guide for admins (optional)

### Phase 9: Deployment (1 hour)

- [ ] Commit code to feature branch
- [ ] Create pull request to `develop`
- [ ] Request code review
- [ ] Address review feedback
- [ ] Merge to `develop`
- [ ] Test on staging environment
- [ ] Create PR from `develop` to `main`
- [ ] Deploy to production
- [ ] Verify production functionality
- [ ] Monitor for errors

---

## Total Estimated Time: 32 hours

**Breakdown**:
- Database & Types: 2 hours
- API Endpoints: 8 hours
- Reusable Components: 6 hours
- User List Page: 4 hours
- User Detail Page: 5 hours
- Integration & Navigation: 2 hours
- Testing & Refinement: 3 hours
- Documentation: 1 hour
- Deployment: 1 hour

**Recommended Sprint**: 4 days (8 hours/day)

---

## Architecture Decisions Record

### ADR-001: Use Local State Instead of Zustand

**Context**: Need to decide how to manage state for user management pages.

**Decision**: Use local component state with `useState` instead of Zustand global store.

**Rationale**:
- User management is admin-only feature
- Data is fetched fresh on each page load
- No need to share state across different routes
- Simpler implementation
- Easier to maintain
- Reduces complexity

**Consequences**:
- Each page manages its own state
- Data is refetched when navigating between pages
- No caching of user list across navigations
- More predictable behavior (no stale data)

### ADR-002: Two-Page Approach (List + Detail)

**Context**: Need to decide between single-page with split view vs. two separate pages.

**Decision**: Implement as two separate pages: list page and detail page.

**Rationale**:
- Better mobile experience (full screen for each view)
- Cleaner URL structure for deep linking
- Easier to bookmark specific users
- Better browser back button behavior
- Simpler component structure
- Follows existing admin patterns

**Consequences**:
- Users must navigate between pages
- Need back button on detail page
- Slightly more API calls (fetch detail separately)
- Better separation of concerns

### ADR-003: Soft Delete with is_active Flag

**Context**: Need to implement user deactivation without losing data.

**Decision**: Add `is_active` boolean column with soft delete metadata.

**Rationale**:
- Preserves all user data
- Can be reversed (reactivation)
- Maintains referential integrity
- Tracks who/when/why deactivation occurred
- Prevents login without data loss
- Follows industry best practices

**Consequences**:
- Queries must filter by `is_active` where appropriate
- Need reactivation endpoint
- Migration required before implementation

### ADR-004: Atomic Point Updates via Database Function

**Context**: Need to ensure points ledger and user total are always in sync.

**Decision**: Create database function `add_user_points()` to handle point updates atomically.

**Rationale**:
- Guarantees consistency (transaction)
- Single source of truth
- Prevents race conditions
- Simplifies API endpoint logic
- Reusable for other features
- Follows database best practices

**Consequences**:
- Database function must be created in migration
- API endpoints call function instead of direct updates
- Errors handled at database level

### ADR-005: Impersonation as Read-Only View

**Context**: Admin needs to see what users have filled in during registration.

**Decision**: Implement as read-only viewer component, not actual session impersonation.

**Rationale**:
- Simpler implementation
- No security risks of session switching
- Clear separation of admin/user contexts
- No need to handle JWT switching
- Faster to implement
- Meets requirement without over-engineering

**Consequences**:
- Admin views data in admin context (not user context)
- Separate API endpoint for full registration data
- Cannot test user experience from admin view

---

## Document Metadata

- **Author**: PACT Architect (Elite Software Architect)
- **Date**: 2026-01-28
- **User Story**: US-017 Gebruikersbeheer
- **Version**: 1.0
- **Status**: Ready for Implementation

**Architecture Phase Complete**

**Handoff to Code Phase**:
This architecture document provides complete specifications for implementing user management functionality. All components, APIs, database changes, and flows are fully specified. The implementation team can proceed with confidence using this blueprint.

**Key Deliverables**:
1. Complete API specifications (8 endpoints)
2. Database migration SQL
3. Component architecture with 5 reusable components
4. Two complete page layouts
5. Security architecture with self-protection rules
6. Error handling patterns
7. Implementation checklist (32 hours estimated)

**Location**: `/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/docs/user-stories/US-017-gebruikersbeheer/ARCHITECT.md`
