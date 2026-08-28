# Phase 1 — Security checklist

- [ ] Žádné skutečné jméno žáka v aktivním schématu.
- [ ] Žádné datum narození žáka v aktivním schématu.
- [ ] Žádný univerzální `USING (true)` na citlivé tenantové tabulce.
- [ ] Každý tenantový záznam je odvoditelný od školy/třídy.
- [ ] Cizí UUID neumožní přístup k jiné škole ani třídě.
- [ ] Role nelze eskalovat úpravou profilu.
- [ ] Service role není v klientu.
- [ ] Anonymní uživatel nečte tenantová data.
- [ ] Učitel A nečte ani nemění data třídy B.
- [ ] DB-level integrita blokuje kombinaci `school_id` A + `class_id` B.
- [ ] Negativní RLS scénáře jsou automatizované a procházejí.
- [ ] Supabase typy odpovídají skutečnému aplikovanému schématu.
