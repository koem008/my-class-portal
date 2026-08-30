begin;

insert into public.pseudonym_catalog (set_key, code, display_name, emoji, sort_order) values
('plants','clover','Jetel','☘️',1),
('plants','sunflower','Slunečnice','🌻',2),
('plants','tulip','Tulipán','🌷',3),
('plants','cactus','Kaktus','🌵',4),
('plants','fern','Kapradina','🌿',5),
('plants','seedling','Sazenice','🌱',6),
('plants','blossom','Květ','🌸',7),
('plants','maple_leaf','Javorový list','🍁',8),
('plants','herb','Bylinka','🌿',9),
('plants','tree','Strom','🌳',10),
('nature','rainbow','Duha','🌈',1),
('nature','sun','Slunce','☀️',2),
('nature','cloud','Oblak','☁️',3),
('nature','snowflake','Vločka','❄️',4),
('nature','wave','Vlna','🌊',5),
('nature','mountain','Hora','⛰️',6),
('nature','island','Ostrov','🏝️',7),
('nature','crystal','Krystal','💎',8),
('nature','shell','Mušle','🐚',9),
('nature','drop','Kapka','💧',10),
('space','star','Hvězda','⭐',1),
('space','moon','Měsíc','🌙',2),
('space','planet','Planeta','🪐',3),
('space','comet','Kometa','☄️',4),
('space','rocket','Raketa','🚀',5),
('space','satellite','Družice','🛰️',6),
('space','galaxy','Galaxie','🌌',7),
('space','telescope','Dalekohled','🔭',8),
('space','meteor','Meteor','🌠',9),
('space','orbit','Oběžnice','🌀',10)
on conflict (set_key, code) do update set
  display_name = excluded.display_name,
  emoji = excluded.emoji,
  sort_order = excluded.sort_order,
  is_active = true;

commit;
