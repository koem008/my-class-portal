begin;

do $$
declare
  v_version uuid;
  v_source uuid;
  v_area uuid;
  v_subject uuid;
  t_number uuid;
  t_measure uuid;
  t_geometry uuid;
  t_stats uuid;
  t_algebra uuid;
begin
  select id into strict v_version from public.curriculum_versions where code='rvp_zv_revised_2025';
  select id into strict v_source from public.curriculum_sources where source_url='https://prohlednout.rvp.cz/' and source_version='revised-2025';

  insert into public.curriculum_areas(curriculum_version_id,code,name,sort_order,source_id)
  values(v_version,'MAT','Matematika a její aplikace',10,v_source)
  returning id into v_area;

  insert into public.curriculum_subjects(curriculum_version_id,area_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_area,'MAT-MAT','Matematika',1,9,10,v_source)
  returning id into v_subject;

  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_subject,'MAT-MAT-001','Číslo a početní operace',1,5,10,v_source) returning id into t_number;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_subject,'MAT-MAT-002','Měření a výpočty',1,5,20,v_source) returning id into t_measure;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_subject,'MAT-MAT-003','Geometrie v rovině a v prostoru',1,5,30,v_source) returning id into t_geometry;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_subject,'MAT-MAT-004','Statistika a pravděpodobnost',1,5,40,v_source) returning id into t_stats;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_subject,'MAT-MAT-005','Algebra',1,5,50,v_source) returning id into t_algebra;

  insert into public.curriculum_outcomes(curriculum_version_id,subject_id,topic_id,official_code,title,target_grade,origin,source_id,source_locator,sort_order) values
  (v_version,v_subject,t_number,'MAT-MAT-001-ZV5-001','Řeší problémy s přirozenými čísly (včetně nuly) v kontextu reálných situací.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',10),
  (v_version,v_subject,t_number,'MAT-MAT-001-ZV5-002','Modeluje a používá zlomky v praktických situacích.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',20),
  (v_version,v_subject,t_number,'MAT-MAT-001-ZV5-003','Modeluje kladná desetinná čísla pomocí reálných situací.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',30),
  (v_version,v_subject,t_number,'MAT-MAT-001-ZV5-004','Modeluje celá záporná čísla pomocí reálných situací.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',40),
  (v_version,v_subject,t_measure,'MAT-MAT-002-ZV5-005','Využívá standardní jednotky délky k odhadu, měření a porovnávání, prostřednictvím manipulace zjišťuje obsah a objem.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',50),
  (v_version,v_subject,t_geometry,'MAT-MAT-003-ZV5-006','Modeluje a rozpozná geometrické útvary.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',60),
  (v_version,v_subject,t_geometry,'MAT-MAT-003-ZV5-007','Orientuje se v rovině a v prostoru.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',70),
  (v_version,v_subject,t_geometry,'MAT-MAT-003-ZV5-008','Konstruuje geometrické útvary podle zadaných parametrů.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',80),
  (v_version,v_subject,t_stats,'MAT-MAT-004-ZV5-009','Získává data, graficky je zaznamenává, grafický záznam dat čte a interpretuje.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',90),
  (v_version,v_subject,t_stats,'MAT-MAT-004-ZV5-010','Experimentuje, eviduje a popisuje náhodné jevy.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',100),
  (v_version,v_subject,t_stats,'MAT-MAT-004-ZV5-011','Vyhledá všechny prvky nebo skupiny prvků splňující dané podmínky.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',110),
  (v_version,v_subject,t_algebra,'MAT-MAT-005-ZV5-012','Rozpozná, zdůvodní, doplní a tvoří pravidelnosti a řady čísel.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',120),
  (v_version,v_subject,t_algebra,'MAT-MAT-005-ZV5-013','Řeší jednoduché reálné problémy s využitím rovnosti a nerovnosti.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/mat/mat',130);
end $$;

commit;
