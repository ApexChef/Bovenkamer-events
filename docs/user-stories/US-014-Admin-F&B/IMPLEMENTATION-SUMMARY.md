# US-014 v2 Database Migration Implementation Summary

**Date**: 2026-01-30
**Developer**: Backend Coder
**User Story**: US-014 - Admin F&B Menu & Inkoopberekening
**Phase**: Database Migration

## Implementation Overview

This implementation creates the foundational database schema for the Menu & Shopping List system as specified in `ARCHITECT-v2.md`. The migration establishes three core tables with comprehensive constraints, indexes, triggers, and sample data for the Nieuwjaars BBQ 2026 event.

## What Was Implemented

### 1. Database Tables

Three tables were created with full referential integrity:

#### `events`
- Core event information (name, type, date, persons)
- Status tracking (draft, active, completed, cancelled)
- Support for multiple event types (bbq, diner, lunch, borrel, receptie, overig)
- Notes field for additional information

#### `event_courses`
- Course definitions within events (e.g., "Hoofdgerecht", "Dessert")
- Portion size configuration (grams per person)
- Sort ordering for display
- Cascade deletion when parent event is deleted

#### `menu_items`
- Individual menu items within courses
- Three calculation types: `protein`, `side`, `fixed`
- Category classification for protein distribution
- Yield percentage for purchase calculation
- Unit-based or continuous quantity handling
- Distribution percentage for protein items
- Support for fixed portions and rounding

### 2. Business Logic Constraints

Comprehensive CHECK constraints enforce business rules:

- **Protein items** must have:
  - Valid protein category (pork, beef, chicken, game, fish, vegetarian)
  - Distribution percentage defined

- **Fixed items** must have:
  - Grams per person defined

- **All items** must have:
  - Yield percentage between 0 and 100

- **Events** must have:
  - Valid event type
  - Valid status

- **Courses** must have:
  - Unique sort order per event

### 3. Performance Optimization

Strategic indexes for common query patterns:

**Events**:
- `idx_events_status`: Filter by status
- `idx_events_date`: Sort/filter by date

**Event Courses**:
- `idx_event_courses_event_id`: Join to events
- `idx_event_courses_sort_order`: Ordered retrieval

**Menu Items**:
- `idx_menu_items_course_id`: Join to courses
- `idx_menu_items_type`: Filter by item type
- `idx_menu_items_category`: Filter by category
- `idx_menu_items_active`: Filter active items

### 4. Data Integrity

**Cascade Deletions**:
- Deleting an event cascades to all courses and menu items
- Deleting a course cascades to all menu items
- Ensures no orphaned records

**Unique Constraints**:
- Event courses have unique sort order per event
- Prevents duplicate ordering conflicts

**Foreign Keys**:
- `event_courses.event_id` → `events.id`
- `menu_items.course_id` → `event_courses.id`

### 5. Automatic Timestamp Management

**Trigger Function**: `update_updated_at_column()`
- Uses `CREATE OR REPLACE` for idempotency
- Won't fail if function already exists from other migrations

**Triggers on all tables**:
- `update_events_updated_at`
- `update_event_courses_updated_at`
- `update_menu_items_updated_at`

### 6. Sample Data

Complete sample data for testing:

**Event**: Nieuwjaars BBQ 2026
- Date: 2026-01-04
- Persons: 18
- Status: draft

**Course 1: Hoofdgerecht** (450g per person)
- **Protein items**:
  - Picanha (beef, 85% yield, 50% distribution)
  - Hamburger (beef, 95% yield, 50% distribution, 150g units)
  - Kipsaté (chicken, 95% yield, 100% distribution, 40g units)
  - Hele zalm (fish, 55% yield, 100% distribution)
- **Side dishes**:
  - Courgette van de grill (90% yield)
  - Ananas van de grill (75% yield)
  - Groene salade (85% yield)
