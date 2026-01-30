-- Migration: Migrate prediction answers from registrations.predictions JSONB to form_field_response
-- Date: 2026-01-29
-- US-020: Dynamische Formulierelementen - Predictions data migration
--
-- Reads registrations.predictions (old JSONB column) and inserts into the
-- form_response / form_field_response tables for the 'predictions' form.
-- Uses ON CONFLICT to skip already-migrated data.

DO $$
DECLARE
  v_version_id  UUID := 'b0000000-0020-0001-0000-000000000001';
  v_user        RECORD;
  v_response_id UUID;
  v_field       RECORD;
  v_value       JSONB;
  v_key         TEXT;
  v_migrated    INT := 0;
  v_skipped     INT := 0;
BEGIN
  -- Loop through users with non-empty predictions
  FOR v_user IN
    SELECT r.user_id, r.predictions
    FROM registrations r
    WHERE r.predictions IS NOT NULL
      AND r.predictions != '{}'::jsonb
      AND jsonb_typeof(r.predictions) = 'object'
      AND (SELECT count(*) FROM jsonb_object_keys(r.predictions)) > 0
  LOOP
    -- Find or create form_response
    SELECT id INTO v_response_id
    FROM form_response
    WHERE user_id = v_user.user_id
      AND form_version_id = v_version_id;

    IF v_response_id IS NULL THEN
      INSERT INTO form_response (user_id, form_version_id, status)
      VALUES (v_user.user_id, v_version_id, 'submitted')
      RETURNING id INTO v_response_id;
    END IF;

    -- Loop through each prediction key/value
    FOR v_key, v_value IN
      SELECT key, value FROM jsonb_each(v_user.predictions)
    LOOP
      -- Find the matching form_field
      SELECT ff.id, ff.field_type INTO v_field
      FROM form_field ff
      JOIN form_section fs ON fs.id = ff.form_section_id
      WHERE fs.form_version_id = v_version_id
        AND ff.key = v_key;

      IF v_field.id IS NULL THEN
        RAISE NOTICE 'Skipping unknown field key: %', v_key;
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      -- Upsert into form_field_response based on field_type
      IF v_field.field_type IN ('slider', 'time', 'star_rating') THEN
        INSERT INTO form_field_response (form_response_id, form_field_id, number)
        VALUES (v_response_id, v_field.id, (v_value #>> '{}')::numeric)
        ON CONFLICT (form_response_id, form_field_id)
        DO UPDATE SET number = EXCLUDED.number, updated_at = NOW();
      ELSIF v_field.field_type = 'boolean' THEN
        INSERT INTO form_field_response (form_response_id, form_field_id, boolean)
        VALUES (v_response_id, v_field.id, (v_value #>> '{}')::boolean)
        ON CONFLICT (form_response_id, form_field_id)
        DO UPDATE SET boolean = EXCLUDED.boolean, updated_at = NOW();
      ELSIF v_field.field_type = 'select_participant' THEN
        INSERT INTO form_field_response (form_response_id, form_field_id, participant_id)
        VALUES (v_response_id, v_field.id, (v_value #>> '{}')::uuid)
        ON CONFLICT (form_response_id, form_field_id)
        DO UPDATE SET participant_id = EXCLUDED.participant_id, updated_at = NOW();
      ELSE
        INSERT INTO form_field_response (form_response_id, form_field_id, text)
        VALUES (v_response_id, v_field.id, v_value #>> '{}')
        ON CONFLICT (form_response_id, form_field_id)
        DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
      END IF;

      v_migrated := v_migrated + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Migration complete: % fields migrated, % skipped', v_migrated, v_skipped;
END $$;
