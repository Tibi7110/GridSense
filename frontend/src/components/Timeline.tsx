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
  const p50 = calculatePercentile(data, 50);
  const p70 = calculatePercentile(data, 70);
  
  // Group by hour for labels
  const hourLabels: { index: number; label: string }[] = [];
  data.forEach((point, i) => {
    if (point.time.endsWith(':00')) {
      hourLabels.push({ index: i, label: point.time });
    }
  });
  
  const getColor = (score: number) => {
    const color = getScoreColor(score, p25, p50, p70);
    if (color === 'green') return '#2E8540';
    if (color === 'yellow') return '#FFFF00';
    if(color == 'orange') return '#FFA500';
    return '#D0021B';
  };
  
  const getPercentile = (score: number): number => {
    const sorted = data.map(d => d.score).sort((a, b) => a - b);
    const index = sorted.findIndex(s => s >= score);
    return Math.round((index / sorted.length) * 100);
  };
  
  // Trend removed on request
  
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
              const delta = point.score - data[currentIndex].score;
              const scoreDisplay = Number(point.score).toFixed(2);
              const deltaDisplay = `${delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(2)}`;
              
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
                      <div>Scor: {scoreDisplay} (P{percentile})</div>
                      <div>{deltaDisplay} vs acum</div>
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
      </div>
      
      {/* Legend removed on request */}
    </div>
  );
}
