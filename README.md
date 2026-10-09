# GridSense — Energie inteligentă pentru case mai verzi

Programare automată a aparatelor pentru costuri mai mici și emisii reduse.

Tagline: Power Smarter, Greener Homes

## Deploy pe Render și Vercel

Proiectul are două servicii separate: backend Flask pe Render și frontend
Next.js pe Vercel. Configurația verificată este în [backend/README.md](backend/README.md).

1. Publică modificările pe GitHub și selectează același branch în ambele platforme
   (`render.yaml` folosește `ceva`).
2. În Render creează un **Web Service Python**, cu Root Directory `backend`,
   Build Command `pip install -r req.txt && bash build.sh`, Start Command
   `gunicorn virtual_washer:app --bind 0.0.0.0:$PORT --workers 1` și Health Check
   Path `/status`. Setează `TZ=Europe/Bucharest`. Pentru un serviciu existent,
   verifică manual aceste setări; YAML-ul nu le actualizează automat.
3. Verifică URL-ul Render la `/status` și `/forecast-data`: ambele trebuie să
   răspundă cu JSON și HTTP 200 înainte să conectezi frontendul.
4. În Vercel selectează Root Directory `frontend`, Framework Preset **Next.js**,
   Install Command `npm ci`, Build Command `npm run build` și lasă Output
   Directory la valoarea implicită. Configurează `BACKEND_URL` cu adresa reală
   a serviciului Render (de exemplu `https://gridsense-backend.onrender.com`,
   înlocuită cu adresa serviciului tău) și `TZ=Europe/Bucharest` pentru mediul
   în care faci deploy, apoi redeploy. Variabila folosită de cod este
   `BACKEND_URL`; valoarea locală din `.env.example` trebuie înlocuită în Vercel.
5. Verifică `/api/score` pe URL-ul Vercel. Datele sunt citite de pe Render;
   fișierele CSV locale nu sunt disponibile în serviciul Vercel.

Pentru Python folosește versiunea din `backend/.python-version` (3.12).
Elimină un eventual `PYTHON_VERSION` setat diferit în Render, deoarece are
prioritate față de fișier. Dacă deploy-ul eșuează, păstrează primul mesaj de
eroare din build logs, nu doar ultimul mesaj „build failed”.

---

## Despre produs

GridSense automatizează programarea aparatelor casnice pentru a rula în ferestrele „ieftine & verzi”, folosind prețurile de energie și intensitatea CO₂. Rezultatul: facturi mai mici, emisii reduse și o experiență fără bătăi de cap.

Am folosit și un model de învățare automată (ML) antrenat pe date reale din România pentru a îmbunătăți prognozele de cost și intensitate de carbon și pentru a alege intervalele optime de rulare.

Ce face, pe scurt:
- Optimizează când pornesc aparatele în funcție de cost și CO₂ (multi‑obiectiv).
- Se adaptează în timp real la schimbările de preț și „verdele” din rețea.
- Îți păstrează controlul: „Pornire acum”, override cu o apăsare, calendar clar și notificări cu economiile (lei și grame CO₂).

Cum funcționează (5 pași):
1) Preluare date — mix de producție și prețuri (agregate la câteva minute).
2) Prognoză — estimăm următoarele 24 de ore pentru emisii și cost (inclusiv cu un model ML antrenat pe date din România).
3) Preferințe — stabilești deadline/ferestre interzise per aparat.
4) Optimizare — alegem slotul cu scor minim (cost + CO₂) respectând constrângerile.
5) Automatizare — trimitem semnalul la momentul optim.

---

## Structura proiectului

