"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ScoreHeader } from "@/components/ScoreHeader";
import { Timeline } from "@/components/Timeline";
import { WindowCard } from "@/components/WindowCard";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  ScorePoint,
  TimeWindow,
  findBestWindows,
} from "@/utils/scoreData";
import { toast } from "sonner";

interface HomePageProps {
  data: ScorePoint[];
}

export default function Page() {
  // Load data from backend API
  const [data, setData] = useState<ScorePoint[]>([]);
  const [apiCurrentScore, setApiCurrentScore] = useState<number | null>(null);
  const [apiCurrentColor, setApiCurrentColor] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<TimeWindow[]>([]);
  useEffect(() => {
    let mounted = true;
    fetch("/api/score")
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
  if (json?.data) setData(json.data as ScorePoint[]);
  if (typeof json?.currentScore === 'number') setApiCurrentScore(json.currentScore);
  if (typeof json?.currentColor === 'string') setApiCurrentColor(json.currentColor);
  if (typeof json?.currentTime === 'string') setCurrentTime(json.currentTime);
      })
      .catch(() => {});
    // Load recommended windows from backend
    fetch("/api/wash/windows")
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j?.ok && Array.isArray(j?.windows)) setRecommended(j.windows as TimeWindow[]);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const selectedDuration = 60;
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);
  // Compute current index by rounding now to nearest 10 minutes
  const currentIndex = useMemo(() => {
    if (!data.length) return 0;
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes();
    const bucket = Math.round(mm / 10);
    const clamped = Math.min(5, bucket);
    return hh * 6 + clamped;
  }, [data.length]);
  const currentScore = apiCurrentScore ?? (data.length ? data[Math.min(currentIndex, data.length - 1)].score : 0);

  const windows = (recommended && recommended.length > 0)
    ? recommended
    : findBestWindows(data, selectedDuration, currentScore);
  const displayWindow = selectedWindow || windows[0];

  // Find next better time
  const nextBetterIndex = data.findIndex(
    (p, i) => i > currentIndex && p.score > currentScore + 10
  );
  const nextBetterTime =
    nextBetterIndex > -1
      ? `~${Math.round((nextBetterIndex - currentIndex) * 10)} min`
      : undefined;

  const handleNotify = (window: TimeWindow) => {
    toast.success(`Notificare setată pentru ${window.start}`, {
      description: `La ora ${window.start} va începe.`,
    });
  };

  const handleDetails = (window: TimeWindow) => {
    setSelectedWindow(window);
    // Scroll to explainability section
    setTimeout(() => {
      document
        .getElementById("explainability")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Check if differences are subtle today
  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const isSubtle = maxScore - minScore < 20;
  

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header with current score */}
          <ScoreHeader
            currentScore={currentScore}
            trend="stabil"
            currentColor={apiCurrentColor ?? undefined}
            lastModified={currentTime ?? undefined}
          />

          {/* Timeline */}
          <div>
            <h2 className="mb-4 text-gray-900">Scor 24h (astăzi)</h2>
            <Timeline data={data} currentIndex={currentIndex} />
          </div>

          {/* Suggested windows */}
          <div>
            <div className="mb-4">
              <h2 className="text-gray-900">Ferestre recomandate</h2>
            </div>

            {isSubtle && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Astăzi diferențele sunt subtile. Alege orice fereastră verde
                  când îți este comod.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {windows.map((window, index) => (
                <WindowCard
                  key={index}
                  window={window}
                  onNotify={() => handleNotify(window)}
                  onDetails={() => handleDetails(window)}
                />
              ))}
            </div>
          </div>

          {/* Explainability */}
          {displayWindow && (
            <div id="explainability">
              <ExplainabilitySection window={displayWindow} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
