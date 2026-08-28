# ADR-001 — Externí AI provideři

Status: **PŘIJATO**

## Rozhodnutí

Produkční AI vrstva projektu **Moje třída nesmí používat Lovable AI jako runtime AI provider**.

Lovable/Lovable Cloud slouží pro:
- aplikační prostředí,
- frontend a serverovou část,
- napojenou Supabase/PostgreSQL databázi,
- autentizaci a infrastrukturu, pokud je pro danou část vhodná.

AI funkce budou volány přes **externí AI API** z vlastní server-only integrační vrstvy aplikace.

## Povinné zásady

1. API klíče externích AI providerů jsou pouze v serverových secrets; nikdy v browseru ani veřejném klientském bundle.
2. React komponenty nevolají AI providera přímo.
3. Doménová vrstva používá vlastní provider-neutral rozhraní, např. `generateStructuredText`, `transcribeAudio`, `generateEmbedding`.
4. Konkrétní provider je implementační detail adapteru a musí být vyměnitelný bez přepisu Lesson/Curriculum/Voice domény.
5. Orchestrátor vybírá model podle úlohy, kvality, ceny, latence a citlivosti dat.
6. Do externího AI API se posílá pouze minimální nutný kontext; nikdy celý tenant nebo třída bez důvodu.
7. Identita žáka se providerovi neposílá. Pro diferenciaci se předává pouze nutný anonymizovaný pedagogický kontext.
8. Všechny AI odpovědi procházejí schema/runtime validací a relevantní domain/quality kontrolou před uložením.
9. AI nesmí mít přímé databázové privilegium ani možnost obejít RLS.
10. Citlivé změny se ukládají až po explicitním schválení učitelem podle pravidel systému.
11. AI selhání je fail-closed: chyba provideru nesmí změnit schválená data ani vyvolat falešný úspěch.
12. Náklady se sledují na úrovni requestu/modelu a drahý model se nepoužívá na úlohy, které zvládne levnější varianta.

## Voice

Speech-to-text je rovněž externí provider za stejnou abstrakční vrstvou. Audio se standardně drží pouze dočasně, po úspěšném přepisu a strukturování se odstraní, pokud uživatel výslovně nezvolí jiný retenční režim.

## Důvod

- nezávislost na Lovable kreditech,
- kontrola modelu a nákladů,
- možnost měnit AI providery,
- lepší auditovatelnost a datová minimalizace,
- oddělení AI runtime od aplikační platformy.

## Důsledek

Budoucí Phase 6/8 implementace Voice Engine a AI orchestrátoru musí toto ADR respektovat. Žádný pozdější vývoj nesmí z pohodlnosti zavést přímé Lovable AI volání do produkční cesty bez explicitní revize tohoto ADR.
