# GridSense — Energie inteligentă pentru case mai verzi

Programare automată a aparatelor pentru costuri mai mici și emisii reduse.

Tagline: Power Smarter, Greener Homes

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

- Frontend: TypeScript (SPA). Dev server tipic: Vite (implicit 5173) sau Next.js (implicit 3000).
- Backend: Python (API + motor de optimizare).
  - Server web tipic: Uvicorn/FastAPI sau Flask (dev port implicit 8000/5000).
  - Module logice: `model.py`, `scor.py`, `use.py`, simulări în `virtual_washer.py`.
- ML/Forecasting: model ML de tip time‑series/optimizare, antrenat pe date reale din România (ex.: serii istorice OPCOM/ENTSO‑E/Electricity Maps), folosit pentru a estima costul și intensitatea CO₂ și pentru a prioritiza intervalele.
- Schimb de date: JSON peste HTTP (REST).
- Date externe: prețuri energie și intensitate CO₂ (ex.: OPCOM/ENTSO‑E/Electricity Maps) — configurabile.

Notă: Porturile de mai jos reflectă convențiile de dezvoltare; dacă proiectul tău are alte setări, urmărește mesajele din terminal la pornire sau variabilele de mediu.

---

## Cerințe

- Node.js LTS (>=18) + npm/pnpm/yarn
- Python 3.10+ (recomandat 3.11)
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

# Dacă există requirements.txt sau pyproject.toml, rulează:
# pip install -r requirements.txt
# sau:
# pip install -U pip && pip install fastapi uvicorn[standard] pydantic requests numpy pandas

# Rulează API-ul (convenție FastAPI/Uvicorn):
uvicorn api:app --reload --port 8000
# API disponibil la: http://localhost:8000
# (Dacă aplicația este Flask, încearcă: flask run --port 5000)
```

3) Frontend (TypeScript)
```bash
cd ../frontend
# alege managerul tău de pachete:
npm install
# sau: pnpm install / yarn install

# Pornește dev server
npm run dev
# Port tipic: 5173 (Vite) sau 3000 (Next.js).
# UI disponibil de obicei la: http://localhost:5173 sau http://localhost:3000
```

4) Conectează Frontend ↔ Backend
- Configurează URL-ul backend-ului în variabilele de mediu ale frontend-ului, ex.:
  - Vite: `VITE_API_URL=http://localhost:8000`
  - Next.js: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Creează un fișier `.env` în `frontend/` dacă proiectul îl folosește și adaugă variabila conform build tool-ului.

---

## Porturi implicite (dev)

- Backend API: 8000 (Uvicorn/FastAPI) sau 5000 (Flask)
- Frontend: 5173 (Vite) sau 3000 (Next.js)

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

Variabile de mediu uzuale (exemple):
- `API_PORT` (implicit 8000)
- `API_HOST` (implicit 0.0.0.0 sau 127.0.0.1)
- `PRICE_SOURCE` (ex.: OPCOM, mock)
- `CO2_SOURCE` (ex.: ENTSOE, ElectricityMaps)
- `API_KEY_*` pentru providerii de date (dacă este cazul)

Creează `.env` în `backend/` și setează valorile necesare.

---

## Flux tipic de utilizare (dev demo)

1) Pornește backend-ul (API) pe 8000.
2) Pornește frontend-ul pe 5173 (sau 3000) și setează `API_URL`.
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
