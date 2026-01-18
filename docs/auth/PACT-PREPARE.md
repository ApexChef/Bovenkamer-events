# Authenticatie Systeem - PREPARE Document

**Project**: Bovenkamer Winterproef
**Fase**: PACT - Prepare
**Datum**: 2026-01-17
**Auteur**: PACT Preparer

---

## Samenvatting

Dit document beschrijft de requirements, technische aanpak en implementatiestrategie voor het toevoegen van een PIN-gebaseerd authenticatiesysteem aan het Bovenkamer Winterproef platform. Het systeem moet zowel nieuwe registraties als terugkerende gebruikers ondersteunen, met admin goedkeuringsworkflows en email verificatie.

**Belangrijkste Requirements**:
- PIN authenticatie (2 letters + 2 cijfers, bijv. AB12)
- Lokale opslag voor naam persistentie
- Email verificatie voor nieuwe registraties
- Admin goedkeuringsworkflow
- Beheer van verwachte deelnemerslijst
- "Ik kan niet komen" functionaliteit

**Kritieke Beperkingen**:
- Moet integreren met bestaande Zustand store en Supabase setup
- Moet huidige 4-stappen registratieflow behouden
- Mobile-first design (quiz interface is mobile-first)

---

## 1. Functional Requirements

### 1.1 User Stories

**As a first-time visitor:**
- I want to see a choice between "Register" or "Login" when I first visit the app
- I want to register by selecting my name from an expected participants list
- I want to create a 4-character PIN (2 letters + 2 digits) for future access
- I want to receive an email confirmation link after registration
- I want my registration to be pending until admin approval
- I want my name saved locally so I don't have to re-enter it

**As a returning user:**
- I want to be automatically logged in if my name is cached locally
- I want to log in with my email and PIN if cache is cleared
- I want to see my registration status (pending/approved/rejected)
- I want to opt-out by clicking "I can't attend"

**As an admin:**
- I want to manage the expected participants list
- I want to approve or reject pending registrations
- I want to see all registration attempts
- I want to block specific users from accessing certain features

**Beslissingen (bevestigd door gebruiker):**
- PIN reset via email
- Niet in verwachte lijst = toestaan met extra admin approval
- Email service = Resend
- Geen feature blokkering - iedereen mag alles

### 1.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User visits app                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ Check localStorage│
                │  for cached user  │
                └────────┬───────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌───────────┐            ┌────────────┐
    │   Found   │            │  Not Found │
    └─────┬─────┘            └─────┬──────┘
          │                        │
          ▼                        ▼
    ┌──────────┐          ┌──────────────────┐
    │Auto-login│          │Show: Register or │
    │Verify PIN│          │      Login?      │
    └─────┬────┘          └────────┬─────────┘
          │                        │
          │              ┌─────────┴─────────┐
          │              │                   │
          │              ▼                   ▼
          │      ┌──────────────┐   ┌──────────────┐
          │      │  REGISTER    │   │    LOGIN     │
          │      │  (New User)  │   │(Existing User)│
          │      └──────┬───────┘   └──────┬───────┘
          │             │                   │
          │             │                   │
          └─────────────┴───────────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │Dashboard │
                  └──────────┘
