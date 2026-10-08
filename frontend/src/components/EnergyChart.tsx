"use client";

import { useState } from "react";

export type Period = "jour" | "semaine" | "mois";
const profiles = {
  jour: {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:00"],
    produced: [
      0, 0, 0, 0, 0, 0.4, 1.2, 2.1, 3.3, 4.1, 3.8, 5.2, 5.7, 5.1, 4.8, 3.7, 2.5,
      1.4, 0.5, 0, 0, 0, 0, 0,
    ],
    consumed: [
      0.8, 0.7, 0.6, 0.6, 0.7, 0.9, 1.8, 2.4, 1.9, 1.3, 1.1, 1.5, 2.2, 1.6, 1.4,
      1.8, 2.1, 2.9, 3.3, 2.8, 2.2, 1.5, 1.1, 0.8,
    ],
    max: 6,
    unit: "kW",
  },
  semaine: {
    labels: ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"],
    produced: [16, 21, 18, 25, 23, 28, 26],
    consumed: [11, 14, 12, 13, 16, 18, 14],
    max: 30,
    unit: "kWh",
  },
  mois: {
    labels: [
      "01 oct.",
      "05 oct.",
      "10 oct.",
      "15 oct.",
      "20 oct.",
      "25 oct.",
      "31 oct.",
    ],
    produced: [
      20, 24, 17, 21, 27, 22, 19, 24, 23, 27, 18, 20, 25, 22, 24, 19, 16, 21,
      25, 28, 20, 23, 27, 22, 18, 25, 23, 20, 24, 19, 22,
    ],
    consumed: [
      12, 14, 11, 15, 13, 16, 12, 11, 14, 15, 12, 14, 16, 13, 12, 14, 16, 12,
      11, 15, 14, 12, 13, 16, 12, 14, 15, 11, 13, 14, 12,
    ],
    max: 30,
    unit: "kWh",
  },
};

export function EnergyChart({ period }: { period: Period }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = profiles[period];
  const width = 650,
    height = 190,
    top = 15,
    bottom = 160,
    left = 35,
    right = 636;
  const x = (i: number) =>
    left + (i / (data.produced.length - 1)) * (right - left);
  const y = (v: number) => bottom - (v / data.max) * (bottom - top);
  const path = (values: number[]) =>
    values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const index =
    hovered === null ? null : Math.min(hovered, data.produced.length - 1);
  const pointLabel =
    index === null
      ? ""
      : period === "jour"
        ? `${String(index).padStart(2, "0")}:00`
        : period === "semaine"
          ? data.labels[index]
          : `${index + 1} octombrie`;

  return (
    <div className="chart-container">
      <div className="chart-unit">{data.unit}</div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Producție și consum demonstrative, ${period === "jour" ? "pe ore" : period === "semaine" ? "pe săptămână" : "pe lună"}. Selectează un punct pentru valori.`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#AAC887" stopOpacity=".32" />
            <stop offset="1" stopColor="#AAC887" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1={left}
              x2={right}
              y1={y((i * data.max) / 3)}
              y2={y((i * data.max) / 3)}
              stroke="#E9ECE5"
              strokeDasharray="3 5"
            />
            <text
              x="19"
              y={y((i * data.max) / 3) + 4}
              textAnchor="end"
              className="chart-label"
            >
              {(i * data.max) / 3}
            </text>
          </g>
        ))}
        <path
          d={`${path(data.produced)} L${right},${bottom} L${left},${bottom}Z`}
          fill="url(#chart-fill)"
        />
        <path
          d={path(data.produced)}
          stroke="#729A50"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={path(data.consumed)}
          stroke="#E7AE60"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
        {data.labels.map((label, i) => (
          <text
            key={label}
            x={left + (i / 6) * (right - left)}
            y="185"
            textAnchor={i === 0 ? "start" : i === 6 ? "end" : "middle"}
            className="chart-label"
          >
            {label}
          </text>
        ))}
        {index !== null && (
          <g>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={top}
              y2={bottom}
              stroke="#648264"
              strokeDasharray="4 4"
            />
            <circle
              cx={x(index)}
              cy={y(data.produced[index])}
              r="4"
              fill="#729A50"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={x(index)}
              cy={y(data.consumed[index])}
              r="4"
              fill="#E7AE60"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        )}
        {data.produced.map((value, i) => (
          <rect
            key={i}
            x={x(i) - (right - left) / data.produced.length / 2}
            y={top}
            width={(right - left) / data.produced.length}
            height={bottom - top}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${period === "jour" ? `${i}:00` : period === "semaine" ? data.labels[i] : `${i + 1} octombrie`}: produs ${value} ${data.unit}, consumat ${data.consumed[i]} ${data.unit}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            onClick={() => setHovered(i)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setHovered(i);
              }
            }}
          />
        ))}
      </svg>
      <div className="chart-detail" aria-live="polite">
        {index !== null ? (
          <>
            <strong>{pointLabel}</strong>
            <span>
              Produs: {data.produced[index]} {data.unit}
            </span>
            <span>
              Consumat: {data.consumed[index]} {data.unit}
            </span>
          </>
        ) : (
          <span>Treci peste grafic pentru a explora energia ta</span>
        )}
      </div>
    </div>
  );
}
