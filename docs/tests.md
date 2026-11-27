# Tester

T01, T03, T04, T06 och T07 testades 2026-11-21 på branchen `test/backend`, med utgångspunkt i main `3193b0c`. Node 24.11.1, Vitest 5.1.1 och Chromium 156. Alla körs med `npm test` utom T01, som körs med `npm run typecheck`.

## T01: Ogiltig kommentarstatus ger typfel

### Metod

`src/types.check.ts` importerar `CommentStatus` från `shared/types.ts` och tilldelar `const s: CommentStatus = "done"`, med `// @ts-expect-error` på raden före. `npm run typecheck` kördes med kommentaren och en gång tillfälligt utan.

### Resultat

| Fall | Förväntat | Utfall | Godkänt |
| --- | --- | --- | --- |
| Med `// @ts-expect-error` | Typkontrollen går igenom | Inga fel, exit 0 | Ja |
| Utan kommentaren | Typfel på raden med `"done"` | `src/types.check.ts(4,7): error TS2322: Type '"done"' is not assignable to type 'CommentStatus'.`, exit 1 | Ja |

Filen ligger kvar med kommentaren. Om `"done"` någon gång blir en giltig status blir kommentaren oanvänd och typkontrollen misslyckas.

## T02: Det typkontrollen inte hittar

Testat 2026-11-27 på `28baa1a` med TypeScript 7.0.2.

### Metod

I `frontend/src/developer-view.ts` testades `fetchJson<Project[]>("/api/projects")` utan `await` på två sätt. Första gången försökte koden läsa `projects.length` direkt efter anropet. Andra gången fick anropet stå för sig självt. Typkontrollen kördes med `npx.cmd tsc --noEmit` från `frontend` efter varje ändring och en sista gång när testkoden hade tagits bort.

### Resultat

När koden försökte läsa `projects.length` utan `await` gav typkontrollen fel och avslutades med kod 1. `projects` var då en `Promise`, så det gick inte att läsa listans längd direkt. Felmeddelandet var `src/developer-view.ts(70,79): error TS2339: Property 'length' does not exist on type 'Promise<Project[]>'.`

När anropet fick stå för sig självt utan `await` gick typkontrollen igenom med kod 0. Det gjorde den också efter att testkoden togs bort. Alla tre körningar gav det väntade resultatet.

## T03: Kommentartext och koordinater valideras

### Metod

Vitest-test i `src/schemas.test.ts` som kör `createCommentSchema.safeParse` med en giltig kommentar där ett fält i taget ändras.

### Resultat

| Indata | Förväntat | Utfall | Godkänt |
| --- | --- | --- | --- |
| Text `""` | Avvisas | Avvisades | Ja |
| Text med bara mellanslag | Avvisas | Avvisades | Ja |
| Text med 1001 tecken | Avvisas | Avvisades | Ja |
| Text med 1000 tecken | Godkänns | Godkändes | Ja |
| x `1.2` | Avvisas | Avvisades | Ja |
| y `-0.1` | Avvisas | Avvisades | Ja |
| x `"0.5"` som sträng | Avvisas | Avvisades | Ja |
| x och y `0` | Godkänns | Godkändes | Ja |
| x och y `1` | Godkänns | Godkändes | Ja |

## T04: URL, status och projektnamn valideras

### Metod

Vitest-test i `src/schemas.test.ts` med `createReviewSchema`, `updateCommentSchema` och `createProjectSchema`.

### Resultat

| Indata | Förväntat | Utfall | Godkänt |
| --- | --- | --- | --- |
| URL `"not-a-url"` | Avvisas | Avvisades | Ja |
| URL `"ftp://x.se"` | Avvisas | Avvisades | Ja |
| URL `"https://example.com"` | Godkänns | Godkändes | Ja |
| URL `" https://example.com "` med mellanslag | Godkänns | Godkändes | Ja |
| Status `"done"` | Avvisas | Avvisades | Ja |
| Status `"open"` | Godkänns | Godkändes | Ja |
| Status `"resolved"` | Godkänns | Godkändes | Ja |
| Projektnamn `""` | Avvisas | Avvisades | Ja |

## T05: Markörer hamnar rätt vid olika fönsterbredd och zoom

Testat 2026-11-18 på commit `23b1f62`.

### Metod

Automatiserad mätning i Chromium 156. En granskning av https://www.wikipedia.org fick fyra markörer, placerade med klick i bilden vid 1440 × 900 px. Sidan laddades sedan om för varje kombination.

Webbläsarens zoom emulerades: zoom gör CSS-viewporten smalare eller bredare, så viewportens bredd sattes till fönsterbredd / zoom.

Godkänt krävde att alla fyra markörers mittpunkter låg högst 1 px från sparad position i bilden, och att varje markör låg kvar på samma detalj i skärmbilden.

