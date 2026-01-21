# US-011: Desktop Login/Dashboard Loading Issues

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | URGENT (Bug Fix) |
| **Status** | Code Complete |
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

### Fix 3: Delay redirect for state persistence
```typescript
// src/app/login/page.tsx
setComplete(true);

// Wait for persist middleware to save state
await new Promise(resolve => setTimeout(resolve, 100));

router.push('/dashboard');
```

## Bestanden Gewijzigd

| Bestand | Wijziging |
|---------|-----------|
| `/src/lib/store.ts` | login() niet meer async, localStorage eerst |
| `/src/app/dashboard/page.tsx` | isMounted state, auth check toegevoegd |
| `/src/app/login/page.tsx` | await verwijderd, delay voor redirect |

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
