import React, { useState } from 'react';
import { ScorePoint, calculatePercentile, getScoreColor } from '@/utils/scoreData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimelineProps {
  data: ScorePoint[];
  currentIndex: number;
}

export function Timeline({ data, currentIndex }: TimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const p25 = calculatePercentile(data, 25);
  const p75 = calculatePercentile(data, 75);
  
  // Group by hour for labels
  const hourLabels: { index: number; label: string }[] = [];
  data.forEach((point, i) => {
    if (point.time.endsWith(':00')) {
      hourLabels.push({ index: i, label: point.time });
    }
  });
  
  const getColor = (score: number) => {
    const color = getScoreColor(score, p25, p75);
    if (color === 'green') return '#2E8540';
    if (color === 'yellow') return '#F5A623';
    if(color == 'orange') return '#FFA500';
    return '#D0021B';
  };
  
  const getPercentile = (score: number): number => {
    const sorted = data.map(d => d.score).sort((a, b) => a - b);
    const index = sorted.findIndex(s => s >= score);
    return Math.round((index / sorted.length) * 100);
  };
  
  const getTrend = (index: number): string => {
    if (index >= data.length - 1) return 'stabil';
    const current = data[index].score;
    const next = data[Math.min(index + 3, data.length - 1)].score;
    const diff = next - current;
    if (diff > 5) return 'în creștere';
    if (diff < -5) return 'în scădere';
    return 'stabil';
  };
  
  return (
    <div className="w-full">
      {/* Timeline segments */}
      <div className="relative w-full bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={100}>
            {data.map((point, index) => {
              const color = getColor(point.score);
              const isCurrent = index === currentIndex;
              const percentile = getPercentile(point.score);
              const trend = getTrend(index);
              const delta = point.score - data[currentIndex].score;
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 h-12 md:h-16 rounded-sm cursor-pointer transition-all relative group"
                      style={{ 
                        backgroundColor: color,
                        opacity: isCurrent ? 1 : 0.85,
                        minWidth: '2px'
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {isCurrent && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800" />
                      )}
                      {hoveredIndex === index && (
                        <div className="absolute inset-0 bg-black/10 rounded-sm" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                    <div className="space-y-1">
                      <div className="font-semibold">{point.time}</div>
                      <div>Scor: {point.score} (P{percentile})</div>
                      <div>Trend: {trend}</div>
                      <div>{delta >= 0 ? '+' : ''}{delta} vs acum</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        
        {/* Hour labels */}
        <div className="relative mt-3 h-5">
          {hourLabels.filter((_, i) => i % 3 === 0).map((hour) => (
            <div
              key={hour.index}
              className="absolute text-xs text-gray-500"
              style={{ left: `${(hour.index / data.length) * 100}%` }}
            >
              {hour.label}
            </div>
          ))}
        </div>
        
        {/* Hint text */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Treceți cu mouse-ul peste bare pentru detalii • 144 intervale × 10 min
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2E8540' }} />
          <span>Verde ≥ P75 (top 25%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5A623' }} />
          <span>Galben P25–P75</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D0021B' }} />
          <span>Roșu &lt; P25</span>
        </div>
        <div className="text-xs text-gray-500">
          (histerezis ±5p pentru stabilitate)
        </div>
      </div>
    </div>
  );
}
