# AI provider setup — Moje třída

Tento dokument popisuje ruční konfiguraci externích AI providerů podle `ADR-001-EXTERNAL-AI-PROVIDERS.md`.

> API klíče nikdy nepatří do klientského kódu, Reactu, localStorage ani veřejné databáze. Ukládají se pouze jako serverové secrets prostředí.

## Text — Anthropic

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_STRONG_MODEL=claude-sonnet-5`
- `ANTHROPIC_ECONOMY_MODEL=claude-haiku-4-5`
- volitelně `ANTHROPIC_API_URL=https://api.anthropic.com/v1/messages`

Silný model se používá pro komplexní přípravy, pracovní listy, prezentace a diferenciaci. Economy model se používá pro kratší a jednodušší úlohy.

## Speech-to-text — OpenAI

- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`
- volitelně `OPENAI_TRANSCRIBE_URL=https://api.openai.com/v1/audio/transcriptions`

Audio je pouze dočasný vstup pro transkripci. Aplikace jej nemá po úspěšném přepisu uchovávat, pokud uživatel výslovně nezvolí jiný retenční režim.

## Text-to-speech — ElevenLabs

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID=<vybraný český hlas>`
- `ELEVENLABS_MODEL=eleven_flash_v2_5`
- volitelně `ELEVENLABS_API_BASE=https://api.elevenlabs.io/v1`

Flash v2.5 podporuje češtinu. Pro přirozený výsledek je nutné vybrat hlas vhodný pro češtinu a výsledek ručně poslechnout.

## Obrázky pro Výtvarnou výchovu — Google Gemini

- `GEMINI_API_KEY`
- `GEMINI_IMAGE_MODEL=gemini-3.1-flash-image`
- volitelně `GEMINI_API_BASE=https://generativelanguage.googleapis.com/v1`

Výchozí velikost je 1K. Prompty jsou omezené na školně vhodné ilustrační/reference obrázky, bez fotorealistických osob a bez identity či podoby dítěte.

## Ruční limity nákladů

Před produkčním použitím nastavte u každého provider účtu vlastní měsíční budget/alert nebo nejbližší dostupnou nativní ochranu:

- Anthropic Console — workspace/org spend limits a billing alerts podle dostupného plánu.
- OpenAI Platform — project/org budget a usage alerts.
- ElevenLabs — zvolte plán s omezeným kreditem; vypněte nebo omezte případné pay-as-you-go/top-up chování podle požadovaného stropu.
- Google AI / Google Cloud Billing — budget + alert pro projekt/API účet.

Tyto limity jsou account-level konfigurace a aplikace je sama nemůže spolehlivě vynutit bez přístupu k billing účtům providerů.

## Povinné živé ověření před označením voice pipeline jako DONE

Až budou všechny čtyři secrets připojené, proveďte nejméně dva celé průchody:

1. česká hlasová vstupní věta,
2. OpenAI transkripce,
3. Claude strukturovaná/konverzační odpověď,
4. ElevenLabs české TTS,
5. poslech výsledku a změření end-to-end latence.

Bez tohoto živého testu je integrace pouze `PŘIPRAVENO K PŘIPOJENÍ`, nikoliv finálně ověřený voice UX.
