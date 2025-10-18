"use client";

import React, { useState, useMemo } from "react";
import { generateMockScoreData } from "@/utils/scoreData";
import { ScoreHeader } from "@/components/ScoreHeader";
import { Timeline } from "@/components/Timeline";
import { WindowCard } from "@/components/WindowCard";
import { DurationChips } from "@/components/DurationChips";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  ScorePoint,
  TimeWindow,
  findBestWindows,
  getCurrentTimeIndex,
} from "@/utils/scoreData";
import { toast } from "sonner";

interface HomePageProps {
  data: ScorePoint[];
}

export default function Page() {
  // Generate mock data once
  const data = useMemo(() => generateMockScoreData(), []);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);
  const currentIndex = getCurrentTimeIndex();
  const currentScore = data[currentIndex].score;

  const windows = findBestWindows(data, selectedDuration, currentScore);
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
      description: `Vei primi o notificare când începe fereastra ta favorabilă.`,
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
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header with current score */}
          <ScoreHeader
            currentScore={currentScore}
            trend="stabil"
            nextBetterTime={nextBetterTime}
          />

          {/* Timeline */}
          <div>
            <h2 className="mb-4 text-gray-900">Scor 24h (astăzi)</h2>
            <Timeline data={data} currentIndex={currentIndex} />
          </div>

          {/* Suggested windows */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-gray-900">Ferestre recomandate</h2>
              <DurationChips
                durations={[30, 60, 90, 120]}
                selected={selectedDuration}
                onChange={setSelectedDuration}
              />
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