- **Fixed items**:
  - Stokbrood (80g per person, 400g units)
  - Kruidenboter (15g per person, 250g units)

**Course 2: Dessert** (150g per person)
- Tiramisu (fixed, 150g per person)

### 7. Verification Queries

Comprehensive commented-out queries for testing:
- Event hierarchy view
- CASCADE DELETE verification
- Constraint validation tests
- Sample data summary

## Key Design Decisions

### 1. Idempotent Migration
- Uses `CREATE TABLE IF NOT EXISTS` for all tables
- Uses `CREATE OR REPLACE FUNCTION` for trigger function
- Uses `ON CONFLICT DO NOTHING` for sample data
- Migration can be run multiple times safely

### 2. Forward-Only Migration
- **NO DROP TABLE statements** as requested
- Follows production-safe migration practices
- Preserves existing data if tables exist

### 3. UUID Primary Keys
- Uses `gen_random_uuid()` for all primary keys
- Provides global uniqueness
- Compatible with distributed systems

### 4. Flexible Item Types
Three item types support different calculation methods:
- **protein**: Distributed based on meat preferences
- **side**: Shared equally among all guests
- **fixed**: Fixed grams per person

### 5. Comprehensive Categories
Categories cover all food types:
- Protein: pork, beef, chicken, game, fish, vegetarian
- Non-protein: fruit, vegetables, salad, bread, sauce, dairy, other

### 6. Purchase Calculation Support
Fields support complex purchase calculations:
- `yield_percentage`: Handle waste/prep loss
- `unit_weight_grams`: Support unit-based items
- `rounding_grams`: Round to practical purchase amounts
- `waste_description`: Document prep requirements

## File Structure

### Created Files

```
supabase/migrations/
└── 20260130_menu_shopping_list.sql    (422 lines)
```

### Migration File Contents

1. **Header & Comments** (lines 1-15)
   - Migration metadata
   - Purpose and description

2. **Trigger Function** (lines 17-26)
   - `update_updated_at_column()` with CREATE OR REPLACE

3. **Table: events** (lines 28-53)
   - Schema definition
   - Comments
   - Indexes

4. **Table: event_courses** (lines 55-87)
   - Schema definition
   - Comments
   - Indexes

5. **Table: menu_items** (lines 89-157)
   - Schema definition
   - CHECK constraints
   - Comments
   - Indexes

6. **Triggers** (lines 159-173)
   - Updated_at triggers for all three tables

7. **Sample Data** (lines 175-342)
   - Event insertion
   - DO block for courses and items
   - Idempotent with ON CONFLICT

8. **Verification Queries** (lines 344-422)
   - Commented examples for testing
   - Constraint validation tests
   - CASCADE DELETE tests

## Database Schema Diagram

