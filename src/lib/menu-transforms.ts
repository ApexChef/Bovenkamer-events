/**
 * File: src/lib/menu-transforms.ts
 * Purpose: Shared transformation functions for menu/shopping list data
 *
 * Relationships:
 * - Used by: All admin menu API routes
 * - Imports: Types from @/types
 *
 * Key Dependencies: None (pure transform functions)
 *
 * Design:
 * - Transforms snake_case database columns to camelCase TypeScript interfaces
 * - Handles type conversions (NUMERIC to number, etc.)
 * - Null-safe transformations
 */

import { MenuEvent, EventCourse, MenuItem } from '@/types';

/**
 * Transforms database event row to MenuEvent interface
 */
export function transformEvent(row: any): MenuEvent {
  return {
    id: row.id,
    name: row.name,
    eventType: row.event_type,
    eventDate: row.event_date,
    totalPersons: row.total_persons,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms database course row to EventCourse interface
 */
export function transformCourse(row: any): EventCourse {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    sortOrder: row.sort_order,
    gramsPerPerson: row.grams_per_person,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms database menu_item row to MenuItem interface
 */
export function transformMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    itemType: row.item_type,
    category: row.category,
    yieldPercentage: row.yield_percentage ? parseFloat(row.yield_percentage) : 100,
    wasteDescription: row.waste_description,
    unitWeightGrams: row.unit_weight_grams,
    unitLabel: row.unit_label,
    roundingGrams: row.rounding_grams,
    distributionPercentage: row.distribution_percentage
      ? parseFloat(row.distribution_percentage)
      : null,
    gramsPerPerson: row.grams_per_person,
    purchasedQuantity: row.purchased_quantity
      ? parseFloat(row.purchased_quantity)
      : null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
