# Tester

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