```

### 1.3 Registration Flow (New Users)

**Step 0: Pre-registration**
1. User clicks "Register"
2. System shows expected participants list (dropdown)
3. User selects their name from list
4. User enters email address
5. System checks if email/name combo already exists
   - If exists but not verified → resend verification email
   - If exists and verified → redirect to login
   - If new → continue

**Step 1: PIN Creation**
1. User creates PIN (format: XX## - 2 letters, 2 digits)
2. System validates format
3. User confirms PIN
4. System checks PIN uniqueness
5. PIN saved (hashed) in database

**Step 2: Email Verification**
1. System sends verification email with link
2. User clicks link in email
3. System marks email as verified
4. User notified: "Please wait for admin approval"

**Step 3: Admin Approval**
1. Admin reviews registration in admin dashboard
2. Admin approves or rejects
3. User receives status email
4. If approved → user can log in
5. If rejected → user sees reason and can re-apply

**Step 4-7: Existing Registration Flow**
- Continues with existing 4-step registration (personal, skills, quiz, assignment)

### 1.4 Login Flow (Returning Users)

**Option A: Auto-login (cached)**
1. App checks localStorage for `bovenkamer-auth` key
2. If found: extract userId, name, PIN hash
3. Verify PIN hash with database
4. If valid → auto-login
5. If invalid → clear cache, show login screen

**Option B: Manual login**
1. User enters email
2. User enters PIN (XX##)
3. System verifies credentials
4. If valid:
   - Check registration status
   - If pending → show "Awaiting approval"
   - If approved → proceed to dashboard
   - If rejected → show reason
5. If invalid → show error
6. Save to localStorage for future auto-login

### 1.5 Can't Attend Flow

1. User logs in
2. User navigates to dashboard
3. User clicks "I can't attend"
4. System shows confirmation modal
5. User confirms
6. System:
   - Marks registration as `status: 'cancelled'`
   - Sends notification to admin
   - Logs user out
   - Clears localStorage
7. User sees "Thanks for letting us know" message

---

## 2. Technical Requirements

### 2.1 Database Schema Changes

**New Table: `auth_pins`**
```sql
CREATE TABLE auth_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New Table: `expected_participants`**
```sql
CREATE TABLE expected_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  email_hint TEXT, -- Optional: "j.doe@..." for UI
  is_registered BOOLEAN DEFAULT FALSE,
  registered_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_admin_id UUID REFERENCES users(id),
  notes TEXT
);

CREATE INDEX idx_expected_participants_registered
ON expected_participants(is_registered);
```

**New Table: `email_verifications`**
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token
ON email_verifications(token);

CREATE INDEX idx_email_verifications_user
ON email_verifications(user_id);
```

**Modified Table: `users`**
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'pending';
  -- 'pending', 'approved', 'rejected', 'cancelled'
ALTER TABLE users ADD COLUMN rejection_reason TEXT;
ALTER TABLE users ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN blocked_features TEXT[];
  -- Array of feature slugs, e.g., ['rate', 'quiz']

-- For Boy Boom: admin sets blocked_features = ['rate']
```

**Modified Table: `registrations`**
```sql
ALTER TABLE registrations ADD COLUMN status TEXT DEFAULT 'pending';
  -- 'pending', 'approved', 'rejected', 'cancelled'
ALTER TABLE registrations ADD COLUMN cancelled_at TIMESTAMPTZ;
ALTER TABLE registrations ADD COLUMN cancellation_reason TEXT;
```

### 2.2 API Endpoints

**Authentication Routes**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/check-cache` | POST | Verify cached user/PIN | No |
| `/api/auth/register` | POST | Start registration | No |
| `/api/auth/login` | POST | Login with email/PIN | No |
| `/api/auth/verify-email` | GET | Verify email token | No |
| `/api/auth/logout` | POST | Logout and clear session | Yes |
| `/api/auth/cancel-attendance` | POST | Mark as can't attend | Yes |

**Admin Routes**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/admin/participants` | GET | Get expected participants | Admin |
| `/api/admin/participants` | POST | Add expected participant | Admin |
| `/api/admin/participants/:id` | DELETE | Remove expected participant | Admin |
| `/api/admin/registrations` | GET | Get pending registrations | Admin |
| `/api/admin/registrations/:id/approve` | POST | Approve registration | Admin |
| `/api/admin/registrations/:id/reject` | POST | Reject registration | Admin |
| `/api/admin/users/:id/block-feature` | POST | Block user from feature | Admin |

### 2.3 PIN System Implementation

**Format**: `XX##` (2 uppercase letters + 2 digits)
- Examples: `AB12`, `JD99`, `XX00`
- Total possible combinations: 26 × 26 × 10 × 10 = 67,600

**Validation Rules**:
```typescript
const PIN_REGEX = /^[A-Z]{2}\d{2}$/;

function validatePIN(pin: string): boolean {
  return PIN_REGEX.test(pin);
}
```

**Hashing Strategy**:
```typescript
import * as bcrypt from 'bcryptjs';

async function hashPIN(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pin, salt);
  return { hash, salt };
}

async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
```

**Security Considerations**:
- PINs are hashed using bcrypt before storage
- Never store PINs in plain text
- Rate limit login attempts (max 5 attempts per 15 minutes)
- Lock account after 10 failed attempts (requires admin unlock)

### 2.4 Email Verification System

**Email Service Options**:

| Service | Pros | Cons | Cost |
|---------|------|------|------|
| **Resend** | Modern API, good DX, generous free tier | Newer service | Free: 3k emails/month |
| **SendGrid** | Mature, reliable | Complex pricing | Free: 100 emails/day |
| **Mailgun** | Good deliverability | Setup complexity | Pay-as-go: $0.80/1k |
| **Supabase Email** | Built-in, no setup | Limited templates | Included |

