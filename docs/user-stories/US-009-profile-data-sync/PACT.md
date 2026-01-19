# US-009: PACT - Profiel Data Sync bij Login

## PACT Fase: Prepare

### 1. Probleemanalyse

#### Symptoom
Profiel laadt niet correct na login op mobiel en desktop wanneer local storage is gewist.

#### Root Cause
De login API (`/api/auth/login/route.ts`) haalt niet alle profielvelden op en de client (`/login/page.tsx`) herstelt `completedSections` niet.

#### Impactgebieden
| Component | Probleem |
|-----------|----------|
| Login API | SELECT mist 6+ velden |
| Login Handler | Geen restore van completedSections |
| Zustand Store | completedSections blijft leeg |
| Dashboard | Toont 0% completion |
| ProfileTab | Secties tonen geen badges |

### 2. Code Analyse

#### 2.1 Login API (`/src/app/api/auth/login/route.ts`)

**Huidige Query (regel 284-288):**
```typescript
const { data: registration } = await supabase
  .from('registrations')
  .select('ai_assignment, birth_year, has_partner, partner_name,
           dietary_requirements, primary_skill, additional_skills,
           music_decade, music_genre, quiz_answers')
  .eq('user_id', user.id)
  .single();
```

**Ontbrekende velden die WEL in database staan:**
| Veld | DB Kolom | Sectie |
|------|----------|--------|
| jkvJoinYear | `jkv_join_year` | JKV Historie |
| jkvExitYear | `jkv_exit_year` | JKV Historie |
| bovenkamerJoinYear | `bovenkamer_join_year` | JKV Historie |
| borrelCount2025 | `borrel_count_2025` | Borrel Stats |
| borrelPlanning2026 | `borrel_planning_2026` | Borrel Stats |
| skills | `skills` (JSONB) | Skills* |

*Opmerking: `primary_skill` en `additional_skills` worden geladen, maar `skills` (het volledige JSONB object) niet.

#### 2.2 Login Handler (`/src/app/login/page.tsx`)

**Huidige Restore (regel 108-138):**
```typescript
if (data.registration) {
  setFormData({
    email: data.user.email,
    name: data.user.name,
    birthYear: data.registration.birthYear,
    hasPartner: data.registration.hasPartner,
    // ... andere velden
  });
  // ...
}
setComplete(true);
```

**Problemen:**
1. Geen `setCompletedSection()` calls
2. JKV Historie velden niet gemapt
3. Borrel Stats velden niet gemapt
4. `skills` JSONB niet correct gemapt (mist volledige object)

#### 2.3 Zustand Store (`/src/lib/store.ts`)

**CompletedSections structuur:**
```typescript
completedSections: {
  basic: boolean;      // Naam, email (altijd true na login)
  personal: boolean;   // Geboortejaar, partner
  skills: boolean;     // 8 skill categorieën
  music: boolean;      // Decennium, genre
  jkvHistorie: boolean; // JKV jaren
  borrelStats: boolean; // Borrel data
  quiz: boolean;       // Fun quiz
}
```

**Probleem:** `completedSections` wordt nooit gezet na login, blijft op initial state (alle false).

### 3. Database Schema Verificatie

Gebaseerd op `/src/app/api/registration/route.ts` worden deze velden opgeslagen:
```typescript
const registrationData = {
  user_id: userId,
  birth_year: formData.birthYear,
  has_partner: formData.hasPartner,
  partner_name: formData.partnerName || null,
  dietary_requirements: formData.dietaryRequirements || null,
  skills: formData.skills,                    // JSONB - 8 categorieën
  additional_skills: formData.additionalSkills || null,
  music_decade: formData.musicDecade,
  music_genre: formData.musicGenre,
  jkv_join_year: formData.jkvJoinYear || null,
  jkv_exit_year: formData.jkvExitYear || null,
  bovenkamer_join_year: formData.bovenkamerJoinYear || null,
  borrel_count_2025: formData.borrelCount2025 || 0,
  borrel_planning_2026: formData.borrelPlanning2026 || 0,
  quiz_answers: formData.quizAnswers,
  ai_assignment: aiAssignment,
};
```

Al deze velden bestaan in de database maar worden niet allemaal opgehaald bij login.

### 4. Oplossingsontwerp

#### 4.1 Aanpak: Afleiden uit Data (Geen DB Wijziging)

**Voordelen:**
- Geen database migratie nodig
- Backwards compatible
- Sneller te implementeren

**Nadelen:**
- Meer client-side logica
- Kans op desync als logica wijzigt

#### 4.2 Implementatie Stappen

**Stap 1: Login API uitbreiden**

Bestand: `/src/app/api/auth/login/route.ts`

