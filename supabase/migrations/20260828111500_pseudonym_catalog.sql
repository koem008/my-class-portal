begin;

create table if not exists public.pseudonym_catalog (
  id uuid primary key default gen_random_uuid(),
  set_key text not null check (set_key in ('animals','plants','nature','space')),
  code text not null,
  display_name text not null,
  emoji text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (set_key, code),
  unique (set_key, display_name)
);

alter table public.pseudonym_catalog enable row level security;

revoke all on table public.pseudonym_catalog from anon;
grant select on table public.pseudonym_catalog to authenticated;

create policy "pseudonym_catalog_select"
on public.pseudonym_catalog
for select
to authenticated
using (is_active = true);

insert into public.pseudonym_catalog (set_key, code, display_name, emoji, sort_order) values
('animals','fox','Liška','🦊',1),
('animals','owl','Sova','🦉',2),
('animals','panda','Panda','🐼',3),
('animals','otter','Vydra','🦦',4),
('animals','dolphin','Delfín','🐬',5),
('animals','penguin','Tučňák','🐧',6),
('animals','squirrel','Veverka','🐿️',7),
('animals','hedgehog','Ježek','🦔',8),
('animals','koala','Koala','🐨',9),
('animals','rabbit','Králík','🐰',10),
('animals','turtle','Želva','🐢',11),
('animals','seal','Tuleň','🦭',12),
('animals','butterfly','Motýl','🦋',13),
('animals','bee','Včela','🐝',14),
('animals','ladybug','Beruška','🐞',15),
('animals','whale','Velryba','🐋',16),
('animals','parrot','Papoušek','🦜',17),
('animals','duck','Kachna','🦆',18),
('animals','swan','Labuť','🦢',19),
('animals','deer','Jelen','🦌',20),
('animals','moose','Los','🫎',21),
('animals','horse','Kůň','🐴',22),
('animals','zebra','Zebra','🦓',23),
('animals','giraffe','Žirafa','🦒',24),
('animals','elephant','Slon','🐘',25),
('animals','rhino','Nosorožec','🦏',26),
('animals','kangaroo','Klokan','🦘',27),
('animals','camel','Velbloud','🐫',28),
('animals','llama','Lama','🦙',29),
('animals','flamingo','Plameňák','🦩',30)
on conflict (set_key, code) do update set
  display_name = excluded.display_name,
  emoji = excluded.emoji,
  sort_order = excluded.sort_order,
  is_active = true;

commit;