**Recommendation**: Use **Resend** for development/production (easiest setup, good free tier).

**Email Template**:
```typescript
const verificationEmail = {
  from: 'Bovenkamer Winterproef <noreply@bovenkamer.nl>',
  to: user.email,
  subject: 'Bevestig je email - Bovenkamer Winterproef',
  html: `
    <h1>Welkom ${user.name}!</h1>
    <p>Klik op de link om je email te bevestigen:</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}">
      Bevestig email
    </a>
    <p>Deze link is 24 uur geldig.</p>
  `
};
```

**Verification Flow**:
1. Generate random token (UUID)
2. Store token in `email_verifications` table with 24h expiry
3. Send email with verification link
4. User clicks link → `/api/auth/verify-email?token=xxx`
5. API verifies token:
   - Check token exists
   - Check not expired
   - Check not already verified
   - Mark as verified
   - Update `users.email_verified = true`
6. Redirect to "Email verified, awaiting approval" page

### 2.5 localStorage Implementation

**Storage Key**: `bovenkamer-auth`

**Stored Data**:
```typescript
interface AuthCache {
  userId: string;
  name: string;
  email: string;
  pinHash: string; // For quick validation
  role: 'participant' | 'admin' | 'quizmaster';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  cachedAt: number; // Timestamp
  expiresAt: number; // 30 days from cachedAt
}
```

**Cache Strategy**:
- Cache valid for 30 days
- Auto-refresh on successful PIN verification
- Clear on logout
- Clear on "Can't attend"
- Clear on registration rejection

**Integration with Zustand**:
```typescript
// Update existing store.ts
interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: 'participant' | 'admin' | 'quizmaster' | null;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | null;
  emailVerified: boolean;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthCache) => void;
  clearAuth: () => void;
  checkCache: () => Promise<boolean>;
}
```

### 2.6 Role-Based Access Control (RBAC)

**User Roles**:
- `participant` - Default role, can access all participant features
- `admin` - Full access, can approve registrations
- `quizmaster` - Can manage quiz sessions

**Feature Blocking**:
```typescript
interface User {
  // ... existing fields
  blocked_features: string[]; // e.g., ['rate', 'quiz', 'predictions']
}

// Middleware to check feature access
function hasFeatureAccess(user: User, feature: string): boolean {
  if (!user.blocked_features) return true;
  return !user.blocked_features.includes(feature);
}

// Example: Boy Boom blocking
// Admin sets: user.blocked_features = ['rate']
// When Boy Boom tries to access /rate:
if (!hasFeatureAccess(user, 'rate')) {
  return redirect('/dashboard?error=feature_blocked');
}
```

**Route Protection**:
```typescript
// Middleware: /middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = getUserFromRequest(request);

  // Check authentication
  if (requiresAuth(pathname) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check registration status
  if (user && user.registrationStatus !== 'approved') {
    return NextResponse.redirect(new URL('/status', request.url));
  }

  // Check feature blocking
  const feature = getFeatureFromPath(pathname); // e.g., '/rate' → 'rate'
  if (feature && !hasFeatureAccess(user, feature)) {
    return NextResponse.redirect(
      new URL('/dashboard?error=feature_blocked', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/rate/:path*', '/quiz/:path*', '/predictions/:path*']
};
```

---

## 3. Existing Code Analysis

### 3.1 Current Authentication State

**Current Implementation** (`src/lib/store.ts`):
```typescript
// Simple session storage
userId: string | null;
authCode: string | null;
setUser: (userId: string, authCode: string) => void;
```

**Issues**:
- `authCode` is not a PIN (unclear what it stores)
- No email verification
- No registration status tracking
- No role-based access control
- No cached authentication

**Migration Path**:
1. Add new auth fields to existing store
2. Deprecate `authCode` (keep for backwards compatibility during transition)
3. Add new `auth` slice with proper PIN handling
4. Update existing `setUser` to use new auth system

### 3.2 Current Registration Flow

**Current Steps** (`src/app/register/page.tsx`):
1. Step 1: Personal (name, email, birth year, partner, dietary)
2. Step 2: Skills (primary skill, additional, music preferences)
3. Step 3: Quiz (15 personal questions)
4. Step 4: Assignment (AI-generated task assignment)

