# Moje třída — Phase 2: kurikulární zdroje

## Cíl

Phase 2 vytváří verzovaný kurikulární zdroj pravdy pro 1.–5. ročník s prvním praktickým zaměřením na 5. ročník ve školním roce 2026/2027.

## Autoritativní zdroje

1. MŠMT — Rámcový vzdělávací program pro základní vzdělávání
   - autorita: Ministerstvo školství, mládeže a tělovýchovy
   - URL: https://msmt.gov.cz/vzdelavani/zakladni-vzdelavani/ramcovy-vzdelavaci-program-pro-zakladni-vzdelavani
   - účel: právní a verzovací zdroj pro dosavadní i revidovaný RVP ZV a přechodové období.

2. Elektronický RVP — prohlednout.rvp.cz
   - URL: https://prohlednout.rvp.cz/
   - účel: strukturované oblasti, obory, očekávané výsledky učení a jejich oficiální kódy.

3. NPI / Revize RVP — modelové ŠVP pro ZŠ
   - URL: https://revize.rvp.cz/zv/jak-na-svp/modelove-svp-pro-zs
   - účel: modelové učební plány a XLSX/PDF podklady, zejména rozřazení školních očekávaných výsledků do ročníků.

## Režim pro školní rok 2026/2027

Systém nesmí předpokládat jednu jedinou závaznou kurikulární verzi pro všechny školy.

Musí podporovat minimálně:

- `rvp_zv_2004_current` — dosavadní RVP ZV používaný v přechodném období;
- `rvp_zv_revised_2025` — revidovaný RVP ZV;
- budoucí školní ŠVP jako samostatnou školní vrstvu nad zvolenou verzí RVP.

Volba konkrétního režimu je explicitní na úrovni školy/třídy.

## Zásady ingestu

Kurikulum se nikdy nevytváří z paměti AI.

Pipeline:

`ověřený zdroj → snapshot zdroje → normalizace → validační kontrola → publikovaná curriculum_version`

Každý oficiální výsledek musí mít:

- `official_code`, pokud existuje;
- vazbu na `curriculum_version`;
- zdroj a URL;
- ročník/období;
- vzdělávací oblast a předmět;
- status původu `official`.

AI generované pedagogické materiály se do těchto tabulek nikdy nezapisují jako oficiální kurikulum.

## Autorská práva

Phase 2 nevkládá hromadně text komerčních učebnic ani pracovních sešitů.

Oficiální zdroje jsou evidovány s metadaty a původem. Materiály třetích stran se smí importovat pouze podle jejich licence nebo explicitního oprávnění.

## 5. ročník

První obsahový ingest se zaměří na 5. ročník. Datový model ale nesmí být omezen pouze na něj.

Revidovaný RVP používá pro některé výsledky přímo kódy s cílovou úrovní 5. ročníku, např. matematika obsahuje kódy formátu `MAT-MAT-...-ZV5-...`.

Přesné texty výsledků se budou ingestovat pouze z ověřeného zdroje a s uloženou provenance.
