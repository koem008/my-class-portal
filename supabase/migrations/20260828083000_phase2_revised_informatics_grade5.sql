begin;
do $$
declare
  v_version uuid; v_source uuid; v_area uuid; v_subject uuid;
  t_data uuid; t_algo uuid; t_systems uuid; t_tech uuid;
begin
  select id into strict v_version from public.curriculum_versions where code='rvp_zv_revised_2025';
  select id into strict v_source from public.curriculum_sources where source_url='https://prohlednout.rvp.cz/' and source_version='revised-2025';
  insert into public.curriculum_areas(curriculum_version_id,code,name,sort_order,source_id)
  values(v_version,'INF','Informatika',30,v_source) returning id into v_area;
  insert into public.curriculum_subjects(curriculum_version_id,area_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_area,'INF-INF','Informatika',1,9,10,v_source) returning id into v_subject;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id) values
  (v_version,v_subject,'INF-INF-001','Data, informace a modelování',1,5,10,v_source) returning id into t_data;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id) values
  (v_version,v_subject,'INF-INF-002','Algoritmizace a programování',1,5,20,v_source) returning id into t_algo;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id) values
  (v_version,v_subject,'INF-INF-003','Informační systémy',1,5,30,v_source) returning id into t_systems;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id) values
  (v_version,v_subject,'INF-INF-004','Digitální technologie',1,5,40,v_source) returning id into t_tech;
  insert into public.curriculum_outcomes(curriculum_version_id,subject_id,topic_id,official_code,title,target_grade,origin,source_id,source_locator,sort_order) values
  (v_version,v_subject,t_data,'INF-INF-001-ZV5-001','Uvede příklady dat, která ho obklopují a která mu mohou pomoci lépe se rozhodnout, vyslovuje odpovědi na základě dat.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',10),
  (v_version,v_subject,t_data,'INF-INF-001-ZV5-002','Znázorní konkrétní situaci na základě její analýzy a určení významných prvků a vztahů mezi nimi.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',20),
  (v_version,v_subject,t_data,'INF-INF-001-ZV5-003','Odvodí informace z daného modelu.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',30),
  (v_version,v_subject,t_algo,'INF-INF-002-ZV5-004','Navrhne posloupnost kroků řešení jednoduchého problému.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',40),
  (v_version,v_subject,t_algo,'INF-INF-002-ZV5-005','Sestaví v blokově orientovaném jazyce program, ve kterém používá opakování a podprogramy, opraví případné chyby.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',50),
  (v_version,v_subject,t_systems,'INF-INF-003-ZV5-006','Rozezná, s jakými daty pracuje vybraný informační systém a jaký je jeho účel.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',60),
  (v_version,v_subject,t_systems,'INF-INF-003-ZV5-007','Zaznamenává do existující tabulky nebo seznamu číselná i nečíselná data pro vymezený problém.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',70),
  (v_version,v_subject,t_tech,'INF-INF-004-ZV5-008','Vybírá na základě zkušenosti aplikace a data pro řešení problému.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',80),
  (v_version,v_subject,t_tech,'INF-INF-004-ZV5-009','Používá digitální technologie připojené k síti nebo k sobě navzájem k posílání a získávání dat.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',90),
  (v_version,v_subject,t_tech,'INF-INF-004-ZV5-010','Rozpoznává rizika ztráty, poškození či zneužití dat při práci s digitálními technologiemi.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/inf',100);
end $$;
commit;