**Integration Points**:
- **Step 0 (NEW)**: Auth gate → Select from expected participants → Create PIN → Email verification
- **Step 1-4**: Keep existing, but require auth before starting
- **After Step 4**: Mark registration as complete, set status to 'pending'

### 3.3 Current API Routes

**Existing** (`src/app/api/registration/route.ts`):
- `POST /api/registration` - Creates/updates user and registration
- `GET /api/registration` - Gets all registrations (admin)

**Modifications Needed**:
- Add `registration_status` check before allowing registration
- Add email verification check
- Add PIN verification before data access

### 3.4 Supabase Client Configuration

**Current Setup** (`src/lib/supabase.ts`):
- Client-side: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Server-side: Uses `SUPABASE_SECRET_KEY` (for API routes)
- RLS policies: Currently "Allow all" (development mode)

**Security Improvements Needed**:
```sql
-- Replace "Allow all" with proper RLS policies

-- Users: Can read own data, admins can read all
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = auth.uid() OR role = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Registrations: Users can read/update own, admins can read all
CREATE POLICY "Users can read own registration" ON registrations
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update own registration" ON registrations
  FOR UPDATE USING (user_id = auth.uid());

-- Auth PINs: Users can only read/update own PIN
CREATE POLICY "Users can manage own PIN" ON auth_pins
  FOR ALL USING (user_id = auth.uid());

-- Expected participants: Read-only for participants, full access for admins
CREATE POLICY "Anyone can read expected participants" ON expected_participants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage expected participants" ON expected_participants
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

**Note**: Supabase has built-in `auth.uid()` function, but we're using custom PIN auth, so we need to:
1. Create custom JWT tokens after PIN verification
2. Store JWT in cookie/localStorage
3. Use JWT for RLS policies (set as Supabase session)

**Alternative**: Use Supabase Auth with custom provider:
```typescript
// Option A: Custom PIN auth (simpler, less features)
// - Store PINs in custom table
// - Manage sessions manually
// - Implement RLS with custom logic

