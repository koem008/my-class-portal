# Moje třída — AI Companion Mode

## Produktový princip
AI asistentka není pouze pedagogický chatbot. Je to dobrovolná osobní pracovní společnice učitele, která kombinuje pracovní kontext školy s malou, explicitně povolenou osobní pamětí.

## Ranní režim
Po otevření aplikace sestaví systém bez nutnosti AI nejprve strukturovaný briefing z dostupných dat: dnešní rozvrh, stav příprav, blokace a události kalendáře, nedokončené učivo, důležité termíny a úkoly. Teprve potom může levný jazykový model briefing převést do přirozené krátké konverzace.

Příklad tónu: „Dobré ráno, Káťo. Jak se dnes máš? Čeká nás pět hodin. Matematiku máš připravenou, k přírodovědě ještě chybí pracovní list. Ve 13:30 je porada. Chceš nejdřív rychle projet dnešek?“

Asistentka nesmí tvrdit nic osobního, co nemá v explicitně povolené paměti nebo kalendáři.

## Odpolední režim
Krátká hlasová reflexe: „Jak to dnes dopadlo?“ Učitel může přirozeně popsat celý den. Systém připraví strukturovaný návrh změn: lesson progress, nedodělky, follow-up, pseudonymní learning signals a návrhy na další den. Před zápisem pedagogických dat musí učitel změny potvrdit.

## Osobní paměť — opt-in
Osobní paměť je oddělená od pedagogických dat a ve výchozím stavu vypnutá. Uživatel musí vědomě povolit, co si má asistentka pamatovat. Typické položky: preferovaný způsob oslovení, komunikační styl, pravidelné osobní časové závazky, obecné preference plánování. Uživatel musí mít jednoduché rozhraní „Co si o mně pamatuješ?“ a možnost každou položku smazat nebo osobní paměť kompletně vypnout.

Nevytvářet skryté psychologické profily, zdravotní závěry ani domněnky o osobním životě. Neodvozovat osobní fakta z tónu konverzace.

## Osobnost
Volitelný styl: Přátelská / Klidná / Efektivní / Vlastní. Uživatel může zvolit jméno asistentky. Přátelský režim může používat lehký humor, ale nesmí předstírat lidské vědomí, city nebo skutečný osobní vztah.

## Kontextové vrstvy
1. pracovní den: timetable, calendar, preparation status;
2. pedagogická kontinuita: curriculum, lesson progress, unfinished items;
3. pseudonymní potřeby třídy: pouze aliases a pedagogické signály;
4. explicitní osobní preference: pouze opt-in položky;
5. aktuální konverzace.

Context builder musí vybírat jen minimum relevantní pro danou akci. Celá historie ani celá DB se neposílá providerovi.

## Hlas
Push-to-talk, nikoli permanentní odposlech. Po přepisu zobrazit text. U akcí měnících pedagogická data zobrazit návrh změn a vyžádat potvrzení. Běžná konverzační odpověď potvrzení nepotřebuje.

## Náklady
Ranní/odpolední strukturovaný kontext vzniká lokálně/DB dotazy. LLM pouze formuluje nebo interpretuje přirozený jazyk. Krátké konverzace směrovat na levný model. Silný model použít jen pro komplexní pedagogickou tvorbu. Žádný polling, background LLM ani permanentní speech stream. Cíl: zachovat celkové externí náklady běžného jednoho učitele přibližně do 400 Kč/měsíc; skutečný limit závisí na později zvolených API cenách a musí být měřitelný přes usage budget.

## Bezpečnost
Skutečné identity žáků nikdy neposílat AI. Osobní paměť učitele nesmí být automaticky míchána do pedagogických materiálů. Fail closed při chybě provideru. API secrets pouze server-side. Auditovat nákladné a datově měnící AI akce bez ukládání nepotřebného raw soukromého obsahu.