- `backend/` — servicii Python pentru date, model și API.
  - [backend/api.py](https://github.com/Tibi7110/GridSense/blob/main/backend/api.py) — expune API-ul (ex.: pornire optimizare, status, etc.).
  - [backend/main.py](https://github.com/Tibi7110/GridSense/blob/main/backend/main.py) — intrare pentru rulări locale/demo/simulări.
  - [backend/model.py](https://github.com/Tibi7110/GridSense/blob/main/backend/model.py) — logica de optimizare/scorare și integrarea modelului ML.
  - [backend/scor.py](https://github.com/Tibi7110/GridSense/blob/main/backend/scor.py) — metrici/funcții de scor.
  - [backend/data.py](https://github.com/Tibi7110/GridSense/blob/main/backend/data.py) — încărcare/transformare date (inclusiv seturi reale din România).
  - [backend/use.py](https://github.com/Tibi7110/GridSense/blob/main/backend/use.py) — cazuri de utilizare.
  - [backend/virtual_washer.py](https://github.com/Tibi7110/GridSense/blob/main/backend/virtual_washer.py) — simulator aparat (mașină de spălat).
  - [backend/print.py](https://github.com/Tibi7110/GridSense/blob/main/backend/print.py) — raportare/printări rezultate.
  - [backend/client.py](https://github.com/Tibi7110/GridSense/blob/main/backend/client.py) — client pentru API/integrare.
  - [backend/input/](https://github.com/Tibi7110/GridSense/tree/main/backend/input) — date de intrare (exemple).
  - [backend/Makefile](https://github.com/Tibi7110/GridSense/blob/main/backend/Makefile) — comenzi utile (rulare, instalare, etc.; rulează `make help`).

- `frontend/` — aplicație UI scrisă în TypeScript (SPA).
  - Conține interfața pentru setări, calendar, notificări și afișarea economiilor.
  - Va consuma API-ul din `backend/`.

Repo language mix: TypeScript ~63%, Python ~35.5%, altele ~1.5%.

---

## Stack tehnic

- Frontend: Next.js 15, React 19 și TypeScript, pe portul 3000 local.
- Backend: Python, Flask și Gunicorn pentru producție, pe portul 5000 local.
  - Module logice: `model.py`, `scor.py`, `use.py`, simulări în `virtual_washer.py`.
- ML/Forecasting: model ML de tip time‑series/optimizare, antrenat pe date reale din România (ex.: serii istorice OPCOM/ENTSO‑E/Electricity Maps), folosit pentru a estima costul și intensitatea CO₂ și pentru a prioritiza intervalele.
- Schimb de date: JSON peste HTTP (REST).
- Date externe: prețuri energie și intensitate CO₂ (ex.: OPCOM/ENTSO‑E/Electricity Maps) — configurabile.

Notă: Porturile de mai jos reflectă convențiile de dezvoltare; dacă proiectul tău are alte setări, urmărește mesajele din terminal la pornire sau variabilele de mediu.

---

## Cerințe

- Node.js 22 + npm
- Python 3.12
- Git

---

## Configurare (dev)

1) Clonează repo-ul
```bash
git clone https://github.com/Tibi7110/GridSense.git
cd GridSense
```

2) Backend (Python)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r req.txt
bash build.sh
python virtual_washer.py
# API disponibil la: http://127.0.0.1:5000
```

3) Frontend (TypeScript)
```bash
cd ../frontend
npm ci

# Pornește dev server
npm run dev
# UI disponibil la: http://localhost:3000
```

4) Conectează Frontend ↔ Backend
- Copiază `frontend/.env.example` în `frontend/.env.local`.
- Local, `BACKEND_URL=http://127.0.0.1:5000`; în Vercel folosește URL-ul HTTPS Render.
- Browserul apelează rutele Next.js `/api/...`, care comunică cu backendul.

---

## Porturi implicite (dev)

- Backend API: 5000 (Flask); în Render, portul este dat de `$PORT`.
- Frontend: 3000 (Next.js).

Dacă un port este ocupat, dev server-ul va alege automat altul și îl va afișa în terminal.

---

## Comenzi utile (Makefile backend)

În `backend/` există un `Makefile`. Poți rula:
```bash
cd backend
make help   # listează target-urile disponibile (dacă este definit)
make        # task implicit (de ex. run)
```

---

## Configurare date și mediu

Frontendul folosește `BACKEND_URL` și `TZ=Europe/Bucharest`.
Build-ul backendului setează `PREDICT_NEXT_DAY=true` pentru a genera previziunile
din Excelul versionat. Datele nu sunt actualizate automat zilnic; vezi
[detaliile modelului](backend/README.md).

---

## Flux tipic de utilizare (dev demo)

1) Pornește backend-ul Flask pe 5000.
2) Pornește frontend-ul Next.js pe 3000 și setează `BACKEND_URL`.
3) În UI:
   - adaugă un „aparat” (ex.: mașină de spălat vase),
   - setează „termină până la” (deadline) și ferestre interzise,
   - pornește optimizarea. Vezi calendarul propus și economiile estimate (forecast generat inclusiv de modelul ML pe date din România).
4) Folosește butonul „Pornire acum” pentru override; backend-ul reoptimizează restul zilei.

---

## Testare rapidă backend (fără UI)

- Rulări demo/simulări:
  - `python main.py` (din `backend/`) pentru scenarii de test (dacă scriptul include un demo).
  - Consultă `virtual_washer.py` pentru simularea ciclurilor unui aparat.

---

## Roadmap (pe scurt)

- v0 pilot: integrare surse date, suport câteva dispozitive prin prize/relee, UX simplu.
- v1: standarde Matter/Thread, reguli avansate per aparat, rapoarte economii/CO₂, calibrare ML pe seturi extinse din România.
- v2: integrare HVAC/EV, parteneriate utilități, API public, îmbunătățiri continue ale modelului ML.

---