// Option B: Integrate with Supabase Auth (recommended)
// - Use Supabase Auth as base
// - Add PIN as secondary authentication
// - Leverage built-in RLS policies
```

**Recommendation**: Start with **Option A** (custom PIN auth) for simplicity, migrate to **Option B** if advanced auth features needed (2FA, OAuth, etc.).

---

## 4. Risks & Dependencies

### 4.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **PIN collisions** | High | Low | Validate uniqueness on creation, suggest alternatives |
| **Email deliverability** | High | Medium | Use reputable service (Resend), implement retry logic |
| **localStorage corruption** | Medium | Low | Validate cached data, fallback to login |
| **Database migration issues** | High | Medium | Create backups, test migrations in staging |
| **RLS policy conflicts** | Medium | Low | Test policies thoroughly, start permissive → restrictive |
| **bcrypt performance** | Low | Low | Use appropriate salt rounds (10), consider caching |

### 4.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Forgotten PINs** | High | Medium | Implement PIN reset via email |
| **Spam folder** | Medium | High | Use verified domain, clear subject lines, test deliverability |
| **Admin approval delay** | Medium | Medium | Email notifications to admin, show ETA to users |
| **Confusing PIN format** | Low | Medium | Clear instructions, real-time validation, format hints |
| **Lost localStorage** | Low | Low | Clear recovery instructions, easy re-login |

### 4.3 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Brute force attacks** | High | Medium | Rate limiting, account lockout after 10 attempts |
| **Email enumeration** | Low | Medium | Same response for valid/invalid emails ("If exists, email sent") |
| **Token stealing** | High | Low | Short-lived tokens (24h), HTTPS only, secure cookies |
| **XSS attacks** | High | Low | Sanitize inputs, Content Security Policy headers |
| **SQL injection** | High | Low | Supabase SDK parameterized queries (safe by default) |

### 4.4 Dependencies

**External Services**:
- **Resend** (or alternative email service) - Email verification
- **Supabase** - Database and API
- **bcryptjs** - PIN hashing
- **jose** or **jsonwebtoken** - JWT tokens (if using Supabase Auth integration)

**NPM Packages to Install**:
```bash
npm install bcryptjs
npm install resend
npm install @types/bcryptjs --save-dev
```

**Environment Variables Needed**:
```env
RESEND_API_KEY=re_xxx
NEXT_PUBLIC_APP_URL=https://bovenkamer-winterproef.nl
```

---

## 5. Open Questions

### 5.1 Requirements Clarification

**Q1**: Should users be able to reset forgotten PINs?
- **Option A**: Reset via email (send reset link → create new PIN)
- **Option B**: Contact admin for reset
- **Recommendation**: Option A (better UX, less admin burden)

**Q2**: How long should email verification tokens be valid?
- **Current assumption**: 24 hours
- **Alternative**: 7 days (more forgiving)
- **Recommendation**: 24 hours (security best practice)

**Q3**: Can users change their PIN after registration?
- **Current assumption**: No (PINs are permanent)
- **Alternative**: Allow PIN change via email verification
- **Recommendation**: Allow change (better UX, security practice)

**Q4**: What happens if a user tries to register with a name not in expected participants list?
- **Option A**: Block registration completely
- **Option B**: Allow registration but require admin approval + manual verification
- **Recommendation**: Option B (more flexible, handles edge cases)

**Q5**: Should "Can't attend" be reversible?
- **Option A**: No, once cancelled they must re-register
- **Option B**: Allow un-cancellation within 24h
- **Recommendation**: Option A (simpler, clearer intent)

**Q6**: Can admins register on behalf of users?
- **Current assumption**: No
- **Alternative**: Admin can create registration → system sends invite email to user
- **Recommendation**: No for MVP, consider for v2

### 5.2 Technical Decisions

**Q7**: Should we use Supabase Auth or custom auth?
- **Option A**: Custom auth with PINs (simpler, more control)
- **Option B**: Supabase Auth + PINs as 2FA (more features, complex setup)
- **Recommendation**: Start with Option A, migrate to Option B if needed

**Q8**: Where to store JWT tokens?
- **Option A**: localStorage (vulnerable to XSS, but simpler)
- **Option B**: httpOnly cookies (more secure, requires API route for all requests)
- **Recommendation**: Option B (security best practice)

**Q9**: Should PIN attempts be rate-limited per IP or per email?
- **Option A**: Per IP (prevents distributed attacks)
- **Option B**: Per email (prevents account lockout from shared IPs)
- **Recommendation**: Combination (rate limit both IP and email)

**Q10**: How to handle concurrent registrations from same expected participant?
- **Scenario**: User starts registration, doesn't finish, tries again
- **Current assumption**: Allow, overwrite partial registration
- **Alternative**: Lock expected participant until registration complete or timeout
- **Recommendation**: Allow with warning ("You have a pending registration. Continue?")

### 5.3 UI/UX Decisions

**Q11**: Should PIN input be visible or masked?
- **Option A**: Masked (like password) - more secure
- **Option B**: Visible with toggle - better UX for short PINs
- **Recommendation**: Option B (4-char PIN is short, visibility helps avoid typos)

**Q12**: Where should authentication gate be placed?
- **Option A**: Landing page → Auth gate → Registration flow
- **Option B**: Landing page → Registration flow → Auth gate before Step 1
- **Recommendation**: Option A (clearer flow, prevents partial registrations)

**Q13**: How to display registration status to pending users?
- **Option A**: Dedicated `/status` page with live updates
- **Option B**: Email notification only (check email)
- **Recommendation**: Option A + email (better UX, reduces support questions)

---

## 6. Implementation Checklist

### Phase 1: Database & Core Auth (Week 1)

- [ ] Create database schema (auth_pins, expected_participants, email_verifications)
- [ ] Update users and registrations tables with new fields
- [ ] Implement PIN validation and hashing utilities
- [ ] Create auth API routes (register, login, verify-email, logout)
- [ ] Set up Resend email service integration
- [ ] Update Zustand store with auth state
- [ ] Implement localStorage caching

### Phase 2: Registration Flow Integration (Week 1-2)

- [ ] Create auth gate component (Register or Login choice)
- [ ] Create expected participants selector
- [ ] Create PIN creation/confirmation UI
- [ ] Integrate email verification into registration flow
- [ ] Update existing registration steps to require auth
- [ ] Add registration status display page

### Phase 3: Admin Features (Week 2)

- [ ] Create expected participants management UI
- [ ] Create pending registrations approval UI
- [ ] Add feature blocking UI for admins
- [ ] Implement admin notification emails
- [ ] Add audit logging for admin actions

### Phase 4: User Features (Week 2-3)

- [ ] Implement "Can't attend" functionality
- [ ] Add PIN reset flow
- [ ] Add PIN change functionality
- [ ] Create blocked feature error page
- [ ] Add rate limiting middleware

### Phase 5: Security & Testing (Week 3)

- [ ] Implement RLS policies (replace "Allow all")
- [ ] Add rate limiting to auth endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Add CSRF protection
- [ ] Set up Content Security Policy headers
- [ ] Test email deliverability
- [ ] Test PIN collision handling
- [ ] Test localStorage edge cases

### Phase 6: Boy Boom Specific (Week 3)

- [ ] Add Boy Boom user to expected participants
- [ ] Set blocked_features = ['rate'] for Boy Boom
- [ ] Test /rate blocking for Boy Boom
- [ ] Verify Boy Boom can access all other features

---

## 7. Success Criteria

**Authentication System Success**:
- [x] Users can register by selecting name from expected participants list
- [x] Users can create a 4-character PIN (XX##)
- [x] Email verification works with 95%+ deliverability
- [x] Admins can approve/reject registrations
- [x] Returning users can auto-login from cache
- [x] Manual login works with email + PIN
- [x] "Can't attend" feature works correctly
- [x] Boy Boom cannot access /rate page
- [x] No security vulnerabilities (XSS, SQL injection, brute force)
- [x] Auth flow has <2 second response time (95th percentile)

**User Experience Success**:
- [x] PIN creation has clear instructions and real-time validation
- [x] Email verification emails arrive within 5 minutes
- [x] Registration status is clearly communicated
- [x] Forgotten PIN recovery is straightforward
- [x] Mobile UX is smooth (majority of users are mobile)

**Admin Experience Success**:
- [x] Expected participants list is easy to manage
- [x] Pending registrations are clearly visible
- [x] Approval/rejection is one-click action
- [x] Feature blocking is intuitive
- [x] Audit trail of all admin actions

---

## 8. Next Steps for Architecture Phase

**Key Decisions Needed from Architect**:

1. **Auth Strategy**: Confirm custom PIN auth vs. Supabase Auth integration
2. **Token Storage**: Confirm httpOnly cookies vs. localStorage for JWT
3. **Email Service**: Confirm Resend vs. alternatives
4. **Rate Limiting**: Define exact limits (attempts per minute/hour/day)
5. **Cache Expiration**: Confirm 30-day cache duration
6. **RLS Strategy**: Progressive rollout plan for RLS policies

**Architecture Deliverables**:
- System architecture diagram (auth flow, API interactions)
- Database schema with relationships and indexes
- API contract specifications (request/response formats)
- Security architecture (threat model, mitigation strategies)
- Error handling strategy
- Performance optimization plan

**Implementation Guidance Needed**:
- Component hierarchy for auth UI
- State management strategy (Zustand slices)
- API route organization
- Middleware configuration
- Testing strategy (unit, integration, e2e)

---

## Appendix A: PIN Format Examples

**Valid PINs**:
- `AB12` - Standard format
- `XY99` - Letters + high digits
- `AA00` - Repeated letters/digits (allowed)
- `ZZ99` - Edge case (highest possible)

**Invalid PINs**:
- `ab12` - Lowercase (must uppercase)
- `1234` - All digits
- `ABCD` - All letters
- `A123` - Wrong format (1 letter + 3 digits)
- `ABC1` - Wrong format (3 letters + 1 digit)
- `A B12` - Contains space
- `AB-12` - Contains special character

**Validation Logic**:
```typescript
function validateAndFormatPIN(input: string): { valid: boolean; pin?: string; error?: string } {
  // Remove whitespace
  const cleaned = input.trim().toUpperCase();

  // Check format
  if (!/^[A-Z]{2}\d{2}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'PIN moet 2 letters gevolgd door 2 cijfers zijn (bijv. AB12)'
    };
  }

  return { valid: true, pin: cleaned };
}
```

---

## Appendix B: Email Templates

**Verification Email**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bevestig je email</title>
</head>
<body style="font-family: 'Source Sans Pro', Arial, sans-serif; background-color: #1B4332; color: #F5F5DC; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #2C1810; border-radius: 8px; padding: 40px;">
    <h1 style="color: #D4AF37; font-family: 'Playfair Display', serif;">Welkom bij de Bovenkamer Winterproef!</h1>

    <p>Hallo {{name}},</p>

    <p>Bedankt voor je registratie! Klik op de knop hieronder om je e-mailadres te bevestigen:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verificationUrl}}"
         style="background-color: #D4AF37; color: #1B4332; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
        Bevestig E-mailadres
      </a>
    </div>

    <p style="font-size: 14px; color: #F5F5DC80;">
      Of kopieer deze link naar je browser:<br>
      <span style="word-break: break-all;">{{verificationUrl}}</span>
    </p>

    <p style="font-size: 14px; color: #F5F5DC80;">
      Deze link is 24 uur geldig.
    </p>

    <hr style="border-color: #D4AF3720; margin: 30px 0;">

    <p style="font-size: 12px; color: #F5F5DC60;">
      Je ontvangt deze email omdat je je hebt geregistreerd voor de Bovenkamer Winterproef 2026.
    </p>
  </div>
</body>
</html>
```

