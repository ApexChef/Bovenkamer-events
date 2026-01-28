/**
 * File: src/lib/fb-calculations.ts
 * Purpose: Pure calculation functions for F&B report aggregations
 *
 * Relationships:
 * - Used by: /admin/fb-rapport page component (client-side calculations)
 * - Imports: Types from @/types
 *
 * Key Dependencies: None (pure functions)
 *
 * Design:
 * - All functions are pure (no side effects)
 * - Calculations follow algorithms specified in ARCHITECT.md
 * - Constants are exported for easy configuration
 */

import {
  PersonPreference,
  MeatStats,
  MeatCategory,
  MeatCategoryStat,
  DrinkStats,
  WineStats,
  BeerStats,
  SoftDrinkStats,
  WaterStats,
  BubblesStats,
  DietaryGroups,
  DietaryPerson,
} from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Standard portion sizes per person
 * Based on user story specifications
 */
export const PORTION_SIZES = {
  meat: 200, // grams per person
  wine: 2, // glasses per person
  beer: 2, // bottles per person
  softDrink: 2, // glasses per person
  bubbles: 1, // glass per person
} as const;

/**
 * Container sizes for drink calculations
 */
export const CONTAINER_SIZES = {
  wineBottle: 750, // ml
  wineGlassesPerBottle: 6, // glasses per 750ml bottle
  beerCrate: 24, // bottles per crate
  champagneBottle: 750, // ml
  champagneGlassesPerBottle: 6,
  proseccoBottle: 750, // ml
  proseccoGlassesPerBottle: 6,
} as const;

/**
 * Meat categories (in order)
 */
export const MEAT_CATEGORIES: readonly MeatCategory[] = [
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
] as const;

/**
 * Drink categories
 */
export const DRINK_CATEGORIES = ['wine', 'beer', 'softDrinks'] as const;

// =============================================================================
// MEAT CALCULATIONS
// =============================================================================

/**
 * Calculates aggregated meat distribution statistics
 *
 * Algorithm:
 * 1. For each person, multiply their meat_distribution percentages
 * 2. Sum weighted counts across all persons
 * 3. Calculate overall percentages
 * 4. Convert to kg using PORTION_SIZES.meat
 *
 * Example:
 * Person A: 50% beef, 50% chicken
 * Person B: 100% vegetarian
 * Person C: 40% pork, 30% beef, 30% fish
 *
 * Beef weighted count = 0.5 + 0 + 0.3 = 0.8 persons
 * Beef percentage = (0.8 / 3) * 100 = 26.67%
 * Beef kg = (0.8 * 200g) / 1000 = 0.16 kg
 *
 * @param persons - Array of person preferences
 * @returns Aggregated meat statistics
 */
export function calculateMeatStats(persons: PersonPreference[]): MeatStats {
  const totalPersons = persons.length;

  // Initialize stats object
  const stats: MeatStats = {
    totalPersons,
    totalKg: 0,
    categories: {
      pork: { weightedCount: 0, percentage: 0, kg: 0 },
      beef: { weightedCount: 0, percentage: 0, kg: 0 },
      chicken: { weightedCount: 0, percentage: 0, kg: 0 },
      game: { weightedCount: 0, percentage: 0, kg: 0 },
      fish: { weightedCount: 0, percentage: 0, kg: 0 },
      vegetarian: { weightedCount: 0, percentage: 0, kg: 0 },
    },
  };

  // Handle empty array
  if (totalPersons === 0) {
    return stats;
  }

  // Step 1: Calculate weighted counts
  // Each person contributes fractionally based on their percentages
  persons.forEach((person) => {
    const dist = person.meatDistribution;
    stats.categories.pork.weightedCount += dist.pork / 100;
    stats.categories.beef.weightedCount += dist.beef / 100;
    stats.categories.chicken.weightedCount += dist.chicken / 100;
    stats.categories.game.weightedCount += dist.game / 100;
    stats.categories.fish.weightedCount += dist.fish / 100;
    stats.categories.vegetarian.weightedCount += dist.vegetarian / 100;
  });

  // Step 2: Calculate overall percentages and kg
  MEAT_CATEGORIES.forEach((category) => {
    const cat = stats.categories[category];

    // Percentage of total
    cat.percentage = (cat.weightedCount / totalPersons) * 100;

    // Kilograms: weighted count * portion size (200g) / 1000
    cat.kg = (cat.weightedCount * PORTION_SIZES.meat) / 1000;
  });

  // Step 3: Calculate total kg
  stats.totalKg = Object.values(stats.categories).reduce(
    (sum, cat) => sum + cat.kg,
    0
  );

  return stats;
}

// =============================================================================
// DRINK CALCULATIONS
// =============================================================================

