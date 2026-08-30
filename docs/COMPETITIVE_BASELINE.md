# Moje třída — konkurenční baseline a povinný funkční rozsah

Tento dokument zachovává funkce identifikované u současných AI nástrojů pro pedagogy. Nejde o odbočení od roadmapy ani důvod přeskočit kurikulární základ. Jde o produktový baseline: tyto schopnosti nesmějí být později považovány za konkurenční výhodu samy o sobě, ale za minimální očekávanou úroveň produktu.

## Povinný baseline

- Generátor kompletních příprav na výuku podle tématu, ročníku a kurikula.
- Didaktická struktura hodiny: vzdělávací cíle, časový harmonogram, vhodné didaktické postupy; možnost práce s Bloomovou taxonomií tam, kde je pedagogicky vhodná.
- Generování evokačních aktivit, her, skupinových úkolů, kreativních činností a reflexí.
- Tisknutelné pracovní listy, zadání a další materiály s kvalitním exportem do PDF/tisku.
- Pedagogický konverzační AI asistent.
- Diferenciace jednoho materiálu do více úrovní obtížnosti včetně podpory nadaných žáků a žáků vyžadujících jednodušší nebo jinak upravené zadání.
- Testy, kvízy, opakovací materiály, klíče správných odpovědí a kritéria hodnocení.
- Generování a úprava pracovních listů a textů podle věku a úrovně žáků.
- Pedagogické šablony, aby učitel nemusel psát složité prompty.
- Bezpečné AI prostředí s minimalizací dat předávaných externím AI providerům.
- Databáze připravených a následně učitelem/metodicky ověřených lekcí.
- AI vysvětlení, procvičování a chytré opakování s okamžitou zpětnou vazbou, pokud bude později zpřístupněna žákovská část.
- Přehled skutečného pokroku a problémových oblastí bez falešné přesnosti.

## Hlavní odlišení Moje třída

Moje třída nemá být sada izolovaných AI generátorů. Má fungovat jako AI operační systém konkrétní třídy.

Agent musí v povoleném rozsahu znát a propojovat:

1. konkrétní ročník a školní rok,
2. vybranou verzi RVP a případně ŠVP školy,
3. roční plán,
4. skutečně probrané a neprobrané učivo,
5. návaznosti témat,
6. historii příprav a vytvořených materiálů,
7. pseudonymní profily žáků,
8. pedagogicky relevantní oblasti k procvičení a silné stránky,
9. hlasové poznámky učitele po hodinách,
10. plán dalších hodin.

Příklad cílového workflow:

Učitel řekne, že další hodinu pokračuje ve zlomcích, dva pseudonymní žáci potřebují jednodušší procvičení a jeden je napřed. Agent podle skutečného postupu třídy a kurikula připraví strukturu hodiny, zápis, pracovní list ve více úrovních, řešení a vhodné aktivity. Po hodině učitel hlasem zaznamená, co se stihlo a kdo potřebuje další procvičení. Systém po potvrzení aktualizuje skutečný postup a připraví podklady pro navazující hodinu.

## Privacy invariant

Skutečná identita dítěte není součástí AI systému. Převod mezi pseudonymem a skutečným dítětem zůstává mimo aplikaci. Externí AI provider dostává pouze minimum kontextu nutného pro konkrétní úlohu.

## Implementační pravidlo

Tento baseline se implementuje v příslušných pozdějších fázích (Lesson Engine, Material Engine, Differentiation, Voice, AI orchestrátor, Progress). Nesmí být použit jako důvod přeskočit nebo oslabit Phase 2 kurikulární source-of-truth a následné bezpečnostní gate.
