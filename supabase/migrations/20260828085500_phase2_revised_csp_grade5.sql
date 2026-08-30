-- MOJE TŘÍDA — PHASE 2
-- Revidovaný RVP ZV — Člověk, jeho osobnost a svět práce, 5. ročník
-- Zdroj: https://prohlednout.rvp.cz/zakladni-vzdelavani/vzdelavaci-oblasti/csp

begin;

do $$
declare
  v_version uuid;
  v_source uuid;
  v_area uuid;
  v_osv uuid;
  v_tch uuid;
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid;
begin
  select id into v_version from public.curriculum_versions where code = 'rvp_zv_revised_2025';
  select id into v_source from public.curriculum_sources where source_url = 'https://prohlednout.rvp.cz/';

  insert into public.curriculum_areas(curriculum_version_id, code, name, sort_order, source_id)
  values (v_version, 'CSP', 'Člověk, jeho osobnost a svět práce', 10, v_source)
  on conflict (curriculum_version_id, code) do update set name = excluded.name
  returning id into v_area;

  insert into public.curriculum_subjects(curriculum_version_id, area_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version, v_area, 'CSP-OSV', 'Osobnostní a sociální výchova', 1, 9, 1, v_source)
  on conflict (curriculum_version_id, code) do update set name = excluded.name, area_id = excluded.area_id
  returning id into v_osv;

  insert into public.curriculum_subjects(curriculum_version_id, area_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version, v_area, 'CSP-TCH', 'Polytechnická výchova a praktické činnosti', 1, 9, 2, v_source)
  on conflict (curriculum_version_id, code) do update set name = excluded.name, area_id = excluded.area_id
  returning id into v_tch;

  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_osv,'CSP-OSV-001','Osobnostní rozvoj',1,9,1,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t1;
  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_osv,'CSP-OSV-002','Sociální a etický rozvoj',1,9,2,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t2;
  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_osv,'CSP-OSV-003','Kariérový rozvoj',1,9,3,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t3;

  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_tch,'CSP-TCH-001','Práce s technickým materiálem a technická tvořivost',1,9,1,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t4;
  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_tch,'CSP-TCH-002','Péče o domácnost a zahradu',1,9,2,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t5;
  insert into public.curriculum_topics(curriculum_version_id, subject_id, code, name, grade_from, grade_to, sort_order, source_id)
  values (v_version,v_tch,'CSP-TCH-003','Konstrukční činnosti a automatizace',1,9,3,v_source)
  on conflict (subject_id,parent_topic_id,name) do update set code=excluded.code returning id into t6;

  insert into public.curriculum_outcomes(curriculum_version_id, subject_id, topic_id, official_code, title, target_grade, period_label, origin, source_id, source_locator, sort_order)
  values
    (v_version,v_osv,t1,'CSP-OSV-001-ZV5-001','Rozpozná své vybrané osobnostní vlastnosti, silné stránky a zkouší uplatňovat sebepoznání ve svém jednání.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/osv/osobnostni-rozvoj',1),
    (v_version,v_osv,t1,'CSP-OSV-001-ZV5-002','Všímá si svého prožívání v běžných i náročných situacích, uplatňuje základní postupy předcházení stresu, jeho zmírňování a vyhledání pomoci.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/osv/osobnostni-rozvoj',2),
    (v_version,v_osv,t2,'CSP-OSV-002-ZV5-003','Zapojuje se do interakce ve skupině, rozpoznává svůj přínos a přínos druhých ve skupinové činnosti.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp',3),
    (v_version,v_osv,t2,'CSP-OSV-002-ZV5-004','Rozpozná základní emoce a potřeby své i druhých lidí a zkouší uplatnit vnímavost k nim ve svém jednání.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp',4),
    (v_version,v_osv,t3,'CSP-OSV-003-ZV5-005','Rozpoznává různé druhy profesí ve svém blízkém okolí a sdílí zkušenosti se zapojením do pracovních činností ve svém domácím prostředí.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/osv/karierovy-rozvoj',5),
    (v_version,v_osv,t3,'CSP-OSV-003-ZV5-006','Navrhuje a zkouší realizovat svůj rozvoj ve vybrané oblasti svých zájmů.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/osv/karierovy-rozvoj',6),
    (v_version,v_tch,t4,'CSP-TCH-001-ZV5-001','Zhotovuje výrobky z technického materiálu s využitím tradičních, inovativních a digitálních technologií za dodržení zásad hygieny a bezpečnosti práce.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/tch',7),
    (v_version,v_tch,t5,'CSP-TCH-002-ZV5-002','Používá běžné nářadí a nástroje pro péči o domácnost, zahradu nebo zeleň v interiéru.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/tch',8),
    (v_version,v_tch,t6,'CSP-TCH-003-ZV5-003','Provádí jednoduché konstrukční činnosti s návodem i bez návodu.',5,'1. stupeň, 5. ročník','official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/csp/tch/konstrukcni-cinnosti-a-automatizace',9)
  on conflict (curriculum_version_id, official_code) do update set
    title=excluded.title, subject_id=excluded.subject_id, topic_id=excluded.topic_id,
    target_grade=excluded.target_grade, source_id=excluded.source_id, source_locator=excluded.source_locator;
end $$;

commit;
