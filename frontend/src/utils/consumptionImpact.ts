import type { ScorePoint } from "./scoreData";

export function timeInMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function cycleAverage(
  data: ScorePoint[],
  start: string,
  duration: number,
  field: "score" | "co2Intensity" = "score",
): number | null {
  const startMinute = timeInMinutes(start);
  if (
    !Number.isFinite(startMinute) ||
    duration <= 0 ||
    duration % 10 !== 0 ||
    startMinute + duration > 1440
  )
    return null;
  const scores = new Map(
    data.map((point) => [timeInMinutes(point.time), point[field]]),
  );
  let sum = 0;
  for (let offset = 0; offset < duration; offset += 10) {
    const score = scores.get(startMinute + offset);
    if (score === undefined || !Number.isFinite(score)) return null;
    sum += score;
  }
  return sum / (duration / 10);
}

// Intensities are calculated from the forecast mix in the backend, in g/kWh.
// Uniform energy consumption across equal ten-minute buckets is assumed.
export function consumptionImpact(before: number, after: number, kwh: number) {
  return {
    beforeGrams: before * kwh,
    afterGrams: after * kwh,
    avoidedGrams: (before - after) * kwh,
  };
}