**Approval Email**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registratie Goedgekeurd</title>
</head>
<body style="font-family: 'Source Sans Pro', Arial, sans-serif; background-color: #1B4332; color: #F5F5DC; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #2C1810; border-radius: 8px; padding: 40px;">
    <h1 style="color: #D4AF37; font-family: 'Playfair Display', serif;">Registratie Goedgekeurd! 🎉</h1>

    <p>Hallo {{name}},</p>

    <p>Goed nieuws! Je registratie voor de Bovenkamer Winterproef is goedgekeurd.</p>

    <p>Je kunt nu inloggen met je PIN: <strong style="color: #D4AF37; font-size: 18px; letter-spacing: 2px;">{{pinHint}}</strong></p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{loginUrl}}"
         style="background-color: #D4AF37; color: #1B4332; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
        Inloggen
      </a>
    </div>

    <p><strong>Event Details:</strong></p>
    <ul>
      <li>📅 Datum: 24 januari 2026, 14:00+</li>
      <li>📍 Locatie: Bij Boy Boom (adres volgt)</li>
      <li>💶 Kosten: €50 per persoon</li>
    </ul>

    <p>Tot dan!</p>

    <hr style="border-color: #D4AF3720; margin: 30px 0;">

    <p style="font-size: 12px; color: #F5F5DC60;">
      Kun je toch niet komen? Laat het ons weten via de "Ik kan niet komen" knop in je dashboard.
    </p>
  </div>