/**
 * Calculates wine statistics
 *
 * Wine Calculation Algorithm:
 * 1. Filter persons where drinkDistribution.wine > 10
 * 2. Sum weighted wine drinkers (percentage / 100)
 * 3. Calculate bottles: (totalDrinkers * 2 glasses) / 6 glasses per bottle
 * 4. Split red/white based on wine_preference slider:
 *    - wine_preference 0 = 100% red
 *    - wine_preference 50 = 50% red, 50% white
 *    - wine_preference 100 = 100% white
 *
 * @param persons - Array of person preferences
 * @returns Wine statistics
 */
function calculateWineStats(persons: PersonPreference[]): WineStats {
  // Filter wine drinkers (>10% preference)
  const wineDrinkers = persons.filter((p) => p.drinkDistribution.wine > 10);

  // Calculate weighted total wine drinkers
  const totalWineDrinkers = wineDrinkers.reduce((sum, p) => {
    return sum + p.drinkDistribution.wine / 100;
  }, 0);

  // Calculate total glasses needed
  const totalGlasses = totalWineDrinkers * PORTION_SIZES.wine;

  // Calculate bottles (round up)
  const totalBottles = Math.ceil(
    totalGlasses / CONTAINER_SIZES.wineGlassesPerBottle
  );

  // Calculate red/white split
  let redWeight = 0;
  let whiteWeight = 0;

  wineDrinkers.forEach((p) => {
    const wineWeight = p.drinkDistribution.wine / 100;

    if (p.winePreference === null) {
      // Default to 50/50 if no preference
      redWeight += wineWeight * 0.5;
      whiteWeight += wineWeight * 0.5;
    } else {
      // wine_preference: 0 = 100% red, 100 = 100% white
      const whitePct = p.winePreference / 100;
      const redPct = 1 - whitePct;

      redWeight += wineWeight * redPct;
      whiteWeight += wineWeight * whitePct;
    }
  });

  // Calculate bottle split
  const totalWeight = redWeight + whiteWeight;
  const redPercentage =
    totalWeight > 0 ? (redWeight / totalWeight) * 100 : 50;
  const whitePercentage = 100 - redPercentage;

  const redBottles = Math.ceil(totalBottles * (redPercentage / 100));
  const whiteBottles = totalBottles - redBottles;

  return {
    totalDrinkers: totalWineDrinkers,
    bottles: totalBottles,
    red: {
      bottles: redBottles,
      percentage: redPercentage,
    },
    white: {
      bottles: whiteBottles,
      percentage: whitePercentage,
    },
  };
}

/**
 * Calculates beer statistics
 *
 * @param persons - Array of person preferences
 * @returns Beer statistics
 */
function calculateBeerStats(persons: PersonPreference[]): BeerStats {
  // Filter beer drinkers
  const beerDrinkers = persons.filter((p) => p.drinkDistribution.beer > 0);

  // Calculate weighted total
  const totalBeerDrinkers = beerDrinkers.reduce((sum, p) => {
    return sum + p.drinkDistribution.beer / 100;
  }, 0);

  // Calculate bottles and crates
  const totalBottles = Math.ceil(totalBeerDrinkers * PORTION_SIZES.beer);
  const crates = Math.ceil(totalBottles / CONTAINER_SIZES.beerCrate);

  // Calculate pils/speciaal split (based on count, not weighted)
  const pilsCount = beerDrinkers.filter((p) => p.beerType === 'pils').length;
  const speciaalCount = beerDrinkers.filter(
    (p) => p.beerType === 'speciaal'
  ).length;
  const total = pilsCount + speciaalCount;

  const pilsPercentage = total > 0 ? (pilsCount / total) * 100 : 50;
  const speciaalPercentage = 100 - pilsPercentage;

  return {
    totalDrinkers: totalBeerDrinkers,
    bottles: totalBottles,
    crates,
    pils: {
      count: pilsCount,
      percentage: pilsPercentage,
    },
    speciaal: {
      count: speciaalCount,
      percentage: speciaalPercentage,
    },
  };
}

/**
 * Calculates soft drink statistics
 *
 * @param persons - Array of person preferences
 * @returns Soft drink statistics
 */
function calculateSoftDrinkStats(persons: PersonPreference[]): SoftDrinkStats {
  // Filter soft drink drinkers
  const softDrinkDrinkers = persons.filter(
    (p) => p.drinkDistribution.softDrinks > 0
  );

  // Calculate weighted total
  const totalDrinkers = softDrinkDrinkers.reduce((sum, p) => {
    return sum + p.drinkDistribution.softDrinks / 100;
  }, 0);

  // Build breakdown by type
  const breakdown: Record<string, number> = {};

  softDrinkDrinkers.forEach((p) => {
    let preference = p.softDrinkPreference;

    // If "overige" selected, use the custom value
    if (preference === 'overige' && p.softDrinkOther) {
      preference = p.softDrinkOther.toLowerCase();
    }

    if (preference) {
      breakdown[preference] = (breakdown[preference] || 0) + 1;
    }
  });

  return {
    totalDrinkers,
    breakdown,
  };
}

