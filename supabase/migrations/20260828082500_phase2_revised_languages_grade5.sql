begin;
do $$
declare
  v_version uuid; v_source uuid; v_area uuid; v_cjl uuid; v_aja uuid;
  t_cjl uuid; t_rec uuid; t_prod uuid; t_inter uuid;
begin
  select id into strict v_version from public.curriculum_versions where code='rvp_zv_revised_2025';
  select id into strict v_source from public.curriculum_sources where source_url='https://prohlednout.rvp.cz/' and source_version='revised-2025';
  insert into public.curriculum_areas(curriculum_version_id,code,name,sort_order,source_id)
  values(v_version,'JJK','Jazyk a jazyková komunikace',20,v_source) returning id into v_area;

  insert into public.curriculum_subjects(curriculum_version_id,area_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_area,'JJK-CJL','Český jazyk a literatura',1,9,10,v_source) returning id into v_cjl;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_cjl,'JJK-CJL-001','Český jazyk a literatura',1,5,10,v_source) returning id into t_cjl;
  insert into public.curriculum_outcomes(curriculum_version_id,subject_id,topic_id,official_code,title,target_grade,origin,source_id,source_locator,sort_order) values
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-001','V mluvené komunikaci používá osvojené jazykové prostředky vzhledem ke svému komunikačnímu záměru a dané komunikační situaci.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',10),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-002','Využívá znalosti o slovní zásobě a způsobech jejího rozšiřování v komunikaci a při práci s textem.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',20),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-003','Vytváří vlastní písemná sdělení s využitím osvojených mluvnických a pravopisných pravidel a znalosti vybraných slohových útvarů.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',30),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-004','Posoudí výpověď v konkrétní situaci a adekvátně reaguje.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',40),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-005','Čte s porozuměním přiměřeně náročné texty včetně textů elektronických.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',50),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-006','Rozpozná manipulaci v komunikaci a dokáže reagovat přiměřeně svému věku.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',60),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-007','Experimentuje s jazyky a buduje si vztah k učení se jazykům.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',70),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-008','Vyjadřuje svoje prožitky ze čtení nebo poslechu uměleckého textu.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',80),
  (v_version,v_cjl,t_cjl,'JJK-CJL-001-ZV5-009','Tvořivě pracuje s uměleckým textem.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/cjl',90);

  insert into public.curriculum_subjects(curriculum_version_id,area_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_area,'JJK-AJA','Anglický jazyk',1,9,20,v_source) returning id into v_aja;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_aja,'JJK-AJA-001','Recepce',1,5,10,v_source) returning id into t_rec;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_aja,'JJK-AJA-002','Produkce',1,5,20,v_source) returning id into t_prod;
  insert into public.curriculum_topics(curriculum_version_id,subject_id,code,name,grade_from,grade_to,sort_order,source_id)
  values(v_version,v_aja,'JJK-AJA-003','Interakce',1,5,30,v_source) returning id into t_inter;
  insert into public.curriculum_outcomes(curriculum_version_id,subject_id,topic_id,official_code,title,target_grade,origin,source_id,source_locator,sort_order) values
  (v_version,v_aja,t_rec,'JJK-AJA-001-ZV5-001','Rozumí konkrétním informacím v jednoduchých, pomalu a zřetelně pronášených textech.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',10),
  (v_version,v_aja,t_rec,'JJK-AJA-001-ZV5-002','Rozumí jednoduchým krátkým psaným textům.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',20),
  (v_version,v_aja,t_prod,'JJK-AJA-002-ZV5-003','Mluví v jednoduchých větách o osvojovaných tématech.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',30),
  (v_version,v_aja,t_prod,'JJK-AJA-002-ZV5-004','Napíše krátký text s použitím jednoduchých vět a slovních spojení z okruhu osvojených témat.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',40),
  (v_version,v_aja,t_inter,'JJK-AJA-003-ZV5-005','Zapojí se do jednoduchých rozhovorů týkajících se osvojených témat.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',50),
  (v_version,v_aja,t_inter,'JJK-AJA-003-ZV5-006','Napíše krátkou zprávu.',5,'official',v_source,'/zakladni-vzdelavani/vzdelavaci-oblasti/jjk/aja',60);
end $$;
commit;
