/**
 * File: src/lib/menu-calculations.ts
 * Purpose: Pure calculation functions for menu shopping list generation
 *
 * Relationships:
 * - Used by: /admin/menu page component (client-side calculations)
 * - Used by: /api/admin/shopping-list API endpoint
 * - Imports: Types from @/types
 *
 * Key Dependencies: None (pure functions)
 *
 * Design:
 * - All functions are pure (no side effects)
 * - Calculations follow algorithms specified in ARCHITECT-v2.md
 * - Constants are exported for easy configuration
 * - Clean separation from v1 F&B calculations (fb-calculations.ts)
 */

import {
  PersonPreference,
  MeatDistribution,
  MenuItem,
  EventCourseWithItems,
  ShoppingListItem,
  ShoppingListCourse,
  ShoppingList,
  MeatDistributionBreakdown,
} from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default rounding value for continuous items (grams)
 */
export const DEFAULT_ROUNDING_GRAMS = 100;

/**
 * Meat/protein category mapping
 * Maps to existing meat_distribution keys from food_drink_preferences
 */
export const PROTEIN_CATEGORIES = [
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
] as const;

/**
 * All valid categories for menu items
 */
export const MENU_ITEM_CATEGORIES = [
  // Protein categories (maps to meat_distribution)
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
  // Other categories
  'fruit',
  'vegetables',
  'salad',
  'bread',
  'sauce',
  'dairy',
  'other',
] as const;

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculates average meat distribution from food preferences
 * Uses existing v1 data from food_drink_preferences table
 *
 * Algorithm:
 * 1. Sum all meat_distribution percentages across all persons
 * 2. Divide by number of persons to get averages
 * 3. Return default distribution if no data available
 *
 * @param persons - Array of person preferences (from v1 API)
 * @returns Average percentage per category
 */
export function getAverageMeatDistribution(
  persons: PersonPreference[]
): MeatDistribution {
  if (persons.length === 0) {
    // Default distribution if no data
    return {
      pork: 20,
      beef: 20,
      chicken: 20,
      game: 10,
      fish: 15,
      vegetarian: 15,
    };
  }

  const totals: MeatDistribution = {
    pork: 0,
    beef: 0,
    chicken: 0,
    game: 0,
    fish: 0,
    vegetarian: 0,
  };

  // Sum all distributions
  persons.forEach((person) => {
    totals.pork += person.meatDistribution.pork;
    totals.beef += person.meatDistribution.beef;
    totals.chicken += person.meatDistribution.chicken;
    totals.game += person.meatDistribution.game;
    totals.fish += person.meatDistribution.fish;
    totals.vegetarian += person.meatDistribution.vegetarian;
  });

  // Calculate averages
  const count = persons.length;
  return {
    pork: totals.pork / count,
    beef: totals.beef / count,
    chicken: totals.chicken / count,
    game: totals.game / count,
    fish: totals.fish / count,
    vegetarian: totals.vegetarian / count,
  };
}

/**
 * Calculates surplus from received vs needed quantity
 */
function calculateSurplus(
  receivedQuantity: number | null,
  purchaseQuantity: number
): number | null {
  if (receivedQuantity === null) return null;
  return receivedQuantity - purchaseQuantity;
}

/**
 * Calculates purchase quantity for a protein menu item
 *
 * Algorithm:
 * 1. Calculate total edible grams for the course: persons × course.gramsPerPerson
 * 2. Calculate category budget: total × avgDistribution[category] / 100
 * 3. Calculate item share: categoryBudget × item.distributionPercentage / 100
 * 4. Calculate bruto: itemEdible / (item.yieldPercentage / 100)
 * 5. Round to purchase quantity:
 *    - If unitWeightGrams: ceil(bruto / unitWeight) × unitWeight
 *    - Else: ceil(bruto / roundingGrams) × roundingGrams
 *
 * @param menuItem - The protein menu item
 * @param totalCourseGrams - Total edible grams for the course
 * @param avgMeatDistribution - Average meat distribution percentages
 * @returns Shopping list item with calculations
 */