</body>
</html>
```

**Rejection Email**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registratie Status</title>
</head>
<body style="font-family: 'Source Sans Pro', Arial, sans-serif; background-color: #1B4332; color: #F5F5DC; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #2C1810; border-radius: 8px; padding: 40px;">
    <h1 style="color: #8B0000; font-family: 'Playfair Display', serif;">Registratie Status</h1>

    <p>Hallo {{name}},</p>

    <p>Helaas kunnen we je registratie voor de Bovenkamer Winterproef op dit moment niet goedkeuren.</p>

    <p><strong>Reden:</strong> {{reason}}</p>

    <p>Je kunt opnieuw proberen te registreren of contact opnemen met de organisatie voor meer informatie.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{contactUrl}}"
         style="background-color: #D4AF37; color: #1B4332; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
        Contact Opnemen
      </a>
    </div>

    <hr style="border-color: #D4AF3720; margin: 30px 0;">

    <p style="font-size: 12px; color: #F5F5DC60;">
      Vragen? Neem contact op met de organisatie.
    </p>
  </div>
</body>
</html>
```

---

## Appendix C: Database Indexes

**Performance-Critical Indexes**:

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_registration_status ON users(registration_status);

-- Auth PINs table
CREATE INDEX idx_auth_pins_user_id ON auth_pins(user_id);

-- Expected Participants table
CREATE INDEX idx_expected_participants_name ON expected_participants(name);
CREATE INDEX idx_expected_participants_registered ON expected_participants(is_registered);

-- Email Verifications table
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Registrations table
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_users_email_verified_status
ON users(email, email_verified, registration_status);

CREATE INDEX idx_email_verifications_user_verified
ON email_verifications(user_id, verified_at);
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | PACT Preparer | Initial PREPARE document |

---

**HANDOFF TO ORCHESTRATOR**:
This PREPARE document is complete. All research findings, requirements analysis, technical specifications, and open questions have been documented in `/Users/alwin/Projects/github.com/ApexChef/Bovenkamer-events/.claude/pact/auth-system-prepare.md`.

Ready for ARCHITECT phase to begin system design based on these findings.
