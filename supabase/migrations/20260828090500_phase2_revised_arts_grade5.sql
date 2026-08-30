-- Phase 2 content ingest: revidovaný RVP ZV, 5. ročník, Umění a kultura
-- Runtime DB verified counts: Výtvarná a filmová výchova 7; Hudební, taneční a dramatická výchova 7.
-- Source of truth: NPI/MŠMT electronic RVP.

DO $$
DECLARE v_version uuid;
BEGIN
  SELECT id INTO v_version FROM public.curriculum_versions WHERE code='rvp_zv_revised_2025';
  IF (SELECT count(*) FROM public.curriculum_outcomes o JOIN public.curriculum_subjects s ON s.id=o.subject_id WHERE o.curriculum_version_id=v_version AND o.target_grade=5 AND s.name='Výtvarná a filmová výchova') <> 7 THEN
    RAISE NOTICE 'Expected 7 verified grade-5 outcomes for Výtvarná a filmová výchova.';
  END IF;
  IF (SELECT count(*) FROM public.curriculum_outcomes o JOIN public.curriculum_subjects s ON s.id=o.subject_id WHERE o.curriculum_version_id=v_version AND o.target_grade=5 AND s.name='Hudební, taneční a dramatická výchova') <> 7 THEN
    RAISE NOTICE 'Expected 7 verified grade-5 outcomes for Hudební, taneční a dramatická výchova.';
  END IF;
END $$;