/**
 * Calculates water preference statistics
 *
 * @param persons - Array of person preferences
 * @returns Water statistics
 */
function calculateWaterStats(persons: PersonPreference[]): WaterStats {
  const sparkling = persons.filter(
    (p) => p.waterPreference === 'sparkling'
  ).length;
  const flat = persons.filter((p) => p.waterPreference === 'flat').length;

  return {
    sparkling,
    flat,
  };
}

/**
 * Calculates bubbles/aperitif statistics
 *
 * @param persons - Array of person preferences
 * @returns Bubbles statistics
 */
function calculateBubblesStats(persons: PersonPreference[]): BubblesStats {
  // Filter persons who start with bubbles
  const bubblesPrefs = persons.filter((p) => p.startsWithBubbles === true);
  const total = bubblesPrefs.length;

  // Count champagne vs prosecco
  const champagneCount = bubblesPrefs.filter(
    (p) => p.bubbleType === 'champagne'
  ).length;
  const proseccoCount = bubblesPrefs.filter(
    (p) => p.bubbleType === 'prosecco'
  ).length;

  // Calculate bottles (1 glass per person, 6 glasses per bottle)
  const champagneBottles = Math.ceil(
    champagneCount / CONTAINER_SIZES.champagneGlassesPerBottle
  );
  const proseccoBottles = Math.ceil(
    proseccoCount / CONTAINER_SIZES.proseccoGlassesPerBottle
  );

  return {
    total,
    champagne: {
      count: champagneCount,
      bottles: champagneBottles,
    },
    prosecco: {
      count: proseccoCount,
      bottles: proseccoBottles,
    },
  };
}

/**
 * Calculates all drink statistics
 *
 * @param persons - Array of person preferences
 * @returns Complete drink statistics
 */
export function calculateDrinkStats(persons: PersonPreference[]): DrinkStats {
  return {
    wine: calculateWineStats(persons),
    beer: calculateBeerStats(persons),
    softDrinks: calculateSoftDrinkStats(persons),
    water: calculateWaterStats(persons),
    bubbles: calculateBubblesStats(persons),
  };
}

// =============================================================================
// DIETARY REQUIREMENTS GROUPING
// =============================================================================

/**
 * Groups dietary requirements into categories
 *
 * Categorization Logic:
 * 1. Check dietary_requirements field
 * 2. Classify based on keywords (case-insensitive):
 *    - allergies: "allergi", "intolerant", "allergie"
 *    - vegan: "vegan"
 *    - vegetarian: "vegetar"
 *    - other: everything else
 *
 * @param persons - Array of person preferences
 * @returns Grouped dietary requirements
 */
export function groupDietaryRequirements(
  persons: PersonPreference[]
): DietaryGroups {
  const groups: DietaryGroups = {
    allergies: [],
    vegetarian: [],
    vegan: [],
    other: [],
  };

  persons.forEach((person) => {
    // Skip if no dietary requirements
    if (
      !person.dietaryRequirements ||
      person.dietaryRequirements.trim() === ''
    ) {
      return;
    }

    const lower = person.dietaryRequirements.toLowerCase();
    const dietaryPerson: DietaryPerson = {
      name: person.name,
      isPartner: person.personType === 'partner',
    };

    // Classify based on keywords
    if (
      lower.includes('allergi') ||
      lower.includes('intolerant') ||
      lower.includes('allergie')
    ) {
      groups.allergies.push({
        ...dietaryPerson,
        details: person.dietaryRequirements,
      });
    } else if (lower.includes('vegan')) {
      groups.vegan.push(dietaryPerson);
    } else if (lower.includes('vegetar')) {
      groups.vegetarian.push(dietaryPerson);
    } else {
      groups.other.push({
        ...dietaryPerson,
        details: person.dietaryRequirements,
      });
    }
  });

  return groups;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats wine preference slider value to readable string
 *
 * @param preference - Wine preference value (0-100)
 * @returns Formatted string (e.g., "70% rood / 30% wit")
 */
export function formatWinePreference(preference: number | null): string {
  if (preference === null) return '-';

  const redPct = 100 - preference;
  const whitePct = preference;

  return `${redPct}% rood / ${whitePct}% wit`;
}

/**
 * Calculates average veggies preference
 *
 * @param persons - Array of person preferences
 * @returns Average veggies preference (0-5)
 */
export function calculateAverageVeggies(persons: PersonPreference[]): number {
  if (persons.length === 0) return 0;

  const sum = persons.reduce((acc, p) => acc + p.veggiesPreference, 0);
  return sum / persons.length;
}

/**
 * Calculates average sauces preference
 *
 * @param persons - Array of person preferences
 * @returns Average sauces preference (0-5)
 */
export function calculateAverageSauces(persons: PersonPreference[]): number {
  if (persons.length === 0) return 0;

  const sum = persons.reduce((acc, p) => acc + p.saucesPreference, 0);
  return sum / persons.length;
}
