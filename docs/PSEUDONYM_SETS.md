# Moje třída — pseudonymní sady a offline převodník

## Účel

Aplikace nikdy nepotřebuje znát skutečné jméno dítěte. Učitel pracuje v systému pouze s neutrálním pseudonymem a obrázkem. Skutečný převod `pseudonym ↔ dítě` zůstává fyzicky u učitele mimo aplikaci.

## Funkce v sekci Třída

### Sady
- Zvířata
- Rostliny
- Příroda
- Vesmír

Každá sada má přibližně 30 jednoznačných, pozitivních a nehanlivých motivů. Motivy nesmějí nést negativní stereotyp, hodnocení schopností, vzhledu, chování ani zdravotního stavu dítěte.

### Výběr pseudonymu
Učitel nebo dítě si vybere motiv. V aplikaci se uloží pouze:
- pseudonym (např. Liška),
- avatar/motiv,
- příslušnost k pseudonymní třídě,
- pedagogická data vedená pod pseudonymem.

Skutečné jméno se do aplikace nezadává.

### Tisknutelný offline převodník
Jedním kliknutím vytvořit čistou tiskovou A4 tabulku:

| Obrázek | Pseudonym | Jméno žáka — doplnit ručně |
| --- | --- | --- |

Poslední sloupec musí být při generování vždy prázdný. Učitel jej doplní propiskou až na vytištěném listu. Aplikace nesmí umožnit jeho digitální vyplnění ani uložení.

Tiskový list musí obsahovat výrazné upozornění: `Obsahuje skutečná jména po ručním doplnění. Uchovávejte mimo aplikaci a zabezpečeně.`

## Privacy invariant

- žádné skutečné jméno dítěte v databázi,
- žádné skutečné jméno dítěte v AI promptu,
- žádný digitální převodník identita ↔ pseudonym,
- žádný OCR/import vyplněného převodníku zpět do systému,
- narozeniny, svátky, pokrok, diferenciace a poznámky používají pouze pseudonym.

## Budoucí UX

Sekce `Třída → Pseudonymy` nabídne galerii motivů, stav obsazeno/volné, náhled tiskového archu a akci `Vytisknout převodník`. Tisk musí fungovat i bez Canva integrace; Canva může být později pouze volitelná vizuální cesta pro jiné necitlivé materiály.