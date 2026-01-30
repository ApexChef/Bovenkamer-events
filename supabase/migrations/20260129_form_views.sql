-- Migration: Create form response view
-- Date: 2026-01-29
-- US-020: Dynamische Formulierelementen
--
-- Normalized view: one row per field answer with all metadata joined.
-- Usable for any form (filter on form_key).

CREATE OR REPLACE VIEW v_form_responses AS
SELECT
  fd.key                          AS form_key,
  fd.name                         AS form_name,
  fv.version_number,
  u.id                            AS user_id,
  u.name                          AS user_name,
  u.email                         AS user_email,
  fr.id                           AS response_id,
  fr.status,
  fr.submitted_at,
  fs.key                          AS section_key,
  fs.label                        AS section_label,
  fs.sort_order                   AS section_sort,
  ff.key                          AS field_key,
  ff.label                        AS field_label,
  ff.field_type,
  ff.is_required,
  ff.sort_order                   AS field_sort,
  ffr.text,
  ffr.number,
  ffr.boolean,
  ffr.json,
  ffr.participant_id,
  COALESCE(
    ffr.text,
    ffr.number::text,
    CASE WHEN ffr.boolean IS NOT NULL
      THEN CASE WHEN ffr.boolean THEN 'true' ELSE 'false' END
    END,
    ffr.participant_id::text,
    ffr.json::text
  )                               AS display_value,
  ffr.created_at                  AS answered_at,
  ffr.updated_at                  AS answer_updated_at
FROM form_response fr
JOIN users u              ON u.id  = fr.user_id
JOIN form_version fv      ON fv.id = fr.form_version_id
JOIN form_definition fd   ON fd.id = fv.form_definition_id
JOIN form_field_response ffr ON ffr.form_response_id = fr.id
JOIN form_field ff        ON ff.id = ffr.form_field_id
JOIN form_section fs      ON fs.id = ff.form_section_id
ORDER BY fd.key, u.name, fs.sort_order, ff.sort_order;

COMMENT ON VIEW v_form_responses IS 'Normalized form responses: one row per field answer with user, section, and field metadata. Filter on form_key.';

-- Grant read access
GRANT SELECT ON v_form_responses TO authenticated;
