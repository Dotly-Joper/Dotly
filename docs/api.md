# Dotly API

## Översikt

- Servern körs på `http://localhost:3000`. Frontenden (Vite, port 5173) anropar relativa sökvägar, och Vite-proxyn vidarebefordrar `/api` och `/screenshots` till servern.
- `/test-site/` proxas inte. Den öppnas direkt på `http://localhost:3000/test-site/`, både av Playwright och vid pilottestet.
- Alla request- och response-bodys i API:et är JSON.
- Id skapas av servern med `crypto.randomUUID()`. Datum är ISO 8601-strängar.
- Det finns inga konton. Granskningen delas med en hemlig länk `/?review=<reviewId>`.
- All indata valideras med Zod på servern.

## Datatyper

```ts
export type CommentStatus = "open" | "resolved";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ReviewBase {
  id: string;
  projectId: string;
  url: string;
  createdAt: string;
}

export type Review =
  | (ReviewBase & { status: "pending" })
  | (ReviewBase & { status: "ready"; imageUrl: string })
  | (ReviewBase & { status: "failed"; errorMessage: string });

export interface ReviewComment {
  id: string;
  reviewId: string;
  x: number; // 0–1, andel av bildens bredd från vänster
  y: number; // 0–1, andel av bildens höjd från toppen
  text: string;
  status: CommentStatus;
  createdAt: string;
}
```

- `imageUrl` finns bara när `status` är `"ready"` och har formen `/screenshots/<reviewId>.png`.
- `errorMessage` finns bara när `status` är `"failed"`.
- `x` och `y` är andelar av skärmbildens egen storlek, inte av webbläsarfönstret. För att en markör ska hamna rätt måste frontenden placera markörerna mot en yta som är exakt lika stor som bilden. I nuvarande kod räknas klicket mot bilden, men markörerna placeras mot `#image-stage`, som kan vara bredare än bilden. Det är den kända zoombuggen, och den åtgärdas i frontenden.

## Felformat

Alla fel har samma form. `details` finns bara vid `VALIDATION_ERROR`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [{ "path": ["name"], "message": "Name must be between 1 and 100 characters" }]
  }
}
```

- `VALIDATION_ERROR` → 400. `details` är listan med Zods `issues`, med bara `path` och `message` för varje fel. Ogiltig JSON i en body ger också det här felet.
- `NOT_FOUND` → 404. Ett id som inte finns ger 404, oavsett format. Okända sökvägar under `/api` ger också det här felet.
- `INTERNAL` → 500. Alla endpoints kan svara med det här felet. Felet loggas på servern och meddelandet är generellt.

Valideringen görs före kontrollen av att resursen finns, så 400 vinner över 404. Okända fält i en body ignoreras (Zods standard). Texterna i `message` är exempel.

Vid ogiltig JSON är `details` en tom lista:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request-bodyn är inte giltig JSON.",
    "details": []
  }
}
```

## Endpoints

### POST /api/projects

Skapar ett projekt. Body: `name`, sträng, trimmas, 1–100 tecken efter trimning.

```json
{ "name": "Webbshop" }
```

Svar: 201 med `Project`.

```json
{
  "id": "3f2b8c1e-7a4d-4e9b-9c21-5d6f8a0b1c2d",
  "name": "Webbshop",
  "createdAt": "2026-11-07T10:15:00.000Z"
}
```

Fel: 400 om `name` är ogiltigt.

### GET /api/projects

Hämtar alla projekt, nyaste först. Svar: 200 med `Project[]`. Fel: Inga utöver 500 `INTERNAL`.

### POST /api/projects/:projectId/reviews

Skapar en granskning och tar en skärmbild. Body: `url`, giltig URL, bara `http:` och `https:`.

```json
{ "url": "https://example.com/pricing" }
```

