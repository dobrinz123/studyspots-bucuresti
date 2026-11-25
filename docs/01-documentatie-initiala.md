# Documentație inițială – StudySpots București

> Minim 5 pagini (inclusiv diagrame). Fiecare membru dezvoltă secțiunile alese. Copiați în Docmost.
> Titlul „StudySpots București” este provizoriu.

## 1. Introducere

### Echipa proiectului
| Nume | Grupa | Rol |
|------|-------|-----|
|      |       | Lider de echipă |
|      |       | Membru |
|      |       | Membru |

### Link-uri proiect
| Resursă | Link | Observații |
|---------|------|------------|
| Board Trello | https://trello.com/b/<board-id> | Toți membrii + cadrul didactic. Coloane: Backlog, To Do, In Progress, Review, Done |
| Repository GitHub | https://github.com/dobrinz123/studyspots-bucuresti | Cu README, accesibil cadrului didactic |
| Aplicația (demo final) | https://example.com | După publicare |

## 2. Tema generală și obiectivele propuse

**Context.** Studenții din București caută locuri bune de învățat (biblioteci, cafenele, spații de coworking), dar informațiile despre ele sunt împrăștiate: hărțile generale arată doar program și rating general, nu și lucrurile care contează pentru studiu (liniște, prize, Wi-Fi, aglomerație, siguranța zonei).

**Soluție.** O aplicație web GIS care arată pe hartă locurile potrivite pentru învățat din București. Studenții lasă recenzii cu rating pe criterii, salvează locuri la favorite, filtrează după criterii și găsesc cel mai apropiat loc de poziția lor. Adminul gestionează locațiile direct pe hartă, iar un dashboard arată statistici despre ratinguri și recenzii.

**Obiective**
- O1: afișarea pe hartă a locurilor de învățat din București, pe tipuri (bibliotecă / cafenea / coworking).
- O2: recenzii cu rating pe 5 criterii: aglomerație, prize, liniște, Wi-Fi, siguranța zonei.
- O3: filtrare după criterii (ex. „liniște ≥ 4 și prize ≥ 4”).
- O4: găsirea celui mai apropiat loc de poziția utilizatorului (geolocalizare).
- O5: favorite per utilizator.
- O6: administrare locații direct pe hartă (adăugare, editare, ștergere).
- O7: dashboard cu statistici despre ratinguri și recenzii.

**Ce NU facem (scope):** rezervări de locuri, plăți, chat, aplicație mobilă nativă.

## 3. Studiu de piață – aplicații / abordări similare
_De verificat și completat de echipă cu capturi și link-uri reale; mai jos sunt candidații de analizat._

| Aplicație | Ce face bine | Limitări pentru studenți | Ce facem diferit |
|-----------|--------------|--------------------------|------------------|
| Google Maps | Acoperire completă, program, rating general | Fără criterii de studiu (prize, liniște, Wi-Fi) | Rating pe criterii specifice studiului |
| Workfrom (workfrom.co) | Locuri pentru lucru remote cu Wi-Fi, prize, zgomot | Focus global/remote work, slabă acoperire în București | Focus pe București și pe studenți, include biblioteci |
| Foursquare / Yelp | Recenzii și tips | Recenzii generale, nu structurate pe criterii | Rating structurat, filtrare pe criterii |

## 4. Arhitectura generală a aplicației
![Arhitectură](diagrams/out/architecture.svg)
Sursă: `diagrams/architecture.puml`

Frontend web cu hartă ArcGIS, backend și bază de date în **Convex** (funcții server TypeScript, actualizări reactive prin WebSocket).

### Structurarea datelor
BD **Convex** (document-relațională). Schema în `convex/schema.ts`; legăturile între documente prin `v.id("tabel")`.

| Tabel | Câmpuri principale | Relații |
|-------|--------------------|---------|
| users | role (`student` / `admin`); username și passkey în componentele Convex Auth | – |
| places | name, type (`library` / `cafe` / `coworking`), address, lat, lng, description, openingHours, avgRatings (5 medii), reviewCount | – |
| reviews | placeId, userId, crowdedness, outlets, quietness, wifi, safety (1–5), comment, createdAt | placeId → places, userId → users |
| favorites | userId, placeId, createdAt | userId → users, placeId → places |

Indecși: `reviews.by_place`, `favorites.by_user`, `favorites.by_user_place` (unicitate), `places.by_type`.
Mediile pe criterii se recalculează la fiecare recenzie (mutation) și se păstrează în `places.avgRatings`, pentru filtrare rapidă.

![Diagrama BD](diagrams/out/er.svg)
Sursă: `diagrams/er.puml`

### Structurarea interfețelor aplicației (API)
Funcții Convex apelate din client (WebSocket, reactiv):
- query: `places.list`, `places.filter`, `places.nearest`, `reviews.byPlace`, `favorites.mine`, `stats.dashboard`
- mutation: `reviews.add`, `favorites.toggle`, `places.create|update|remove` (doar admin)
- Autentificare: Convex Auth, cu verificarea rolului pe server pentru operațiile admin.
- Cel mai apropiat loc: coordonatele din Geolocation API ale browserului; distanța se calculează (Haversine) în query, deoarece Convex nu are interogări geospațiale native.

