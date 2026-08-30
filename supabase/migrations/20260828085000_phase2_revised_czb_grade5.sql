-- MOJE TŘÍDA — PHASE 2
-- Revidovaný RVP ZV — Člověk, zdraví a bezpečí, 5. ročník
-- Zdroj: https://prohlednout.rvp.cz/zakladni-vzdelavani/vzdelavaci-oblasti/czb

begin;

do $$
declare
  v_version uuid;
  v_source uuid;
  v_area uuid;
  v_subject uuid;
  v_topic_1 uuid;
  v_topic_2 uuid;
begin
  select id into v_version from public.curriculum_versions where code = 'rvp_zv_revised_2025';
  select id into v_source from public.curriculum_sources where source_url = 'https://prohlednout.rvp.cz/';

  insert into public.curriculum_areas(curriculum_version_id, code, name, sort_order, source_id)
  values (v_version, 'CZB', 'Člověk, zdraví a bezpečí', 9, v_source)
  on conflict (curriculum_version_id, code) do update set name = excluded.name
  returning id into v_area;

  insert into public.curriculum_subjects(curriculum_version_id, area_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version, v_area, 'CZB-TEV', 'Tělesná výchova', 1, 9, 1, v_source)
  on conflict (curriculum_version_id, code) do update set name = excluded.name, area_id = excluded.area_id
  returning id into v_subject;

  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version, v_subject, 'CZB-TEV-001', 'Činnosti ovlivňující pohybové učení a zdraví', 1, 9, 1, v_source)
  on conflict (subject_id, parent_topic_id, name) do update set code = excluded.code
  returning id into v_topic_1;

  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version, v_subject, 'CZB-TEV-002', 'Činnosti podporující pohybové učení', 1, 9, 2, v_source)
  on conflict (subject_id, parent_topic_id, name) do update set code = excluded.code
  returning id into v_topic_2;

  insert into public.curriculum_outcomes(curriculum_version_id, subject_id, topic_id, official_code, title, target_grade, period_label, origin, source_id, source_locator, sort_order)
  values
    (v_version,v_subject,v_topic_1,'CZB-TEV-001-ZV5-001','Zvládá v souladu s individuálními možnostmi osvojované pohybové dovednosti a uplatňuje je v individuálních a týmových pohybových činnostech.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',1),
    (v_version,v_subject,v_topic_1,'CZB-TEV-001-ZV5-002','Tvoří podle zadání, své fantazie, hudebního či rytmického doprovodu varianty jednoduchých pohybových dovedností.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',2),
    (v_version,v_subject,v_topic_1,'CZB-TEV-001-ZV5-003','Uplatňuje osvojované postupy vedoucí k rozvoji tělesné zdatnosti, k duševní a sociální pohodě, k pozitivnímu naladění, k překonávání námahy a obtíží spojených s tělesnou zátěží.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',3),
    (v_version,v_subject,v_topic_1,'CZB-TEV-001-ZV5-004','Zapojuje se do organizace svého pohybového režimu, plánuje své pohybové činnosti a jejich konkrétní realizaci.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',4),
    (v_version,v_subject,v_topic_1,'CZB-TEV-001-ZV5-005','Uplatňuje základní zásady hygieny a bezpečnosti při pohybových činnostech, svým jednáním předchází nebezpečným situacím a při jejich vzniku adekvátně reaguje.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',5),
    (v_version,v_subject,v_topic_2,'CZB-TEV-002-ZV5-006','Reaguje správně na základní pokyny, povely, signály a vykonává podle nich individuální i týmovou pohybovou činnost.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',6),
    (v_version,v_subject,v_topic_2,'CZB-TEV-002-ZV5-007','Dodržuje základní pravidla jednoduchých her a soutěží, adekvátně reaguje na zjevné přestupky.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',7),
    (v_version,v_subject,v_topic_2,'CZB-TEV-002-ZV5-008','Měří pohybové výkony a na základě pokynů učitele či porovnání výkonů s předchozími na ně adekvátně reaguje.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',8),
    (v_version,v_subject,v_topic_2,'CZB-TEV-002-ZV5-009','Při pohybových činnostech jedná v duchu fair play, respektuje pohybové dovednosti, předpoklady a zájmy ostatních.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',9),
    (v_version,v_subject,v_topic_2,'CZB-TEV-002-ZV5-010','Spolupracuje při organizaci pohybových činností ve známých prostorech určených pro realizaci tělesné výchovy.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/czb',10)
  on conflict (curriculum_version_id, official_code) do update set
    title = excluded.title, subject_id = excluded.subject_id, topic_id = excluded.topic_id,
    target_grade = excluded.target_grade, source_id = excluded.source_id, source_locator = excluded.source_locator;
end $$;

commit;
