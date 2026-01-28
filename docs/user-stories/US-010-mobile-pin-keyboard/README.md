---
id: US-010
title: Mobiel Toetsenbord voor PIN Invoer
status: done
priority: Medium
complexity: Low
type: Enhancement
pr: 20
created: 2026-01-19
updated: 2026-01-19
---

# US-010: Mobiel Toetsenbord voor PIN Invoer

## Beschrijving

### User Story
Als gebruiker wil ik op mobiele apparaten het juiste toetsenbord zien bij het invoeren van mijn PIN, zodat ik niet hoef te wisselen tussen letter- en cijfertoetsenbord.

### Context
De PIN code bestaat uit 4 karakters:
- **Eerste 2 karakters**: Letters (A-Z)
- **Laatste 2 karakters**: Cijfers (0-9)

Op mobiele apparaten toont het invoerveld momenteel altijd het standaard teksttoetsenbord. Dit betekent dat gebruikers bij het derde en vierde karakter handmatig moeten overschakelen naar het numerieke toetsenbord.

## Probleem

### Huidige Situatie
- Alle 4 PIN invoervelden gebruiken `type="text"`
- Mobiele browsers tonen standaard het alfabetische toetsenbord
- Gebruiker moet handmatig switchen naar numeriek toetsenbord voor laatste 2 cijfers
- Slechte mobiele UX, extra tikken nodig

### Reproductie Stappen
1. Open de login pagina op een mobiel apparaat
2. Tik op het eerste PIN invoerveld
3. Voer 2 letters in (OK - alfabetisch toetsenbord)
4. Tik op het derde invoerveld
5. Toetsenbord is nog steeds alfabetisch - moet handmatig gewisseld worden

## Oplossing

### Technische Aanpak
Gebruik het `inputMode` HTML attribuut om het juiste virtuele toetsenbord te tonen:

```tsx
// Eerste 2 velden (letters)
<input inputMode="text" ... />

// Laatste 2 velden (cijfers)
<input inputMode="numeric" ... />
```

### inputMode Waarden
| Waarde | Toetsenbord | Gebruik |
|--------|-------------|---------|
| `text` | Standaard alfabetisch | Letters (A-Z) |
| `numeric` | Numeriek (0-9) | Cijfers |

## Acceptatiecriteria

- [ ] Eerste 2 PIN velden tonen alfabetisch toetsenbord op mobiel
- [ ] Laatste 2 PIN velden tonen numeriek toetsenbord op mobiel
- [ ] Desktop gedrag blijft ongewijzigd
- [ ] Validatie blijft werken (letters/cijfers op juiste positie)
- [ ] Auto-focus naar volgende veld blijft werken

## Betrokken Componenten

| Component | Locatie | Wijziging |
|-----------|---------|-----------|
| PINInput | `/src/components/ui/PINInput.tsx` | `inputMode` toevoegen |

## Test Scenarios

| Scenario | Verwacht Resultaat |
|----------|-------------------|
| Login op iOS | Correcte toetsenborden per veld |
| Login op Android | Correcte toetsenborden per veld |
| Registratie op mobiel | Correcte toetsenborden per veld |
| Desktop browser | Geen visuele wijziging |

## Relaties

| User Story | Impact |
|------------|--------|
| Alle auth flows | Login, Register, Reset PIN gebruiken PINInput |

## Browser Support

`inputMode` wordt ondersteund door:
- iOS Safari 12.2+
- Chrome for Android 66+
- Samsung Internet 9.2+
- Firefox for Android 79+

Fallback: Standaard teksttoetsenbord (huidige gedrag)
