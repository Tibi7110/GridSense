"use client";

import { useState } from "react";
import {
  ScorePoint,
  calculatePercentile,
  getScoreColor,
} from "@/utils/scoreData";

interface TimelineProps {
  data: ScorePoint[];
  currentIndex: number;
  onSelectTime?: (time: string) => void;
}

export function Timeline({ data, currentIndex, onSelectTime }: TimelineProps) {
  const [inspected, setInspected] = useState<number | null>(null);
  const p25 = calculatePercentile(data, 25);
  const p50 = calculatePercentile(data, 50);
  const p70 = calculatePercentile(data, 70);
  const point = data[inspected ?? currentIndex];
  const colorFor = (point: ScorePoint) =>
    ["green", "yellow", "orange", "red"].includes(point.color || "")
      ? point.color
      : getScoreColor(point.score, p25, p50, p70);

  if (!data.length)
    return <p className="empty-state">Se încarcă scorurile rețelei…</p>;
  return (
    <div className="score-timeline">
      <div
        className="timeline-scroll"
        role="region"
        aria-label="Scorul rețelei pe 24 de ore; derulează pentru toate orele"
        tabIndex={0}
      >
        <div className="timeline-inner">
          <div className="timeline-segments">
            {data.map((entry, index) => (
              <button
                key={`${entry.time}-${index}`}
                type="button"
                className={`timeline-segment score-${colorFor(entry)} ${index === currentIndex ? "is-current" : ""}`}
                tabIndex={
                  index === (inspected ?? Math.max(0, currentIndex)) ? 0 : -1
                }
                aria-label={`${entry.time}: scor ${entry.score.toFixed(1)}. Alege ca oră de consum.`}
                title={`${entry.time} · ${entry.score.toFixed(1)}`}
                onMouseEnter={() => setInspected(index)}
                onMouseLeave={() => setInspected(null)}
                onFocus={() => setInspected(index)}
                onClick={() => {
                  setInspected(index);
                  onSelectTime?.(entry.time);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                    return;
                  event.preventDefault();
                  const next = Math.max(
                    0,
                    Math.min(
                      data.length - 1,
                      index + (event.key === "ArrowRight" ? 1 : -1),
                    ),
                  );
                  const buttons =
                    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                      "button",
                    );
                  buttons?.[next].focus();
                }}
              />
            ))}
          </div>
          <div className="timeline-labels">
            {[
              "00:00",
              "03:00",
              "06:00",
              "09:00",
              "12:00",
              "15:00",
              "18:00",
              "21:00",
            ].map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="timeline-caption">
        <span>
          {point
            ? `${point.time} · Scor ${point.score.toFixed(1)}`
            : "Selectează o oră"}
        </span>
        <span>Alege un segment pentru comparație.</span>
      </div>
      <div className="timeline-legend">
        <span>
          <i className="score-green" />
          Favorabil
        </span>
        <span>
          <i className="score-yellow" />
          Moderat
        </span>
        <span>
          <i className="score-orange" />
          Mai puțin favorabil
        </span>
        <span>
          <i className="score-red" />
          Nefavorabil
        </span>
      </div>
    </div>
  );
}
