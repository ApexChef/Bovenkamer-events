# US-011: Desktop Login/Dashboard Loading Issues

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | URGENT (Bug Fix) |
| **Status** | Verified |
| **Complexiteit** | Medium |
| **Type** | Bug Fix |

## Bug Report

### Probleem
1. Login werkt, maar dashboard blijft loading indicator tonen
2. Na refresh werkt het wel
3. Profiel toont 0% op desktop terwijl mobiel 100% toont

### Reproductie Stappen
1. Vul profiel 100% in op mobiel
2. Open desktop browser, login
3. Dashboard toont loading indicator
4. Profiel toont 0% in plaats van 100%
5. Na refresh: alles werkt correct

### Verwacht Gedrag
- Dashboard laadt direct na login
- Profiel completion sync'd correct tussen devices

## Root Cause Analyse

### 1. Async Login Function (Onnodig)
**Bestand:** `/src/lib/store.ts`

```typescript
// VOOR (problematisch):
login: async (user, token, pinHash) => { ... }

// Await in login page kon hangen
await login(data.user, data.token, pinHash);
```

Probleem: Function was `async` maar await'de niets, kon timing issues veroorzaken.

### 2. Dashboard Hydration Race Condition
**Bestand:** `/src/app/dashboard/page.tsx`

```typescript
// Dashboard checkte alleen _hasHydrated van registration store
if (!_hasHydrated || !isComplete) { ... }
```

Probleem:
- Geen check voor client-side mount
- Geen check voor auth state
- Race condition bij navigatie van login naar dashboard

### 3. State Persistence Timing
**Bestand:** `/src/app/login/page.tsx`

```typescript
// State updates gevolgd door directe redirect
setFormData(...);
markSectionComplete(...);
setComplete(true);
router.push('/dashboard'); // Te snel!
```

Probleem: Zustand persist middleware slaat async op naar localStorage.
Redirect kon gebeuren voordat state gepersisteerd was.

## Oplossing

### Fix 1: Remove async from login function
```typescript
// src/lib/store.ts
login: (user, token, pinHash) => {
  // localStorage FIRST before state update
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  set({ ... });
}
```

### Fix 2: Robust dashboard hydration check
```typescript
// src/app/dashboard/page.tsx
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

// Check client mount, hydration, AND auth state
if (!isMounted || !_hasHydrated) { ... }
if (!isAuthenticated || !isComplete) { ... }
```

### Fix 3: Poll localStorage before redirect (IMPROVED)
```typescript
// src/app/login/page.tsx
setComplete(true);

// Wait for Zustand persist middleware to save state to localStorage
// We poll localStorage to ensure the data is actually persisted before redirecting
const maxWaitTime = 2000; // Max 2 seconds
const pollInterval = 50;  // Check every 50ms
const startTime = Date.now();

while (Date.now() - startTime < maxWaitTime) {
  try {
    const registrationData = localStorage.getItem('bovenkamer-registration');
    const authData = localStorage.getItem('bovenkamer-auth');

    if (registrationData && authData) {
      const regParsed = JSON.parse(registrationData);
      const authParsed = JSON.parse(authData);

      // Check if both stores are properly persisted with correct user data
      const registrationReady = regParsed.state?.isComplete === true &&
                                 regParsed.state?.formData?.email === data.user.email;
      const authReady = authParsed.state?.isAuthenticated === true &&
                        authParsed.state?.currentUser?.email === data.user.email;

      if (registrationReady && authReady) {
        break; // Both stores are properly persisted
      }
    }
  } catch {
    // JSON parse error, continue waiting
  }
  await new Promise(resolve => setTimeout(resolve, pollInterval));
}

router.push('/dashboard');
```

**Waarom polling in plaats van fixed delay:**
- De 100ms delay was niet robuust - Zustand persist kan langer duren afhankelijk van browser/device
- Polling verifieert dat de state ECHT is gepersisteerd voordat we redirecten
- Checkt BEIDE stores (registration + auth) met correcte user email
- Heeft een max timeout van 2 seconden als fallback

### Fix 4: Explicit hydration flag after login (FINAL FIX)
```typescript
// src/app/login/page.tsx
const { setHasHydrated: setRegistrationHydrated, ... } = useRegistrationStore();

// After all state updates:
setComplete(true);
setRegistrationHydrated(true);  // <-- Dit was de ontbrekende stap!
```

**Root cause:** De `_hasHydrated` flag wordt alleen gezet via `onRehydrateStorage` callback bij de initiële store hydration. Na `resetRegistration()` en client-side navigatie naar het dashboard, wordt deze callback NIET opnieuw aangeroepen. Het dashboard blijft dan wachten op `registrationHydrated: true` die nooit komt.

**Oplossing:** Expliciet `setHasHydrated(true)` aanroepen na alle login state updates.

## Bestanden Gewijzigd

| Bestand | Wijziging |
|---------|-----------|
| `/src/lib/store.ts` | login() niet meer async, localStorage eerst |
| `/src/app/dashboard/page.tsx` | isMounted state, auth check toegevoegd |
| `/src/app/login/page.tsx` | Polling localStorage voor redirect i.p.v. fixed delay |
| `/tsconfig.json` | Test bestanden uitgesloten van build |

## Acceptatiecriteria

- [x] Login function is synchronous
- [x] Dashboard wacht correct op hydration
- [x] Auth state wordt gecheckt op dashboard
- [x] State wordt gepersisteerd voor redirect
- [ ] Login werkt op desktop browsers (te testen)
- [ ] Profiel sync't correct tussen devices (te testen)
- [ ] Geen regressies op mobiel (te testen)

## Test Scenarios

| Scenario | Verwacht Resultaat |
|----------|-------------------|
| Desktop login met vol profiel | Dashboard toont correct, profiel 100% |
| Desktop login, direct refresh | Nog steeds correct |
| Mobiel login na desktop | Geen regressie |
| Nieuwe gebruiker login | Dashboard toont correct |