### Structurarea interfeței cu utilizatorul
- Hartă pe tot ecranul (ArcGIS), markere pe tip de loc.
- Panou lateral: filtre (criterii, tip), lista rezultatelor, buton „Cel mai apropiat loc”.
- Popup/detalii loc: ratinguri pe criterii, recenzii, buton favorit, formular recenzie.
- Mod admin: adăugare/editare/ștergere pe hartă (click pentru poziție, formular).
- Pagina Dashboard: grafice. Pagina Favorite.
- _Mockup-uri: de adăugat (Figma / draw.io)._

## 5. Cazuri de utilizare și funcționalități
![Use case](diagrams/out/use-case.svg)
Sursă: `diagrams/use-case.puml`

### Lista funcționalităților
| ID | Funcționalitate | Actor | Prioritate |
|----|-----------------|-------|------------|
| F1 | Autentificare / înregistrare | Student, Admin | Must |
| F2 | Vizualizare locuri pe hartă | Student | Must |
| F3 | Detalii loc (ratinguri medii, recenzii) | Student | Must |
| F4 | Adăugare recenzie cu rating pe 5 criterii | Student | Must |
| F5 | Filtrare după criterii și tip | Student | Must |
| F6 | Cel mai apropiat loc de poziția mea | Student | Must |
| F7 | Salvare / eliminare favorite | Student | Should |
| F8 | Adăugare loc pe hartă | Admin | Must |
| F9 | Editare loc | Admin | Must |
| F10 | Ștergere loc | Admin | Must |
| F11 | Dashboard statistici ratinguri și recenzii | Student, Admin | Should |
| F12 | Moderare recenzii (ștergere) | Admin | Could |

## 6. Modelarea procesului
Fluxul modelat: **adăugarea unei recenzii** (autentificare, validare, salvare, recalculare medii, actualizare hartă). Include decizii, scenariu de eroare și separare utilizator/sistem.

![Activități](diagrams/out/activity.svg)
Sursă: `diagrams/activity.puml`

## 7. Tehnologii
### Generale
- **Convex**: bază de date, backend, timp real, autentificare (Convex Auth).
- **ArcGIS Maps SDK for JavaScript**: harta, markere, popup, widget Sketch pentru editare.
- Frontend: _de ales de echipă_ (Angular – laborator 04, sau React).
- Grafice dashboard: Chart.js (sau ArcGIS charts).
- Geolocation API (browser) pentru poziția utilizatorului.
- Git/GitHub, Trello, Docmost.

### Specifice
- Markere locuri: `GraphicsLayer` (sau `FeatureLayer` din surse client-side) populat din `places.list`; simbol diferit pe tip.
- Popup: `PopupTemplate` cu ratinguri medii; recenziile se încarcă din Convex la deschidere.
- Filtrare: `places.filter` în Convex + actualizarea layerului; alternativ `FeatureFilter` pe layer.
- Cel mai apropiat loc: `navigator.geolocation` + Haversine în query; poziția utilizatorului desenată ca marker separat.
- Editare pe hartă (admin): click pe hartă pentru coordonate, `Sketch` pentru mutare, formular pentru atribute; mutation Convex cu verificare de rol.
- Parole/sesiuni: gestionate de Convex Auth (fără stocare proprie de parole).

## 8. Organizare
### Planificarea activităților
| Task | Descriere precisă | Responsabil | Etapă |
|------|-------------------|-------------|-------|
| T1 | Creare repo GitHub, board Trello, Space Docmost | | M0 |
| T2 | Inițializare proiect Convex și frontend | | M1 |
| T3 | Definire `schema.ts` (users, places, reviews, favorites) | David Dobrin | M1 |
| T4 | Inițializare hartă ArcGIS centrată pe București | | M1 |
| T5 | Script de seed cu ~30 locuri reale din București | | M1 |
| T6 | Autentificare (Convex Auth) + roluri student/admin | David Dobrin | M2 |
| T7 | Afișare locuri pe hartă cu simbol pe tip | | M2 |
| T8 | Popup/panou detalii loc cu ratinguri medii | | M2 |
| T9 | Formular recenzie + mutation `reviews.add` + recalculare medii | | M2 |
| T10 | Filtre pe criterii și tip | | M2 |
| T11 | Geolocalizare + `places.nearest` + marker poziție | | M2 |
| T12 | Favorite (toggle + pagină) | | M3 |
| T13 | Adăugare loc pe hartă (admin) | | M3 |
| T14 | Editare / mutare / ștergere loc (admin) | | M3 |
| T15 | Query-uri statistici + dashboard cu grafice | | M3 |
| T16 | Teste, corectări, deploy, pregătire prezentare | | M4 |

Diagrama Gantt: `diagrams/gantt.puml`

### Identificarea riscurilor
| Risc | Prob. (1–5) | Impact (1–5) | Scor | Măsură de contracarare |
|------|-------------|--------------|------|------------------------|
| Nu terminăm la timp | 3 | 5 | 15 | MVP întâi (F1–F6), restul pe prioritate; task-uri mici |
| Convex nou pentru echipă | 3 | 4 | 12 | Spike de 1 zi în M1; documentația și starter-ul oficial |
| Lipsă date reale despre locuri | 4 | 3 | 12 | Seed manual din locuri reale + recenziile echipei |
| Geolocalizarea refuzată / imprecisă | 3 | 2 | 6 | Fallback: alegere manuală a poziției pe hartă |
| Complexitatea editării pe hartă (admin) | 3 | 3 | 9 | Etapizare: adăugare întâi, apoi editare/ștergere |
| Membru indisponibil | 2 | 4 | 8 | Task-uri documentate în Trello, pair work |
