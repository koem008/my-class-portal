# Phase 1 — adversarial RLS test matrix

Tyto testy musí být provedeny v lokálním/testovacím Supabase prostředí po aplikaci migrace. Nepoužívat produkční ani skutečná data dětí.

## Testovací aktéři

- Admin A — school A
- Teacher A — school A, class A
- Admin B — school B
- Teacher B — school B, class B
- Anonymous — bez session

Testovací aliasy: `Jezevec` v class A, `Kometa` v class B.

## Povinné scénáře

1. Teacher A čte class A → PASS/allowed.
2. Teacher A čte class B → musí vrátit 0 řádků / denied.
3. Teacher A čte aliasy class A → allowed.
4. Teacher A čte aliasy class B → denied.
5. Teacher A vloží alias do class A se school A → allowed.
6. Teacher A vloží alias do class B → denied.
7. Teacher A vloží alias s `class_id` A a `school_id` B → odmítnuto DB constraintem/RLS.
8. Teacher A upraví alias v class A → allowed.
9. Teacher A upraví alias v class B → denied.
10. Teacher A smaže alias v class B → denied.
11. Teacher A se pokusí změnit vlastní school membership na `school_admin` → denied.
12. Teacher A se pokusí změnit `school_id` nebo `academic_year_id` class A → denied (strukturální změny třídy jsou admin-only).
13. Admin A čte nebo mění school B → denied.
14. Anonymous čte `schools`, `classes`, `student_aliases` → denied.
15. Změna URL/UUID na cizí class id → denied.
16. Přímý PostgREST request musí mít stejné omezení jako UI.
17. V aktivním schématu nesmí existovat `students.full_name`, `birth_date`, dětský e-mail, telefon nebo adresa.
18. Žádná citlivá tenant policy nesmí obsahovat univerzální `USING (true)`.
19. `student_aliases.id` je UUID a technický identifikátor; alias není primární klíč.
20. `create_school_tenant` bez autentizace → denied.
21. `create_school_tenant` jako authenticated vytvoří pouze školu, jejímž adminem je volající uživatel.
22. Uživatel vytvořený v Auth automaticky nedostává žádnou školní roli ani přístup k cizí škole.

## Gate

Phase 1 nesmí být označena jako dokončená ani sloučena jako produkčně bezpečná, dokud všechny negativní scénáře skutečně neprojdou v testovacím Supabase prostředí.
