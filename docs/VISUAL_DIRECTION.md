# Vizuální směr aplikace Moje třída

Aplikace nemá působit jako univerzální administrační šablona. Cílem je klidný, prémiový a pozitivní pracovní prostor pro učitele: světlý papírový základ, jemné organické barevné vrstvy, hlubší zelená jako hlavní akcent, teplá meruňková a tlumená fialová jako sekundární barvy.

## Zásady

- vysoká čitelnost a silná informační hierarchie;
- větší zaoblení, jemné transparentní vrstvy a měkké stíny bez těžkého „dashboard“ vzhledu;
- výraznější hero bloky u hlavních pracovních prostorů;
- formuláře musejí vypadat jako součást stejného systému, ne jako výchozí HTML prvky;
- AI je pomocník, ne dominantní vizuální prvek;
- mobilní rozhraní musí zůstat čisté, bez zbytečných dekorací a bez ztráty kontrastu;
- tiskové výstupy se globálním vizuálním systémem nesmějí měnit.

Globální vizuální vrstva je v `src/premium-ui.css`. Specifické stránky mohou použít pomocné třídy `premium-page-shell`, `premium-hero`, `premium-tile` a `premium-kicker`.