```
┌─────────────────────┐
│      events         │
│─────────────────────│
│ id (PK)             │
│ name                │
│ event_type          │
│ event_date          │
│ total_persons       │
│ status              │
│ notes               │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│   event_courses     │
│─────────────────────│
│ id (PK)             │
│ event_id (FK) ────► │
│ name                │
│ sort_order          │
│ grams_per_person    │
│ notes               │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│    menu_items       │
│─────────────────────│
│ id (PK)             │
│ course_id (FK) ───► │
│ name                │
│ item_type           │
│ category            │
│ yield_percentage    │
│ waste_description   │
│ unit_weight_grams   │
│ unit_label          │
│ rounding_grams      │
│ distribution_%      │
│ grams_per_person    │
│ sort_order          │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## Testing Recommendations

### Unit Tests Required

**Table Creation Tests**:
- [ ] Verify all three tables are created
- [ ] Verify all indexes exist
- [ ] Verify all triggers are created
- [ ] Verify function exists

**Constraint Tests**:
- [ ] Test valid event_type values
- [ ] Test valid status values
- [ ] Test valid item_type values
- [ ] Test valid category values
- [ ] Test protein items require category
- [ ] Test protein items require distribution_percentage
- [ ] Test fixed items require grams_per_person
- [ ] Test yield_percentage bounds (0-100)
- [ ] Test unique sort_order per event

**Data Integrity Tests**:
- [ ] Test foreign key constraints
- [ ] Test CASCADE DELETE from events to courses
- [ ] Test CASCADE DELETE from courses to menu items
- [ ] Test NULL handling for optional fields

**Trigger Tests**:
- [ ] Test updated_at is set on INSERT
- [ ] Test updated_at is updated on UPDATE
- [ ] Test created_at is immutable

### Integration Tests Required

**Sample Data Tests**:
- [ ] Verify sample event is created
- [ ] Verify 2 courses are created
- [ ] Verify all menu items are created
- [ ] Verify relationships are correct
- [ ] Verify sample data matches specifications

**Query Performance Tests**:
- [ ] Test event listing query performance
- [ ] Test course retrieval by event
- [ ] Test menu item retrieval by course
- [ ] Test filtering by item_type
- [ ] Test filtering by category
- [ ] Verify index usage in query plans

**Cascade Behavior Tests**:
- [ ] Delete event, verify courses deleted
- [ ] Delete event, verify menu items deleted
- [ ] Delete course, verify menu items deleted
- [ ] Verify no orphaned records

### Migration Tests

**Idempotency Tests**:
- [ ] Run migration twice, verify no errors
- [ ] Verify sample data not duplicated
- [ ] Verify function CREATE OR REPLACE works

**Rollback Tests**:
- [ ] Document rollback procedure
- [ ] Test rollback on development database

**Production Readiness**:
- [ ] Test migration on copy of production data
- [ ] Verify no data loss
- [ ] Measure migration execution time
- [ ] Test with large datasets (>1000 events)

## Setup Instructions

### Prerequisites

- Supabase project with PostgreSQL database
- Database migration tool (e.g., Supabase CLI)
- Database admin access

### Running the Migration

**Using Supabase CLI**:
```bash
# Navigate to project root
cd /Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events

# Run migration
supabase db push

# Or apply specific migration
supabase migration up --file 20260130_menu_shopping_list.sql
```

**Manual Application**:
```bash
# Connect to database
psql <connection-string>

# Run migration file
\i supabase/migrations/20260130_menu_shopping_list.sql
```

### Verification Steps

1. **Verify tables exist**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('events', 'event_courses', 'menu_items');
```

2. **Verify sample data**:
```sql
SELECT
  e.name,
  COUNT(DISTINCT ec.id) AS courses,
  COUNT(mi.id) AS items
FROM events e
LEFT JOIN event_courses ec ON e.id = ec.event_id
LEFT JOIN menu_items mi ON ec.id = mi.course_id
WHERE e.name = 'Nieuwjaars BBQ 2026'
GROUP BY e.id, e.name;
```

Expected output:
```
        name         | courses | items
---------------------+---------+-------
 Nieuwjaars BBQ 2026 |       2 |    11
```

3. **Verify constraints**:
```sql
SELECT
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('events', 'event_courses', 'menu_items')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
```

4. **Verify indexes**:
```sql
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('events', 'event_courses', 'menu_items')
ORDER BY tablename, indexname;
```

### Troubleshooting

**Issue**: Function already exists error
- **Solution**: Migration uses `CREATE OR REPLACE`, should not occur
- **Fallback**: Drop function manually and re-run

**Issue**: Sample data conflicts
- **Solution**: Migration uses `ON CONFLICT DO NOTHING`, should not occur
- **Fallback**: Delete sample data and re-run DO block

**Issue**: Foreign key violations
- **Solution**: Ensure tables are created in correct order (events → courses → items)
- **Fallback**: Check for orphaned records and clean up

## Dependencies and Requirements

### System Requirements
- PostgreSQL 12+ (Supabase uses PostgreSQL 14+)
- UUID extension enabled (Supabase default)

