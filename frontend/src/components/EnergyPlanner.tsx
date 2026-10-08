"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Clock3,
  Info,
  Leaf,
  LoaderCircle,
  WashingMachine,
  Zap,
} from "lucide-react";
import { findBestWindows, ScorePoint, TimeWindow } from "@/utils/scoreData";
import {
  consumptionImpact,
  cycleAverage,
  timeInMinutes,
} from "@/utils/consumptionImpact";
import { Timeline } from "@/components/Timeline";
import { toast } from "sonner";

const appliances = [
  { id: "washer", name: "Mașina de spălat rufe", kwh: "1.2", duration: 60 },
  { id: "dishwasher", name: "Mașina de spălat vase", kwh: "1", duration: 90 },
  { id: "car", name: "Încărcare mașină electrică", kwh: "7", duration: 120 },
  { id: "other", name: "Alt consumator", kwh: "1", duration: 60 },
];
const format = (value: number, digits = 1) =>
  new Intl.NumberFormat("ro-RO", { maximumFractionDigits: digits }).format(
    value,
  );
function endTime(start: string, duration: number) {
  const minutes = timeInMinutes(start) + duration;
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function EnergyPlanner() {
  const [data, setData] = useState<ScorePoint[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "live">("loading");
  const [duration, setDuration] = useState(60);
  const [appliance, setAppliance] = useState("washer");
  const [kwh, setKwh] = useState("1.2");
  const [baselineStart, setBaselineStart] = useState("18:00");
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setClock(new Date());
    const tick = window.setInterval(() => setClock(new Date()), 60000);
    fetch("/api/score", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Date indisponibile");
        const result = await response.json();
        if (
          !Array.isArray(result.data) ||
          !result.data.length ||
          !result.data.every(
            (point: ScorePoint) =>
              typeof point.time === "string" &&
              /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(point.time) &&
              Number.isFinite(point.score) &&
              !isNaN(new Date(point.timestamp).getTime()),
          )
        )
          throw new Error("Date invalide");
        if (!mounted) return;
        const sorted: ScorePoint[] = [...result.data].sort(
          (a: ScorePoint, b: ScorePoint) => a.time.localeCompare(b.time),
        );
        setData(sorted);
        setStatus("live");
        if (
          typeof result.lastModified === "string" &&
          !isNaN(new Date(result.lastModified).getTime())
        )
          setLastUpdated(result.lastModified);
      })
      .catch(() => {
        if (mounted) {
          setData([]);
          setLastUpdated(null);
          setStatus("error");
        }
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timeout);
      window.clearInterval(tick);
    };
  }, [reloadKey]);

  const nowKey = clock
    ? `${String(clock.getHours()).padStart(2, "0")}:${String(Math.floor(clock.getMinutes() / 10) * 10).padStart(2, "0")}`
    : "00:00";
  const currentIndex = data.findIndex((point) => point.time === nowKey);
  const currentScore = data[currentIndex]?.score ?? null;
  const baseline = cycleAverage(data, baselineStart, duration);
  const windows = useMemo(
    () =>
      findBestWindows(data, duration, baseline ?? 0)
        .filter((window) => cycleAverage(data, window.start, duration) !== null)
        .map((window) => {
          const avgScore = cycleAverage(data, window.start, duration)!;
          return {
            ...window,
            avgScore,
            deltaVsNow: avgScore - (baseline ?? 0),
          };
        }),
    [data, duration, baseline],
  );
  const selectedWindow =
    windows.find((window) => window.start === selectedStart) ?? windows[0];
  const afterScore = selectedWindow
    ? cycleAverage(data, selectedWindow.start, duration)
    : null;
  const energy = Number(kwh.replace(",", "."));
  const energyValid =
    kwh.trim() !== "" &&
    Number.isFinite(energy) &&
    energy > 0 &&
    energy <= 1000;
  const beforeIntensity = cycleAverage(
    data,
    baselineStart,
    duration,
    "co2Intensity",
  );
  const afterIntensity = selectedWindow
    ? cycleAverage(data, selectedWindow.start, duration, "co2Intensity")
    : null;
  const impact =
    beforeIntensity !== null && afterIntensity !== null && energyValid
      ? consumptionImpact(beforeIntensity, afterIntensity, energy)
      : null;
  const isHistorical =
    status === "live" &&
    !!data[0] &&
    !!clock &&
    new Date(data[0].timestamp).getTime() <
      new Date(clock).setHours(0, 0, 0, 0);
  const isToday =
    status === "live" &&
    data[0] &&
    clock &&
    new Date(data[0].timestamp).toDateString() === clock.toDateString();
  const predictionDate =
    status === "live" && data[0]
      ? new Date(data[0].timestamp).toLocaleDateString("ro-RO")
      : "—";
  const currentColor =
    data[currentIndex]?.color ||
    (currentScore !== null && currentScore >= 75
      ? "green"
      : currentScore !== null && currentScore >= 50
        ? "yellow"
        : "red");

  function downloadReminder(window: TimeWindow) {
    const point = data.find((point) => point.time === window.start);
    if (!point) return;
    const date = new Date(point.timestamp);
    if (date.getTime() < Date.now()) {
      toast.error(
        "Acest interval este în trecut. Sunt necesare previziuni actualizate.",
      );
      return;
    }
    const stamp = (value: Date) =>
      value
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    const name =
      appliances.find((item) => item.id === appliance)?.name ??
      "Consum electric";
    const file = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GridSense//Energy Planner//RO",
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}@gridsense.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(date)}`,
      `DTEND:${stamp(new Date(date.getTime() + duration * 60000))}`,
      `SUMMARY:GridSense - ${name}`,
      "DESCRIPTION:Recomandare de consum. Aparatul nu este pornit automat.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([file], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "gridsense-interval.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Memento descărcat", {
      description: "Importă fișierul în calendarul tău.",
    });
  }
  async function checkDevice() {
    setBusy(true);
    try {
      const response = await fetch("/api/wash/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ when: new Date().toISOString() }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error();
      if (result.triggered)
        toast.success("Aparatul a pornit", {
          description: "Pornire confirmată de serviciul de control.",
        });
      else
        toast.info("Aparatul nu a pornit", {
          description: "Condițiile actuale nu îndeplinesc regulile de pornire.",
        });
    } catch {
      toast.error("Serviciul de control nu este disponibil", {
        description:
          "Nu a fost confirmată pornirea aparatului. Încearcă din nou după conectarea serviciului.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (status === "error") {
    return (
      <section
        className="panel planner-panel consumption-planner"
        id="energie"
        aria-labelledby="forecast-error-title"
      >
        <h2 id="forecast-error-title">Previziunile nu sunt disponibile</h2>
        <p className="historical-note" role="alert">
          <Info size={17} /> Nu am putut citi datele modelului. Nu sunt afișate
          scoruri demonstrative în locul lor.
        </p>
        <button
          className="button forest-button"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Reîncearcă încărcarea
        </button>
      </section>
    );
  }

  return (
    <section className="panel planner-panel consumption-planner" id="energie">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CONSUM INTELIGENT PENTRU TOATĂ LUMEA</span>
          <h2>Scorul rețelei și impactul consumului tău</h2>
          <p>
            Alege o oră mai bună pentru același consum. Nu ai nevoie de panouri
            solare.
          </p>
        </div>
        <span
          className={`data-badge ${status === "live" && !isHistorical ? "live" : ""}`}
        >
          <i />
          {status === "loading"
            ? "Se încarcă"
            : `${isHistorical ? "Arhivă" : "Previziune"} · ${predictionDate}`}
        </span>
      </div>
      {isHistorical && (
        <p className="historical-note">
          <Info size={17} /> Datele sunt din {predictionDate}. Comparația este
          un scenariu pe date istorice, nu o recomandare pentru astăzi.
        </p>
      )}
      <div
        className="consumer-stats"
        aria-label="Statistici de sustenabilitate"
      >
        <article className={`consumer-stat current-score tone-${currentColor}`}>
          <span>
            {status === "loading"
              ? "Se încarcă scorul estimat"
              : `Scor estimat la ${nowKey} · ${predictionDate}`}
          </span>
          <strong>
            {currentScore === null ? "—" : format(currentScore)}
            <small>puncte</small>
          </strong>
          <p>Scorul original include producția și soldul rețelei.</p>
        </article>
        <article className="consumer-stat">
          <span>Scor în intervalul ales</span>
          <strong>
            {afterScore === null ? "—" : format(afterScore)}
            <small>puncte</small>
          </strong>
          <p>
            {selectedWindow
              ? `${selectedWindow.start} – ${endTime(selectedWindow.start, duration)} · ${duration} minute`
              : "Se caută intervalele disponibile"}
          </p>
        </article>
        <article className="consumer-stat impact-stat">
          <span>
            {impact && impact.avoidedGrams < 0
              ? "Emisii suplimentare estimate"
              : "CO₂ evitat dacă muți consumul"}
          </span>
          <strong>
            {impact ? format(Math.abs(impact.avoidedGrams), 0) : "—"}
            <small>g CO₂*</small>
          </strong>
          <p>
            Estimare pentru {energyValid ? format(energy) : "—"} kWh, față de
            intervalul de la {baselineStart}. *Sursele cu factori specificați.
          </p>
        </article>
      </div>
      <div className="score-section-heading">
        <h3>Scor 24h {isToday ? "(astăzi)" : `· ${predictionDate}`}</h3>
        {lastUpdated && (
          <span>
            Actualizare fișier:{" "}
            {new Date(lastUpdated).toLocaleString("ro-RO", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
      <Timeline
        data={data}
        currentIndex={currentIndex}
        onSelectTime={setBaselineStart}
      />

      <div className="shift-config">
        <div className="shift-heading">
          <span className="stat-icon mint">
            <WashingMachine size={25} />
          </span>
          <div>
            <h3>Dacă îmi mut consumul?</h3>
            <p>
              Compară același aparat și aceeași cantitate de energie la ore
              diferite.
            </p>
          </div>
        </div>
        <div className="shift-fields">
          <label htmlFor="appliance">
            Ce vrei să folosești?
            <select
              id="appliance"
              value={appliance}
              onChange={(event) => {
                const next = appliances.find(
                  (item) => item.id === event.target.value,
                )!;
                setAppliance(next.id);
                setKwh(next.kwh);
                setDuration(next.duration);
                setSelectedStart(null);
              }}
            >
              {appliances.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="baseline-start">
            Ora obișnuită de pornire
            <select
              id="baseline-start"
              value={baselineStart}
              onChange={(event) => setBaselineStart(event.target.value)}
            >
              {Array.from({ length: 144 }, (_, i) => {
                const time = `${String(Math.floor(i / 6)).padStart(2, "0")}:${String((i % 6) * 10).padStart(2, "0")}`;
                return <option key={time}>{time}</option>;
              })}
            </select>
          </label>
          <label htmlFor="cycle-energy">
            Consum estimat pe ciclu (kWh)
            <input
              id="cycle-energy"
              inputMode="decimal"
              value={kwh}
              aria-invalid={!energyValid}
              aria-describedby="energy-assumption"
              onChange={(event) => setKwh(event.target.value)}
            />
          </label>
        </div>
        <div className="shift-duration">
          <span>Durata consumului</span>
          <div className="segmented duration-control" aria-label="Durată">
            {[30, 60, 90, 120].map((value) => (
              <button
                key={value}
                aria-pressed={duration === value}
                className={duration === value ? "selected" : ""}
                onClick={() => {
                  setDuration(value);
                  setSelectedStart(null);
                }}
              >
                {value} min
              </button>
            ))}
          </div>
        </div>
        <p
          id="energy-assumption"
          className={`energy-assumption ${!energyValid ? "invalid" : ""}`}
        >
          {energyValid
            ? "Valorile aparatelor sunt orientative. Ajustează consumul după eticheta sau măsurătorile aparatului tău."
            : "Introdu un consum valid, mai mare decât 0 și de cel mult 1.000 kWh."}
        </p>
      </div>

      <div className="score-section-heading">
        <h3>Ferestre recomandate</h3>
        <span>Alege un interval pentru a compara impactul.</span>
      </div>
      <div className="recommended-windows">
        {windows.map((window, index) => (
          <article
            key={`${window.start}-${duration}`}
            className={`recommended-window ${selectedWindow?.start === window.start ? "best" : ""}`}
          >
            <button
              className="select-window"
              aria-pressed={selectedWindow?.start === window.start}
              onClick={() => setSelectedStart(window.start)}
            >
              <span className="window-caption">
                {index === 0
                  ? "Cel mai bun interval"
                  : `Alternativa ${index + 1}`}
                {selectedWindow?.start === window.start && <Check size={16} />}
              </span>
              <strong>
                <Clock3 size={18} />
                {window.start} – {endTime(window.start, duration)}
              </strong>
              <span>
                Scor {format(cycleAverage(data, window.start, duration) ?? 0)}
                puncte · {duration} minute
              </span>
              <span>
                {baseline !== null
                  ? `${window.deltaVsNow > 0 ? "+" : ""}${format(window.deltaVsNow)} puncte față de ora aleasă`
                  : "Alege o oră de pornire cu date complete"}
              </span>
            </button>
            <button
              className="icon-button"
              aria-label={`Descarcă în calendar intervalul ${window.start}`}
              title="Descarcă în calendar"
              onClick={() => downloadReminder(window)}
            >
              <CalendarPlus size={21} />
            </button>
          </article>
        ))}
      </div>
      {status !== "loading" && !windows.length && (
        <p className="empty-state">
          Nu există suficiente date consecutive pentru această durată.
        </p>
      )}

      <div className="shift-result" aria-live="polite">
        <div className="shift-result-heading">
          <Leaf size={23} />
          <h3>Impactul mutării consumului</h3>
        </div>
        {impact && selectedWindow ? (
          <>
            <div className="shift-comparison">
              <div>
                <span>Ora obișnuită</span>
                <strong>
                  {baselineStart} – {endTime(baselineStart, duration)}
                </strong>
                <p>Scor mediu {format(baseline!)}</p>
                <span>~{format(impact.beforeGrams, 0)} g CO₂</span>
              </div>
              <ArrowRight size={25} />
              <div>
                <span>Intervalul selectat</span>
                <strong>
                  {selectedWindow.start} –{" "}
                  {endTime(selectedWindow.start, duration)}
                </strong>
                <p>Scor mediu {format(afterScore!)}</p>
                <span>~{format(impact.afterGrams, 0)} g CO₂</span>
              </div>
            </div>
            <p className="impact-conclusion">
              {impact.avoidedGrams > 0.5 ? (
                <>
                  Cu același consum de <strong>{format(energy)} kWh</strong>, ai
                  evita aproximativ{" "}
                  <strong>{format(impact.avoidedGrams, 0)} g CO₂</strong>.
                </>
              ) : impact.avoidedGrams < -0.5 ? (
                <>
                  Intervalul selectat ar genera aproximativ{" "}
                  <strong>
                    {format(-impact.avoidedGrams, 0)} g CO₂ în plus
                  </strong>
                  . Păstrează ora obișnuită sau alege un alt interval.
                </>
              ) : (
                <>
                  Impactul estimat este similar. Alege intervalul care îți este
                  mai comod.
                </>
              )}
            </p>
          </>
        ) : (
          <p className="empty-state">
            {baseline === null
              ? "Nu avem date pentru întregul ciclu la ora aleasă. Alege o oră mai devreme; comparația se limitează la ziua afișată."
              : !energyValid
                ? "Introdu un consum valid pentru a calcula impactul."
                : "Lipsesc datele mixului energetic pentru CO₂. Regenerează previziunea."}
          </p>
        )}
        <details className="impact-method">
          <summary>Cum este estimat impactul?</summary>
          <p>
            Intensitate = (cărbune % / 100) × 1000 + (hidrocarburi % / 100) ×
            0,286 + (import % / 100) × 600, în g CO₂/kWh. Nuclear, hidro, eolian
            și solar: 0 g/kWh. Am păstrat pentru hidrocarburi valoarea cerută de
            0,286 g/kWh.
          </p>
          <p>
            Ponderile se raportează la producția totală + importul net pozitiv.
            Exportul nu produce emisii negative. Biomasa și producția nealocată
            nu au un factor specificat și nu sunt incluse: rezultatul este
            parțial. Mixul este estimat din Excel, nu măsurat pentru ziua
            viitoare.
          </p>
          <p>
            Emisii = intensitatea medie a intervalului × consumul în kWh.
            Presupunem consum uniform pe durata aleasă. Scorul original este
            separat de CO₂ și poate fi negativ; un scor mai mare nu garantează
            emisii mai mici. Culorile compară scorurile zilei, nu praguri
            absolute. Comparația nu calculează economii la factură.
          </p>
        </details>
      </div>
      {appliance === "washer" && (
        <div className="device-start">
          <p>
            Ai mașina de spălat conectată la GridSense? Serviciul de control
            verifică dacă poate porni acum.
          </p>
          <button
            className="button forest-button"
            onClick={checkDevice}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Zap size={18} />
            )}
            Verifică și pornește acum
          </button>
        </div>
      )}
    </section>
  );
}
