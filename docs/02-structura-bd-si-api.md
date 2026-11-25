# Structura bazei de date și interfețele API

Secțiunea 4 din documentația M0 cere: *structurarea datelor* (BD relațională/non-relațională, tabele, chei străine, diagrama BD) și *structurarea interfețelor aplicației* (tipuri de API, tehnologii, protocoale de comunicație). Textul de mai jos se copiază în Docmost, la secțiunea 4.

Responsabil: David Dobrin (task-urile B1–B12).

## 1. Structurarea datelor

**Tehnologie:** Convex, bază de date document-relațională, reactivă, găzduită în cloud. Schema este definită în `app/convex/schema.ts`, cu validare de tipuri la scriere. Legăturile dintre tabele (echivalentul cheilor străine) sunt câmpuri `v.id("tabel")`, verificate de Convex la inserare.

**De ce Convex:** un singur serviciu pentru bază de date, backend și autentificare; actualizări în timp real către hartă fără polling; funcții server în TypeScript, cu tipuri comune cu frontend-ul.

### Tabele

**users** (conturile; username-ul și passkey-ul sunt păstrate de Convex Auth)
| Câmp | Tip | Observații |
|------|-----|------------|
| _id | Id<users> | cheie primară |
| role | "student" \| "admin" | implicit `student` |

**places** (locațiile)
| Câmp | Tip | Observații |
|------|-----|------------|
| _id | Id<places> | cheie primară |
| name | string | |
| type | "library" \| "cafe" \| "coworking" | indexat (`by_type`) |
| address | string | |
| lat, lng | number | coordonate WGS84 |
| description, openingHours | string | |
| avgRatings | { crowdedness, outlets, quietness, wifi, safety } | medii 0–5, recalculate la fiecare recenzie |
| reviewCount | number | |

**reviews** (recenziile)
| Câmp | Tip | Observații |
|------|-----|------------|
| _id | Id<reviews> | cheie primară |
| placeId | Id<places> | cheie străină, index `by_place` |
| userId | Id<users> | cheie străină, index `by_user` |
| ratings | { crowdedness, outlets, quietness, wifi, safety } | fiecare 1–5 |
| comment | string | |
| createdAt | number | timestamp ms |

**favorites** (locuri salvate)
| Câmp | Tip | Observații |
|------|-----|------------|
| _id | Id<favorites> | cheie primară |
| userId | Id<users> | cheie străină, index `by_user` |
| placeId | Id<places> | cheie străină |
| createdAt | number | |

Index `by_user_and_place (userId, placeId)` este folosit pentru unicitate: la „adaugă la favorite" se verifică întâi dacă perechea există.

### Relații
- users 1 — N reviews; places 1 — N reviews
- users 1 — N favorites; places 1 — N favorites
- users N — M places, prin favorites

### Diagrama BD
Sursă: `docs/diagrams/er.puml` (se randează în `docs/diagrams/out/er.svg`).

### Reguli de integritate
- Rating-urile se validează pe server: întreg între 1 și 5, pentru toate cele 5 criterii.
- Mediile din `places.avgRatings` se recalculează în aceeași mutație care scrie recenzia (tranzacție atomică în Convex).
- Un utilizator are cel mult o recenzie per loc (de decis: a doua recenzie o înlocuiește pe prima).
- Ștergerea unui loc șterge și recenziile și favoritele lui.

## 2. Structurarea interfețelor aplicației (API)

**Tip de API:** funcții Convex (RPC tipizat), apelate din frontend prin clientul Convex peste **WebSocket**; query-urile sunt reactive (rezultatul se actualizează automat când se schimbă datele). Pentru testare externă (Postman, curl), Convex expune și un API HTTP:

- Query: `POST https://<deployment>.convex.cloud/api/query` cu corp `{"path":"places:list","args":{},"format":"json"}`
- Mutation: `POST .../api/mutation`, cu header `Authorization: Bearer <token>` pentru funcțiile care cer autentificare.

**Format date:** JSON; lista de locuri se poate returna și ca **GeoJSON** (FeatureCollection de puncte), compatibil cu ArcGIS.
**Autentificare:** Convex Auth, metoda username + passkey (WebAuthn); sesiunea folosește token JWT emis de Convex. Parolele nu există, deci nu se stochează hash-uri.
**Autorizare:** rolul se citește pe server (`requireAdmin`); funcțiile de admin refuză orice apelant care nu e admin.

### Catalogul funcțiilor

| Funcție | Tip | Acces | Argumente | Răspuns | Stare |
|---------|-----|-------|-----------|---------|-------|
| `users:me` | query | autentificat | – | `{ _id, username, role }` sau `null` | implementat |
| `auth:*` (signIn/signUp/signOut) | mutation/action | public | username, passkey | sesiune | implementat |
| `places:list` | query | public | – | lista locurilor | implementat |
| `places:listGeoJson` | query | public | – | GeoJSON FeatureCollection | implementat |
| `places:create` | mutation | admin | name, type, address, lat, lng, description, openingHours | id | implementat |
| `places:update` | mutation | admin | placeId + câmpuri de schimbat | – | implementat |
| `places:remove` | mutation | admin | placeId | – | implementat |
| `places:filter` | query | public | type?, minRatings? `{ crowdedness?, outlets?, quietness?, wifi?, safety? }` | lista locurilor | implementat |
| `places:nearest` | query | public | lat, lng, limit?, type? | lista `{ place, km }` sortată (Haversine) | implementat |
| `reviews:add` | mutation | autentificat | placeId, ratings (5×1–5), comment | id | implementat |
| `reviews:byPlace` | query | public | placeId | lista recenziilor | implementat |
| `favorites:toggle` | mutation | autentificat | placeId | `{ favorite: boolean }` | implementat |
| `favorites:mine` | query | autentificat | – | locurile favorite | implementat |
| `stats:dashboard` | query | public | – | nr. recenzii, medii pe criterii, top locuri | implementat |
| `places:seed` | mutation | dezvoltare | – | încarcă date inițiale | implementat (3 locuri de test) |

### Coduri de eroare
Funcțiile arată mesaje clare: `Neautentificat` (fără cont), `Doar adminul poate face asta` (rol greșit), `Rating invalid` (în afara 1–5), `Loc inexistent`.

## 3. Corespondența cu lista de task-uri B1–B12

Lista inițială a fost scrisă pentru Flask + Postgres/Supabase. Proiectul folosește Convex, deci unele task-uri se schimbă:

| Task | Ce se face în varianta Convex |
|------|-------------------------------|
| B1 Schema BD + ER | `schema.ts` (făcută) + `er.puml` |
| B2 Setup backend, .env | proiect Convex creat; `.env.local` cu `VITE_CONVEX_URL` (nu se pune în git) |
| B3 Înregistrare + login, bcrypt, JWT | Convex Auth, username + passkey; JWT emis de Convex. Fără bcrypt (nu există parole) |
| B4 Roluri | câmpul `role` + `requireAdmin` (făcut) |
| B5 API locații | `places:list`, `listGeoJson`, `create`, `update`, `remove` |
| B6 API recenzii | `reviews:add` cu validare 1–5 și recalcularea mediilor |
| B7 API favorite | `favorites:toggle`, `favorites:mine` |
| B8 API filtrare | `places:filter` |
| B9 Cel mai apropiat loc | `places:nearest` (Haversine; Convex nu are PostGIS) |
| B10 Statistici | `stats:dashboard` |
| B11 Date inițiale din GeoJSON | script de import în `places` (mutation internă) |
| B12 Testare endpoint-uri | colecție Postman pe `/api/query` și `/api/mutation` |
