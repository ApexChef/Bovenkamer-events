# Authentication System - Quick Start Guide

**Last Updated**: 2026-01-17

---

## TL;DR - Get Running in 5 Minutes

```bash
# 1. Install dependencies (already done if you ran npm install)
npm install

# 2. Run database migration
# Go to Supabase Dashboard → SQL Editor
# Paste contents of: supabase/migrations/20260117_auth_system.sql
# Click "Run"

# 3. Set environment variables
cp .env.example .env.local

# Edit .env.local and add:
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 4. Start dev server
npm run dev

# 5. Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","pin":"AB12","pinConfirm":"AB12"}'

# Done! Check console for verification email.
```

---

## API Endpoints Overview

### Public Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with email + PIN |
| GET | `/api/auth/verify-email?token=xxx` | Verify email |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/reset-pin` | Request PIN reset |

### Admin Endpoints (require `role: 'admin'`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/participants` | List expected participants |
| POST | `/api/admin/participants` | Add expected participant |
| GET | `/api/admin/registrations` | List all registrations |
| POST | `/api/admin/registrations/[id]/approve` | Approve registration |
| POST | `/api/admin/registrations/[id]/reject` | Reject registration |

---

## Common Use Cases

### Register New User

```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jan de Vries',
    email: 'jan@example.com',
    pin: 'AB12',         // Format: XX## (2 letters + 2 digits)
    pinConfirm: 'AB12',
  }),
});

const data = await response.json();
// { success: true, userId: "...", message: "Verificatie email verzonden...", nextStep: "email-verification" }
```

### Login User

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jan@example.com',
    pin: 'AB12',
  }),
});

const data = await response.json();
// { success: true, user: {...}, token: "...", message: "Welkom terug, Jan!" }
// Cookie "bovenkamer_auth_token" is automatically set
```

### Check Auth Status (Client-Side)

```typescript
// Check if user is logged in
const response = await fetch('/api/auth/session');
const { user } = await response.json();

if (user) {
  // User is logged in
  console.log(user.name, user.role, user.registrationStatus);
} else {
  // Not logged in - redirect to /login
}
```

### Logout

```typescript
await fetch('/api/auth/logout', { method: 'POST' });
// Cookie is cleared
// Also clear any localStorage cache
localStorage.removeItem('auth_cache');
```

### Approve Registration (Admin)

```typescript
const response = await fetch(`/api/admin/registrations/${userId}/approve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sendEmail: true, // Send approval email
  }),
});

const data = await response.json();
// { success: true, message: "Registratie goedgekeurd", emailSent: true }
```

---

## Error Codes Reference

### Registration Errors

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Invalid input (check `fields` object) |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many attempts |
| `SERVER_ERROR` | 500 | Internal error |

### Login Errors

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or PIN |
| `ACCOUNT_LOCKED` | 403 | Too many failed attempts (1 hour lockout) |
| `EMAIL_NOT_VERIFIED` | 403 | Email not verified yet |
| `REGISTRATION_PENDING` | 403 | Awaiting admin approval |
| `REGISTRATION_REJECTED` | 403 | Registration was rejected |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many login attempts |

---

## PIN Format

PINs use format **XX##** (2 uppercase letters + 2 digits):

**Valid Examples**:
- `AB12`
- `ZZ99`
- `CD34`

**Invalid Examples**:
- `1234` (no letters)
- `ABCD` (no digits)
- `AB1` (only 1 digit)
- `abc12` (lowercase - will be normalized to `ABC12`)

**Security**:
- 67,600 unique combinations (26² × 10²)
- Hashed with bcrypt (10 rounds)
- Account lockout after 10 failed attempts
- Rate limited to 10 attempts per 15 minutes

---

## User States & Flow

```
Registration → Email Verification → Admin Approval → Login
    ↓               ↓                      ↓            ↓
  pending    email_verified=false    approved    full access
             email_verified=true     pending
                                     rejected (blocked)
```

**User Status Flags**:
- `email_verified`: Email confirmed via token link
- `registration_status`: `pending` | `approved` | `rejected` | `cancelled`
- `role`: `participant` | `admin` | `quizmaster`

**Access Rules**:
- Can register: Anyone
- Can login: `email_verified=true` AND `registration_status=approved`
- Can access features: Depends on `blocked_features` array

---

## Environment Variables

Required for production:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

# Authentication
JWT_SECRET=your-32-char-secret-key  # Generate with: openssl rand -base64 32
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Email (production only - dev logs to console)
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@bovenkamer-winterproef.nl
```

---

## Database Tables

**New Tables**:
- `auth_pins` - PIN hashes and security tracking
- `email_verifications` - Verification tokens
- `expected_participants` - Pre-approved participant list
- `rate_limits` - Rate limiting data

**Extended Tables**:
- `users` - Added auth fields (email_verified, registration_status, etc.)
- `registrations` - Added status tracking

---

## Testing Locally

### 1. Create Test User

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","pin":"AB12","pinConfirm":"AB12"}'

# Check console for verification token
# Visit: http://localhost:3000/api/auth/verify-email?token=<token>

# Manually approve (SQL):
# UPDATE users SET registration_status='approved' WHERE email='test@example.com';

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","pin":"AB12"}'
```

### 2. Create Admin User

```sql
-- Insert admin
INSERT INTO users (email, name, role, email_verified, registration_status)
VALUES ('admin@example.com', 'Admin', 'admin', true, 'approved')
RETURNING id;

-- Register admin via API with PIN, then update role:
UPDATE users SET role='admin', registration_status='approved', email_verified=true
WHERE email='admin@example.com';
```

---

## Common Issues

**"Email already registered"**
→ Email exists. Use login instead or different email.

**"Email not verified"**
→ Check email for verification link or resend verification.

**"Registration pending"**
→ Waiting for admin approval. Contact admin.

**"Account locked"**
→ Too many failed attempts. Wait 1 hour or contact admin.

**"Rate limit exceeded"**
→ Too many requests. Wait and try again.

**"Database error"**
→ Check Supabase connection and migration ran successfully.

---

## Security Checklist

✅ PINs hashed with bcrypt (never plain text)
✅ Email verification required
✅ Rate limiting enabled
✅ Account lockout after 10 failed attempts
✅ JWT in httpOnly cookies (XSS protection)
✅ Input validation on all endpoints
✅ Admin role required for sensitive operations

---

## Next Steps

1. Run database migration
2. Configure environment variables
3. Test registration flow
4. Create admin user
5. Build frontend UI
6. Deploy to production (see deployment checklist in main docs)

---

For detailed documentation, see:
- `/docs/auth-system-implementation-summary.md` - Complete implementation details
- `.claude/pact/auth-system-architect.md` - Architecture specification
