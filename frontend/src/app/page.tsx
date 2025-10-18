"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ScoreHeader } from "@/components/ScoreHeader";
import { Timeline } from "@/components/Timeline";
import { WindowCard } from "@/components/WindowCard";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    toast.success(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✓</span>
          <span className="font-bold text-gray-900">Notificare setată cu succes!</span>
        </div>
        <div className="flex flex-col gap-1 ml-8">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <span className="text-gray-800">Vei fi notificat la ora <span className="font-semibold text-gray-900">{window.start}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-gray-800">Fereastră optimă pentru spălat rufe</span>
          </div>
        </div>
      </div>,
      {
        duration: 5000,
      }
    );
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
  
  const handleEmergencyUse = async () => {
    try {
      const resp = await fetch('/api/wash/decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ when: new Date().toISOString(), emergency: true }),
      });
      const json = await resp.json().catch(() => ({}));
      
      if (json?.ok) {
        if (json?.triggered) {
          toast.success(
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-bold text-gray-900">Consum de urgență activat!</span>
              </div>
              <div className="flex flex-col gap-1 ml-8">
                <span className="text-gray-800">Aparatul a pornit imediat</span>
                {json?.details?.Color && (
                  <span className="text-sm text-gray-600">Condiții actuale: {json.details.Color}</span>
                )}
              </div>
            </div>,
            { duration: 5000 }
          );
        } else {
          toast.message(
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <span className="font-bold text-gray-900">Condiții acceptabile pentru urgență</span>
              </div>
              <div className="flex flex-col gap-1 ml-8">
                <span className="text-gray-800">Recomandăm să aștepți un interval mai verde dacă poți</span>
                {json?.details?.Color && (
                  <span className="text-sm text-gray-600">Condiții actuale: {json.details.Color}</span>
                )}
              </div>
            </div>,
            { duration: 5000 }
          );
        }
      } else {
        toast.error('Eroare la verificarea condițiilor', {
          description: String(json?.error || 'necunoscută'),
        });
      }
    } catch (e) {
      console.error('Emergency use failed', e);
      toast.error('Nu s-a putut contacta backend-ul');
    }
  };
  

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

          {/* Emergency Use Button */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Consum de Urgență</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Ai nevoie de energie acum? Apasă pentru a porni imediat, chiar dacă condițiile nu sunt optime. 
                  Sistemul va evalua dacă ai așteptat suficient timp în condiții nefavorabile.
                </p>
              </div>
              <Button
                onClick={handleEmergencyUse}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-6 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              >
                <Zap className="w-5 h-5 mr-2" />
                Pornește Acum
              </Button>
            </div>
          </div>

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
