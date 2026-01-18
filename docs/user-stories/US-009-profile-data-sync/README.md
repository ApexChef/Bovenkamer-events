# US-009: Profiel Data Sync bij Login

## Status
| Aspect | Waarde |
|--------|--------|
| **Prioriteit** | URGENT (Bug Fix) |
| **Status** | In Progress |
| **Complexiteit** | Medium |
| **PACT Fase** | Prepare |
| **Type** | Bug Fix |

## Bug Report

### Probleem
Het profiel laadt niet na login op zowel mobiel als desktop. Na het wissen van local storage/sessies wordt de profieldata niet correct hersteld vanuit de database.

### Reproductie Stappen
1. Login als gebruiker met volledig ingevuld profiel
2. Wis local storage (DevTools → Application → Clear storage)
3. Login opnieuw
4. Profiel toont lege/onvolledige data

### Verwacht Gedrag
Na login moet alle profieldata uit de database geladen worden, inclusief:
- Alle `formData` velden
- `completedSections` status
- `attendance` bevestiging
- Profiel compleetheid percentage

### Actueel Gedrag
- Profiel lijkt leeg of onvolledig
- `completedSections` blijft leeg (alle false)
- `getProfileCompletion()` retourneert 0% terwijl data aanwezig is
- Secties tonen geen completion badges

## Root Cause Analyse

### 1. Login API Onvolledige Response
**Bestand:** `/src/app/api/auth/login/route.ts`

De SELECT query mist kritieke velden:
```typescript
// Huidige query (onvolledig):
.select('ai_assignment, birth_year, has_partner, partner_name,
         dietary_requirements, primary_skill, additional_skills,
         music_decade, music_genre, quiz_answers')

// Ontbrekende velden:
// - jkv_join_year, jkv_exit_year, bovenkamer_join_year
// - borrel_count_2025, borrel_planning_2026
// - attendance_confirmed, attendance_status
// - sections_completed (of individuele flags)
```

### 2. CompletedSections Niet Hersteld
**Bestand:** `/src/app/login/page.tsx`

De login handler herstelt `setFormData()` maar:
- `completedSections` wordt niet hersteld van API
- Geen logica om completion af te leiden uit aanwezige data
- Zustand store hydrateert alleen uit localStorage (die leeg is)

### 3. Data Flow Probleem

| Laag | Bij Login | Probleem |
|------|-----------|----------|
| **Auth Store** | user, token → OK | Geen issues |
| **Registration Store** | formData → Gedeeltelijk | Ontbrekende velden |
| **Registration Store** | completedSections → ❌ | Niet hersteld |
| **Registration Store** | attendance → ❌ | Niet hersteld |

## Technische Impact

### Betrokken Componenten
| Component | Locatie | Impact |
|-----------|---------|--------|
| Login API | `/src/app/api/auth/login/route.ts` | Query uitbreiden |
| Login Handler | `/src/app/login/page.tsx` | Restore logica toevoegen |
| Dashboard | `/src/app/dashboard/page.tsx` | Toont verkeerde completion |
| ProfileTab | `/src/components/dashboard/ProfileTab.tsx` | Mist data |
| HomeTab | `/src/components/dashboard/HomeTab.tsx` | Toont 0% |

### Database Velden
Velden in `registrations` tabel die gesynchroniseerd moeten worden:

| Veld | Type | Status |
|------|------|--------|
| `birth_year` | int | ⚠️ Wordt geladen |
| `has_partner` | boolean | ⚠️ Wordt geladen |
| `partner_name` | text | ⚠️ Wordt geladen |
| `jkv_join_year` | int | ❌ Niet geladen |
| `jkv_exit_year` | int | ❌ Niet geladen |
| `bovenkamer_join_year` | int | ❌ Niet geladen |
| `borrel_count_2025` | int | ❌ Niet geladen |
| `borrel_planning_2026` | jsonb | ❌ Niet geladen |
| `skills` | jsonb | ⚠️ Gedeeltelijk |
| `attendance_confirmed` | boolean | ❌ Niet geladen |
| `sections_completed` | jsonb | ❌ Niet geladen (of afleiden) |

## Oplossing

### Optie A: Database Sectie Tracking (Aanbevolen)
1. Voeg `sections_completed` JSONB kolom toe aan `registrations`
2. Update bij elke sectie save
3. Laad en herstel bij login

### Optie B: Afleiden uit Data
1. Bij login, check per veld of data aanwezig is
2. Bereken `completedSections` dynamisch
3. Pro: Geen DB wijziging. Con: Meer logica, kan desyncen

## Acceptatiecriteria

- [ ] Login API retourneert alle profielvelden
- [ ] `completedSections` wordt correct hersteld na login
- [ ] Profiel compleetheid toont juiste percentage
- [ ] Werkt op mobiel en desktop
- [ ] Werkt na wissen van local storage
- [ ] Bestaande sessies blijven werken

## Test Scenarios

| Scenario | Verwacht Resultaat |
|----------|-------------------|
| Nieuwe gebruiker login | Lege completedSections, 0% |
| Bestaande gebruiker login | Correcte completedSections, juist % |
| Local storage gewist | Data hersteld van DB |
| Gedeeltelijk profiel | Correcte secties als complete gemarkeerd |

## Relaties

| User Story | Impact |
|------------|--------|
| US-007 (Progressieve Registratie) | Fix is essentieel voor profiel tracking |
| US-002 (Profielvelden) | JKV/Borrel velden moeten geladen worden |
| US-003 (Dashboard) | Dashboard afhankelijk van correcte data |