Wijzig SELECT query om alle velden op te halen:
```typescript
.select(`
  ai_assignment,
  birth_year,
  has_partner,
  partner_name,
  dietary_requirements,
  skills,
  additional_skills,
  music_decade,
  music_genre,
  quiz_answers,
  jkv_join_year,
  jkv_exit_year,
  bovenkamer_join_year,
  borrel_count_2025,
  borrel_planning_2026
`)
```

Wijzig response om alle velden te returnen:
```typescript
registration: registration ? {
  aiAssignment: registration.ai_assignment,
  birthYear: registration.birth_year,
  hasPartner: registration.has_partner,
  partnerName: registration.partner_name,
  dietaryRequirements: registration.dietary_requirements,
  skills: registration.skills,
  additionalSkills: registration.additional_skills,
  musicDecade: registration.music_decade,
  musicGenre: registration.music_genre,
  quizAnswers: registration.quiz_answers,
  // Nieuwe velden:
  jkvJoinYear: registration.jkv_join_year,
  jkvExitYear: registration.jkv_exit_year,
  bovenkamerJoinYear: registration.bovenkamer_join_year,
  borrelCount2025: registration.borrel_count_2025,
  borrelPlanning2026: registration.borrel_planning_2026,
} : null,
```

**Stap 2: Login Handler uitbreiden**

Bestand: `/src/app/login/page.tsx`

Voeg alle velden toe aan `setFormData()`:
```typescript
setFormData({
  email: data.user.email,
  name: data.user.name,
  birthYear: data.registration.birthYear,
  hasPartner: data.registration.hasPartner,
  partnerName: data.registration.partnerName || '',
  dietaryRequirements: data.registration.dietaryRequirements || '',
  skills: data.registration.skills || { /* defaults */ },
  additionalSkills: data.registration.additionalSkills || '',
  musicDecade: data.registration.musicDecade || '',
  musicGenre: data.registration.musicGenre || '',
  quizAnswers: data.registration.quizAnswers || {},
  // Nieuwe velden:
  jkvJoinYear: data.registration.jkvJoinYear || null,
  jkvExitYear: data.registration.jkvExitYear || null,
  bovenkamerJoinYear: data.registration.bovenkamerJoinYear || null,
  borrelCount2025: data.registration.borrelCount2025 || 0,
  borrelPlanning2026: data.registration.borrelPlanning2026 || 0,
});
```

**Stap 3: CompletedSections afleiden**

Voeg helper functie toe of inline logica:
```typescript
// Na setFormData, bepaal completedSections
const reg = data.registration;

// basic is altijd true als ingelogd
setCompletedSection('basic', true);

// personal: check of birthYear aanwezig is
if (reg.birthYear) {
  setCompletedSection('personal', true);
}

// skills: check of skills object filled is
if (reg.skills && Object.values(reg.skills).some(v => v !== '')) {
  setCompletedSection('skills', true);
}

// music: check of decennium of genre aanwezig
if (reg.musicDecade || reg.musicGenre) {
  setCompletedSection('music', true);
}

// jkvHistorie: check of een van de jaren aanwezig
if (reg.jkvJoinYear || reg.jkvExitYear || reg.bovenkamerJoinYear) {
  setCompletedSection('jkvHistorie', true);
}

// borrelStats: check of borrel data aanwezig
if (reg.borrelCount2025 > 0 || reg.borrelPlanning2026 > 0) {
  setCompletedSection('borrelStats', true);
}

// quiz: check of quizAnswers niet leeg
if (reg.quizAnswers && Object.keys(reg.quizAnswers).length > 0) {
  setCompletedSection('quiz', true);
}
```

### 5. Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `/src/app/api/auth/login/route.ts` | SELECT query + response mapping |
| `/src/app/login/page.tsx` | setFormData + setCompletedSection calls |
| (optioneel) `/src/lib/store.ts` | Evt. helper voor batch section update |

### 6. Test Scenarios

| # | Scenario | Stappen | Verwacht |
|---|----------|---------|----------|
| 1 | Nieuwe user login | Registreer → Login | 0% completion, basic=true |
| 2 | Volledige user, cleared storage | Login na clear | Alle secties hersteld |
| 3 | Gedeeltelijk profiel | Login | Alleen gevulde secties = true |
| 4 | Mobiel + Desktop | Test beide | Identiek gedrag |
| 5 | Bestaande sessie | Niet clearen | Geen regressie |

### 7. Risico's

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Logica desync met registration form | Medium | Unit tests voor section detection |
| Performance bij veel velden | Laag | Alle velden in één query |
| Backwards compatibility | Laag | Fallback defaults in place |

### 8. Volgende PACT Fase: Architecture

Geen architectuur wijzigingen nodig - dit is een bug fix binnen bestaande structuur.

Direct naar **Code** fase:
1. Wijzig login API
2. Wijzig login handler
3. Test alle scenarios
4. PR aanmaken

---

*Prepare fase voltooid: 2026-01-18*
