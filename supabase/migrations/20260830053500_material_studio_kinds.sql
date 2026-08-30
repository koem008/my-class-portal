begin;

alter type public.material_kind add value if not exists 'flashcards';
alter type public.material_kind add value if not exists 'game';
alter type public.material_kind add value if not exists 'project';

commit;