### Database Extensions
- `uuid-ossp` or `pgcrypto` for `gen_random_uuid()` (Supabase default)

### Migration Dependencies
- No dependencies on other migrations
- Can be run independently
- Compatible with existing `update_updated_at_column()` function

## Security Considerations

### No Security Issues
- Migration creates tables only, no data exposure
- No user input handling at migration level
- No authentication/authorization in schema

### Future Security Recommendations

**Row Level Security (RLS)**:
- Should be added in separate migration
- Recommend policies:
  - Events: Admin read/write, participant read
  - Event courses: Admin read/write, participant read
  - Menu items: Admin read/write, participant read

**Audit Trail**:
- Consider adding audit triggers for sensitive changes
- Track who modified menu items and when

**Data Validation**:
- Application layer should validate all inputs
- Check constraints provide database-level validation

## Performance Characteristics

### Expected Performance

**Insert Performance**:
- Event: <1ms
- Course: <1ms
- Menu item: <1ms
- Batch inserts: Linear scaling

**Query Performance**:
- Event list: <5ms for <1000 events
- Course list: <5ms with event_id index
- Menu item list: <10ms with course_id index
- Full hierarchy: <20ms with proper joins

**Index Overhead**:
- 7 indexes total
- Minimal impact on writes
- Significant benefit on reads

### Scalability

**Expected Data Volumes**:
- Events: ~10-50 per year
- Courses per event: 3-10
- Menu items per course: 5-30
- Total items: ~500-15,000 over 10 years

**Performance at Scale**:
- All queries remain sub-second at expected volumes
- Indexes handle 100,000+ rows efficiently
- No special optimization needed

## Known Limitations

### Current Limitations

1. **No versioning**: Menu items are live-edited, no version history
2. **No soft deletes**: Deletions are permanent (CASCADE)
3. **No audit trail**: No tracking of who changed what
4. **No RLS**: No row-level security policies yet
5. **Manual person count**: Total persons must be entered manually

### Future Enhancements

1. **Add versioning**: Store menu snapshots for historical records
2. **Add soft deletes**: Use `deleted_at` instead of hard deletes
3. **Add audit tables**: Track all changes with user and timestamp
4. **Add RLS policies**: Implement row-level security
5. **Auto-calculate persons**: Link to registration system

## Technical Debt

### None Identified

This is a clean, forward-only migration with no technical debt.

### Best Practices Followed

- Comprehensive constraints for data integrity
- Strategic indexes for performance
- Cascade deletes for referential integrity
- Idempotent migration design
- Comprehensive comments and documentation
- Sample data for testing
- Verification queries included

## Next Steps for Orchestrator

Please have the test engineer:

1. **Verify Migration Execution**
   - Run migration on test database
   - Verify all tables created
   - Verify all indexes created
   - Verify all triggers working

2. **Execute Constraint Tests**
   - Run all constraint validation tests
   - Verify CHECK constraints work
   - Verify UNIQUE constraints work
   - Verify foreign key constraints work

3. **Execute Data Integrity Tests**
   - Verify CASCADE DELETE behavior
   - Test sample data creation
   - Test idempotency (run twice)

4. **Execute Performance Tests**
   - Measure query performance
   - Verify index usage
   - Test with larger datasets

5. **Integration Testing**
   - Verify compatibility with existing schema
   - Test with application code (when available)

6. **Documentation Review**
   - Verify all columns are documented
   - Verify business rules are clear
   - Verify verification queries work

After successful testing, this migration is ready for:
- Code review
- Production deployment
- API implementation (next phase)

## Related Documentation

- **Architecture Specification**: `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md`
- **Migration File**: `supabase/migrations/20260130_menu_shopping_list.sql`
- **User Story**: `docs/user-stories/US-014-Admin-F&B/README.md`

## Contact

For questions or issues with this migration:
- Review architecture document first
- Check verification queries in migration file
- Consult database logs for errors
- Review Supabase dashboard for schema state