Granskningen sparas först som `pending`. Sedan tar servern skärmbilden med Playwright, sparar den som `screenshots/<reviewId>.png` och sätter status `ready`. Anropet kan ta flera sekunder, eftersom servern väntar på skärmbilden.

Misslyckas skärmbilden får granskningen status `failed` med `errorMessage`, och servern svarar ändå 201. Granskningen har skapats, och frontenden visar felet genom att läsa `status`.

Svar: 201 med `Review`.

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "projectId": "3f2b8c1e-7a4d-4e9b-9c21-5d6f8a0b1c2d",
  "url": "https://example.com/pricing",
  "createdAt": "2026-11-07T10:20:00.000Z",
  "status": "ready",
  "imageUrl": "/screenshots/7c9e6679-7425-40de-944b-e07fc1f90ae7.png"
}
```

```json
{
  "id": "b5d8f3a2-1e6c-4f07-a3d9-8c2e4b7f6015",
  "projectId": "3f2b8c1e-7a4d-4e9b-9c21-5d6f8a0b1c2d",
  "url": "https://does-not-exist.example.com/",
  "createdAt": "2026-11-07T10:25:00.000Z",
  "status": "failed",
  "errorMessage": "The domain could not be found"
}
```

Fel: 400 vid ogiltig URL, 404 om projektet inte finns.

### GET /api/projects/:projectId/reviews

Hämtar ett projekts granskningar, nyaste först. Svar: 200 med `Review[]`. Fel: 404 om projektet inte finns.

### GET /api/reviews/:reviewId

Hämtar en granskning. Svar: 200 med `Review`. Fel: 404 om granskningen inte finns.

### GET /api/reviews/:reviewId/comments

Hämtar en gransknings kommentarer, äldst först, så att numreringen av markörerna blir stabil. Svar: 200 med `ReviewComment[]`. Fel: 404 om granskningen inte finns.

### POST /api/reviews/:reviewId/comments

Skapar en kommentar. Body: `x` och `y`, tal mellan 0 och 1 (båda inklusive), och `text`, sträng, trimmas, 1–1000 tecken efter trimning.

```json
{ "x": 0.42, "y": 0.18, "text": "Rubriken borde vara större." }
```

Svar: 201 med `ReviewComment`, där `status` alltid är `"open"`.

```json
{
  "id": "e2a7d614-93bc-4c5f-b18e-6a0d3f9c7b42",
  "reviewId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "x": 0.42,
  "y": 0.18,
  "text": "Rubriken borde vara större.",
  "status": "open",
  "createdAt": "2026-11-07T10:30:00.000Z"
}
```

Fel: 400 enligt valideringsreglerna, 404 om granskningen inte finns.

### PATCH /api/comments/:commentId

Ändrar en kommentars status. Body: `status`, exakt `"open"` eller `"resolved"`.

```json
{ "status": "resolved" }
```

Svar: 200 med den uppdaterade `ReviewComment`. Fel: 400 vid annan status, 404 om kommentaren inte finns.

## Statiska filer

- `GET /screenshots/<reviewId>.png`: skärmbilden, serverad med `express.static`. En bild som saknas ger Express vanliga 404, inte felformatet.
- `GET /test-site/`: en egen testsida för pilottestet (byggs senare).

| Metod | Sökväg | Lyckad statuskod | Möjliga felkoder |
| --- | --- | --- | --- |
| `POST` | `/api/projects` | 201 | 400 |
| `GET` | `/api/projects` | 200 | – |
| `POST` | `/api/projects/:projectId/reviews` | 201 | 400, 404 |
| `GET` | `/api/projects/:projectId/reviews` | 200 | 404 |
| `GET` | `/api/reviews/:reviewId` | 200 | 404 |
| `GET` | `/api/reviews/:reviewId/comments` | 200 | 404 |
| `POST` | `/api/reviews/:reviewId/comments` | 201 | 400, 404 |
| `PATCH` | `/api/comments/:commentId` | 200 | 400, 404 |