export function calculateProteinItem(
  menuItem: MenuItem,
  totalCourseGrams: number,
  avgMeatDistribution: MeatDistribution,
  receivedQuantity?: number | null
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'protein') {
    throw new Error('Item type must be protein');
  }
  if (!menuItem.category || !PROTEIN_CATEGORIES.includes(menuItem.category as any)) {
    throw new Error('Invalid protein category');
  }
  if (menuItem.distributionPercentage === null) {
    throw new Error('Distribution percentage required for protein items');
  }

  // Step 1: Get category percentage
  const categoryPct = avgMeatDistribution[menuItem.category as keyof MeatDistribution];

  // Step 2: Calculate category budget (grams)
  const categoryGrams = totalCourseGrams * (categoryPct / 100);

  // Step 3: Calculate item's share of category
  const itemEdibleGrams = categoryGrams * (menuItem.distributionPercentage / 100);

  // Step 4: Calculate bruto (account for waste/yield)
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 5: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    // Fixed unit (e.g., hamburgers)
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    // Continuous (e.g., meat by weight)
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  const rcvd = receivedQuantity ?? null;

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'protein',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    receivedQuantity: rcvd,
    surplus: calculateSurplus(rcvd, purchaseQuantity),
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      totalCourseGrams,
      categoryPercentage: categoryPct,
      categoryGrams,
      distributionPercentage: menuItem.distributionPercentage,
      itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}

/**
 * Calculates purchase quantity for a side menu item
 *
 * @param menuItem - The side menu item
 * @param totalCourseGrams - Total edible grams for the course
 * @param numberOfSides - Number of side items in the course
 * @returns Shopping list item with calculations
 */
export function calculateSideItem(
  menuItem: MenuItem,
  totalCourseGrams: number,
  numberOfSides: number,
  receivedQuantity?: number | null
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'side') {
    throw new Error('Item type must be side');
  }
  if (numberOfSides === 0) {
    throw new Error('Number of sides must be greater than 0');
  }

  // Step 1: Divide course total evenly
  const itemEdibleGrams = totalCourseGrams / numberOfSides;

  // Step 2: Calculate bruto
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 3: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  const rcvd = receivedQuantity ?? null;

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'side',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    receivedQuantity: rcvd,
    surplus: calculateSurplus(rcvd, purchaseQuantity),
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      totalCourseGrams,
      numberOfSides,
      perItemGrams: itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}

/**
 * Calculates purchase quantity for a fixed menu item
 *
 * @param menuItem - The fixed menu item
 * @param totalPersons - Total number of persons
 * @returns Shopping list item with calculations
 */
export function calculateFixedItem(
  menuItem: MenuItem,
  totalPersons: number,
  receivedQuantity?: number | null
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'fixed') {
    throw new Error('Item type must be fixed');
  }
  if (menuItem.gramsPerPerson === null) {
    throw new Error('Grams per person required for fixed items');
  }

  // Step 1: Calculate total edible
  const itemEdibleGrams = totalPersons * menuItem.gramsPerPerson;

  // Step 2: Calculate bruto
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 3: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  const rcvd = receivedQuantity ?? null;

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'fixed',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    receivedQuantity: rcvd,
    surplus: calculateSurplus(rcvd, purchaseQuantity),
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      gramsPerPerson: menuItem.gramsPerPerson,
      totalPersons,
      itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}

/**
 * Sums received and surplus totals for a list of shopping items.
 * Returns null if no items have receivedQuantity data.
 */
function sumReceivedAndSurplus(items: ShoppingListItem[]): {
  totalReceivedGrams: number | null;
  totalSurplusGrams: number | null;
} {
  const itemsWithData = items.filter((item) => item.receivedQuantity !== null);
  if (itemsWithData.length === 0) {
    return { totalReceivedGrams: null, totalSurplusGrams: null };
  }
  return {
    totalReceivedGrams: itemsWithData.reduce(
      (sum, item) => sum + (item.receivedQuantity ?? 0),
      0
    ),
    totalSurplusGrams: itemsWithData.reduce(
      (sum, item) => sum + (item.surplus ?? 0),
      0
    ),
  };
}

/**
 * Calculates shopping list for a single course
 *
 * @param course - The course with menu items
 * @param totalPersons - Total number of persons
 * @param avgMeatDistribution - Average meat distribution
 * @returns Shopping list for the course
 */
