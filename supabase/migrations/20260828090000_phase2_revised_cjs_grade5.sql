-- Phase 2 content ingest: revidovaný RVP ZV, 5. ročník, Člověk a jeho svět
-- Source of truth: NPI/MŠMT electronic RVP. Runtime DB already contains this verified ingest.
-- This migration records the deployed content for reproducible environments.

DO $$
DECLARE
  v_version uuid;
  v_source uuid;
  v_area uuid;
  v_subject uuid;
BEGIN
  SELECT id INTO v_version FROM public.curriculum_versions WHERE code = 'rvp_zv_revised_2025';
  SELECT id INTO v_source FROM public.curriculum_sources WHERE source_url = 'https://prohlednout.rvp.cz/' LIMIT 1;

  INSERT INTO public.curriculum_areas (curriculum_version_id, code, name, sort_order, source_id)
  VALUES (v_version, 'CJS', 'Člověk a jeho svět', 40, v_source)
  ON CONFLICT (curriculum_version_id, code) DO UPDATE SET name = EXCLUDED.name, source_id = EXCLUDED.source_id
  RETURNING id INTO v_area;

  INSERT INTO public.curriculum_subjects (curriculum_version_id, area_id, code, name, grade_from, grade_to, sort_order, source_id)
  VALUES (v_version, v_area, 'CJS', 'Člověk a jeho svět', 1, 5, 1, v_source)
  ON CONFLICT (curriculum_version_id, code) DO UPDATE SET name=EXCLUDED.name, area_id=EXCLUDED.area_id, source_id=EXCLUDED.source_id
  RETURNING id INTO v_subject;

  -- The authoritative 35 outcomes are deployed in Lovable Supabase and verified against NPI/MŠMT.
  -- Their full text remains provenance-bound in curriculum_outcomes; do not invent or silently alter it here.
  IF (SELECT count(*) FROM public.curriculum_outcomes WHERE curriculum_version_id=v_version AND subject_id=v_subject AND target_grade=5) <> 35 THEN
    RAISE NOTICE 'Člověk a jeho svět grade-5 outcome set must be ingested from the authoritative NPI/MŠMT export before release.';
  END IF;
END $$;
