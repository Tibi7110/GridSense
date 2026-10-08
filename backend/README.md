# Pornirea backendului GridSense

## Deploy Render + Vercel

Configurația `render.yaml` din rădăcină folosește branch-ul local `ceva`.
Publică modificările pe branch-ul ales și configurează același branch în ambele
servicii. Un serviciu Render existent configurat manual nu preia automat YAML-ul:
aplică setările în dashboard sau conectează un Blueprint.

| Setare Render | Valoare |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `pip install -r req.txt && bash build.sh` |
| Start Command | `gunicorn virtual_washer:app --bind 0.0.0.0:$PORT --workers 1` |
| Health Check Path | `/status` |
| Branch | `ceva` (sau branch-ul în care publici modificările) |
| Environment | `TZ=Europe/Bucharest` |

Fișierul `.python-version` selectează Python 3.12. Dacă există deja variabila
`PYTHON_VERSION` în Render, elimin-o pentru a folosi fișierul (variabila are
prioritate). Gunicorn folosește un singur worker deoarece simulatorul păstrează
starea în memorie; repornirea serviciului resetează starea.

Build-ul generează previziunile din Excelul versionat, deoarece `backend/data`
este ignorat de Git. Sunt necesare și scikit-learn, openpyxl și matplotlib.
Previziunile rămân pentru ziua următoare ultimei observații din Excel; deployment-ul
nu colectează date noi și nu asigură actualizare zilnică automată.

În Vercel: Root Directory `frontend`, variabilele `BACKEND_URL` cu URL-ul real
Render și `TZ=Europe/Bucharest`, apoi redeploy. Next.js citește previziunile de
la `/forecast-data` și trimite comenzile către backend folosind `BACKEND_URL`.
Apelurile browserului rămân către rutele Next.js `/api/...`, fără CORS suplimentar.
Fără `BACKEND_URL`, dezvoltarea locală păstrează citirea CSV-ului local.

După deploy verifică `/status`, `/forecast-data` pe Render și `/api/score` pe Vercel.

## Dezvoltare locală

Din rădăcina proiectului:

```bash
make -C backend server
```

Sau, din directorul `backend`:

```bash
venv/bin/python virtual_washer.py
```

Serverul Flask ascultă pe `http://127.0.0.1:5000`, adresa folosită de
frontend. Comenzile de mai sus folosesc mediul virtual `backend/venv`.

Verificare fără pornirea aparatului:

```bash
curl http://127.0.0.1:5000/status
curl http://127.0.0.1:5000/windows
```

## Eroarea „Attribute app not found in module api”

`api.py` conține clientul HTTP `send_api()`, nu serverul. Aplicația `app`
este definită în `virtual_washer.py` și folosește Flask (WSGI).
Comanda `uvicorn api:app` nu este comanda de pornire a acestui proiect;
folosește `make -C backend server`.

## Regenerarea previziunilor din Excel

După actualizarea fișierului `backend/input/Grafic_SEN (1).xlsx`, rulează
din rădăcina proiectului:

```bash
make -C backend model
```

Comanda citește Excelul, antrenează modelul din `model.py` și scrie rezultatele
în `backend/data`. Ziua prezisă este ziua următoare ultimei înregistrări din
Excel, nu o dată aleasă în interfață. Cu date până la 08.10.2026, predicția
este pentru 09.10.2026.

Site-ul citește cel mai recent `next_day_predictions_colored_YYYY-MM-DD.csv`.
Reîncarcă pagina după regenerare. Dacă rezultatele nu pot fi citite, site-ul
afișează o eroare, fără înlocuirea lor cu scoruri fictive.

## Mix energetic, validare și CO₂

Importul convertește explicit toate coloanele MW în numere, păstrează valorile
marcate cu `*` (indicatorul `Estimated`), elimină footerul și deduplicatează
cronologic timestampurile. Valorile lipsă/invalide nu sunt înlocuite cu zero.

`model.py` compară un Random Forest multi-output pe calendar (ora ciclică,
weekend, ultimele 14 zile) cu un profil mediu pe intervale de 10 minute din
ultimele 7 zile. Sunt prezise consumul, producția, fiecare sursă și soldul; valorile MW
viitoare nu sunt introduse ca și cum ar fi cunoscute și nici umplute cu medii
constante pe întreaga zi. Cele trei zile complete anterioare ultimei observații
sunt validate cu origine mobilă: pentru fiecare zi, istoricul se oprește în
ziua precedentă, la aceeași oră ca ultima observație din Excel. Se alege metoda
cu cea mai mică eroare medie absolută CO₂. Aceasta este validare pentru selecție,
nu test independent și nu o garanție de acuratețe. Lipsesc prognozele meteo și
programările centralelor. Raportul este `data/model_validation.json`.

La rularea din 08.10.2026: validare 05–07.10, MAE CO₂ Random Forest 88,52 g/kWh,
profil 7 zile 71,92 g/kWh; a fost selectat profilul. Predicția are 144 puncte
pentru 09.10.2026. Erorile rămân mari. Scorul se calculează din mixul prezis și păstrează coeficientul cărbunelui
+0,2 și penalizarea importului. Exportul primește un bonus pozitiv:
`scor final = scor de bază × (1 + 2,5 × max(-Sold, 0) / Consum)`.
Fiecare 1% din consum exportat adaugă 2,5% din scorul de bază. La export
de 10%, scorul crește cu 25%: de exemplu, 80 devine 100. Acesta înlocuiește penalizarea veche
a exportului. Scorul brut poate depăși 100 sau poate fi negativ la import ridicat.
Pentru ziua previzionată, dacă maximul brut depășește 100, toate punctele sunt
scalate cu același factor: `Scor_pred = Scor_raw × 100 / maximul brut`.
Altfel rămân neschimbate. Valorile negative își păstrează semnul. CSV-ul
păstrează `Scor_raw` pentru verificare; culorile și intervalele folosesc
`Scor_pred`. Scorul nu reprezintă CO₂.

În `emissions.py`, factorii ceruți sunt exprimați în **g CO₂/kWh**:

- cărbune: 1000;
- hidrocarburi: **0,286**, literal conform cererii (nu 286);
- nuclear, hidro, eolian, solar: 0;
- import: 600.

`import = max(Sold, 0)`, `pondere = max(sursă, 0) / (producție + import)`.
Intensitatea este suma ponderilor × factorii de mai sus. Ponderile din CSV sunt
fracții, nu procente 0–100. Exporturile nu produc emisii negative. Pentru
biomasă și diferența nealocată între producție și suma surselor nu a fost
specificat un factor: ponderile lor sunt exportate, dar emisiile lor sunt
**neincluse, nu declarate zero**. Rezultatul afișat este parțial și nu este LCA.

Frontendul folosește media `CO2_g_kWh` pe întregul interval × energia în kWh,
presupunând consum uniform în timp. Lipsa intensității nu declanșează un calcul
artificial din scor. Recomandările de interval păstrează ordonarea după scor;
comparatorul arată separat inclusiv când mutarea produce mai mult CO₂.

Verificări:

```bash
backend/venv/bin/python -m unittest discover -s backend/tests -v
```