export function calculateCourseShoppingList(
  course: EventCourseWithItems,
  totalPersons: number,
  avgMeatDistribution: MeatDistribution,
  procurementMap?: Map<string, number>
): ShoppingListCourse {
  const totalCourseGrams = totalPersons * course.gramsPerPerson;

  // Count side items for even distribution
  const numberOfSides = course.menuItems.filter(
    (item) => item.itemType === 'side'
  ).length;

  // Calculate each menu item
  const items: ShoppingListItem[] = course.menuItems.map((menuItem) => {
    const rcvd = procurementMap?.get(menuItem.id) ?? null;

    switch (menuItem.itemType) {
      case 'protein':
        return calculateProteinItem(
          menuItem,
          totalCourseGrams,
          avgMeatDistribution,
          rcvd
        );

      case 'side':
        return calculateSideItem(
          menuItem,
          totalCourseGrams,
          numberOfSides,
          rcvd
        );

      case 'fixed':
        return calculateFixedItem(menuItem, totalPersons, rcvd);

      default:
        throw new Error(`Unknown item type: ${menuItem.itemType}`);
    }
  });

  // Calculate subtotals
  const { totalReceivedGrams, totalSurplusGrams } = sumReceivedAndSurplus(items);
  const subtotal = {
    totalEdibleGrams: items.reduce((sum, item) => sum + item.edibleGrams, 0),
    totalBrutoGrams: items.reduce((sum, item) => sum + item.brutoGrams, 0),
    totalPurchaseGrams: items.reduce((sum, item) => sum + item.purchaseQuantity, 0),
    totalReceivedGrams,
    totalSurplusGrams,
  };

  return {
    courseId: course.id,
    courseName: course.name,
    gramsPerPerson: course.gramsPerPerson,
    items,
    subtotal,
  };
}

/**
 * Calculates meat distribution breakdown for a protein course.
 * Shows per-category the percentage and kilograms needed.
 *
 * @param course - Course with items
 * @param totalPersons - Total persons
 * @param avgMeatDistribution - Average meat distribution percentages
 * @returns Breakdown per category, or null if no protein items
 */
export function calculateMeatDistributionBreakdown(
  course: EventCourseWithItems,
  totalPersons: number,
  avgMeatDistribution: MeatDistribution
): MeatDistributionBreakdown | null {
  const hasProteinItems = course.menuItems.some(
    (item) => item.itemType === 'protein'
  );
  if (!hasProteinItems) return null;

  const totalCourseGrams = totalPersons * course.gramsPerPerson;

  const categories = PROTEIN_CATEGORIES.map((category) => {
    const pct = avgMeatDistribution[category as keyof MeatDistribution];
    return {
      category,
      percentage: pct,
      gramsNeeded: totalCourseGrams * (pct / 100),
    };
  }).filter((c) => c.percentage > 0);

  return {
    courseId: course.id,
    courseName: course.name,
    totalCourseGrams,
    categories,
  };
}

/**
 * Calculates complete shopping list for an event
 *
 * @param courses - Event courses with menu items
 * @param totalPersons - Total number of persons
 * @param avgMeatDistribution - Average meat distribution
 * @returns Complete shopping list with all courses
 */
export function calculateShoppingList(
  courses: EventCourseWithItems[],
  totalPersons: number,
  avgMeatDistribution: MeatDistribution,
  procurementMap?: Map<string, number>
): ShoppingList {
  // Calculate each course
  const courseShoppingLists = courses.map((course) =>
    calculateCourseShoppingList(course, totalPersons, avgMeatDistribution, procurementMap)
  );

  // Aggregate received/surplus across all courses
  const allItems = courseShoppingLists.flatMap((c) => c.items);
  const { totalReceivedGrams, totalSurplusGrams } = sumReceivedAndSurplus(allItems);

  // Calculate grand total
  const grandTotal = {
    totalEdibleGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalEdibleGrams,
      0
    ),
    totalBrutoGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalBrutoGrams,
      0
    ),
    totalPurchaseGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalPurchaseGrams,
      0
    ),
    totalReceivedGrams,
    totalSurplusGrams,
  };

  return {
    courses: courseShoppingLists,
    grandTotal,
  };
}
