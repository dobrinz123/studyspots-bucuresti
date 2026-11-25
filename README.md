# <Titlu proiect> (de completat după alegerea temei)

Proiect ISI – Etapa M0 (definirea temei și documentația inițială).
Cerințe sursă: https://ocw.cs.pub.ro/courses/isi/laboratoare/08

## Structură

```
docs/
  00-brainstorming-tema.md      # pentru discuția cu echipa (alegerea temei)
  01-documentatie-initiala.md   # documentația M0 (min. 5 pagini) – copie locală pentru Docmost
  diagrams/                     # surse PlantUML (.puml) – generați PNG/SVG în diagrams/out
app/                            # aplicatia: Vite + React + TypeScript + Convex + ArcGIS
```

## Pași M0

1. Discutați și alegeți tema: `docs/00-brainstorming-tema.md`.
2. Creați cont Docmost cu mail-ul de student, adăugați un Space cu numele echipei/proiectului, selectați coordonatorul.
3. Copiați structura din `docs/01-documentatie-initiala.md` în Docmost (după modelul din cerință) și împărțiți secțiunile între membri.
4. Creați board Trello (Backlog, To Do, In Progress, Review, Done), adăugați membrii și cadrul didactic.
5. Creați repository GitHub cu acest README, accesibil cadrului didactic.
6. Adaptați diagramele din `docs/diagrams/` la tema aleasă.

## Randare diagrame PlantUML

```powershell
# necesită Java + plantuml.jar, sau extensia PlantUML din VS Code
java -jar plantuml.jar -tsvg -o out docs/diagrams/*.puml
```

## Rulare aplicație (app/)

```powershell
cd app
npm install
npx convex dev        # prima data: login + creeaza deployment; genereaza convex/_generated si scrie VITE_CONVEX_URL in .env.local
npx convex run places:seed   # date de test (alt terminal)
npm run dev
```