### Resultat

| Kombination (fönster, zoom) | Emulerad viewport | Förväntat | Utfall: bildstorlek | Utfall: största avvikelse | Godkänt |
| --- | --- | --- | --- | --- | --- |
| 800 px, 67 % | 1194 × 896 | Högst 1 px, samma detalj | 911,98 × 697,30 px | 0,000 px | Ja |
| 800 px, 100 % | 800 × 600 | Högst 1 px, samma detalj | 736,97 × 563,48 px | 0,019 px | Ja |
| 800 px, 150 % | 533 × 400 | Högst 1 px, samma detalj | 484,98 × 370,81 px | 0,012 px | Ja |
| 1440 px, 67 % | 2149 × 1343 | Högst 1 px, samma detalj | 911,98 × 697,30 px | 0,000 px | Ja |
| 1440 px, 100 % | 1440 × 900 | Högst 1 px, samma detalj | 911,98 × 697,30 px | 0,000 px | Ja |
| 1440 px, 150 % | 960 × 600 | Högst 1 px, samma detalj | 896,98 × 685,83 px | 0,014 px | Ja |

### Manuell kontroll

Alper Eken och Josef Zakaria kontrollerade samma sex kombinationer med webbläsarens riktiga zoom den 2026-11-18. Markörerna låg rätt i alla sex.

### Begränsningar

- I den automatiserade mätningen kördes kombinationen 800 px, 150 % med mobilemulering, eftersom viewporten är smalare än 768 px.
- Felet återskapades inte i den gamla versionen, så testet visar att nuvarande kod fungerar men jämför inte före och efter.

### Orsak och ändring

Klicket räknades om till en andel av bildens storlek, men markören placerades i procent av `#image-stage`. Elementet var lika brett som sin förälder medan bilden behöll sin egen bredd, så de två måtten kunde skilja sig åt och markören hamnade fel.

Ändringen i `frontend/src/style.css` gör att `#image-stage` följer bildens storlek med `width: fit-content` och `max-width: 100%`. `#screenshot` fick `display: block`, `max-width: 100%` och `height: auto`.

Ändringen infördes i `6a27564` och gäller i nuvarande kod genom `f6d23eb`.

## T06: Databaslagret sparar och hämtar rätt

### Metod

Vitest-test i `src/repository.test.ts`. Varje test får en ny databas med `openDatabase(":memory:")`, som stängs efter testet.

### Resultat

| Fall | Förväntat | Utfall | Godkänt |
| --- | --- | --- | --- |
| Skapa projekt, granskning och kommentar och hämta dem igen | Samma data tillbaka | Samma data tillbaka | Ja |
| Ny kommentar | Status `open` | `open` | Ja |
| Byt status till `resolved` och tillbaka | `resolved`, sedan `open`, även vid ny hämtning | `resolved`, sedan `open` | Ja |
| `createComment` på granskning som inte finns | `NotFoundError` | `NotFoundError` | Ja |
| `updateCommentStatus` på okänt id | `NotFoundError` | `NotFoundError` | Ja |
| Kommentarer på två granskningar | Varje lista innehåller bara sin egen gransknings kommentar | Bara sin egen | Ja |

## T07: Skärmbild av en adress som inte svarar avbryts i tid

### Metod

`captureScreenshot` fick ett valfritt tredje argument `{ timeoutMs }` med standardvärdet 30 000 ms, så `server.ts` och `index.ts` fungerar som förut. Vitest-testet i `src/capture.test.ts` anropar `captureScreenshot("http://10.255.255.1", <tillfällig sökväg>, { timeoutMs: 3000 })` och mäter tiden. Testet har en egen timeout på 15 s.

Godkänt krävde att anropet avvisas med ett fel inom 10 s och att testkörningen avslutas utan att hänga. Det visar att `finally` stänger webbläsaren även när sidan inte laddas. Gränsen 10 s räknar med att Chromium tar några sekunder att starta och ligger långt under standardvärdet 30 s.

På vissa nät avvisas adressen direkt i stället för efter timeout. Testet godkänner båda fallen, så länge det sker inom tidsgränsen.

### Resultat

| Körning | Förväntat | Utfall | Godkänt |
| --- | --- | --- | --- |
| Första körningen | Fel inom tidsgränsen, ingen hängning | `TimeoutError: page.goto: Timeout 3000ms exceeded.` efter 5 576 ms | Ja |
| Körning av alla Vitest-tester | Fel inom tidsgränsen, ingen hängning | `TimeoutError: page.goto: Timeout 3000ms exceeded.` efter 3 464 ms | Ja |

På det här nätet gick anropet till timeout och avvisades inte direkt. Kräver `npx playwright install chromium`.