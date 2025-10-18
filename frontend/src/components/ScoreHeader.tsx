import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ScoreHeaderProps {
  currentScore: number;
  trend: 'în creștere' | 'stabil' | 'în scădere';
  nextBetterTime?: string;
  currentColor?: 'green' | 'yellow' | 'orange' | 'red' | string | null;
  lastModified?: string; // ISO string from API
}

export function ScoreHeader({ currentScore, trend, currentColor, lastModified }: ScoreHeaderProps) {
  
  const getScoreColor = () => {
    if (currentColor === 'green') return 'text-green-600';
    if (currentColor === 'yellow') return 'text-yellow-600';
    if (currentColor === 'orange') return 'text-orange-500';
    if (currentColor === 'red') return 'text-red-600';
    // fallback by numeric thresholds
    if (currentScore >= 75) return 'text-green-600';
    if (currentScore >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-4">
        {/* Current score */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-gray-700">Scor acum:</h2>
          <div className={`flex items-center gap-2 ${getScoreColor()}`}>
            <span className="text-3xl font-bold">{currentScore}</span>
            <span className="text-xl text-gray-400">/100</span>
          </div>
        </div>
        {/* Legend and update time */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Scor 0–100 (mai mare = mai favorabil)
          </div>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {(() => {
              if (!lastModified) return 'Ultima actualizare: necunoscut';
              const updated = new Date(lastModified);
              const now = new Date();
              const diffMs = Math.max(0, now.getTime() - updated.getTime());
              const diffMin = Math.floor(diffMs / 60000);
              const diffHr = Math.floor(diffMin / 60);
              const remainderMin = diffMin % 60;
              if (diffMin < 1) return 'Ultima actualizare: acum';
              if (diffMin < 60) return `Ultima actualizare: acum ${diffMin} ${diffMin === 1 ? 'minut' : 'minute'}`;
              if (diffHr < 24) return `Ultima actualizare: acum ${diffHr} ${diffHr === 1 ? 'oră' : 'ore'} ${remainderMin ? `și ${remainderMin} min` : ''}`.trim();
              const days = Math.floor(diffHr / 24);
              return `Ultima actualizare: acum ${days} ${days === 1 ? 'zi' : 'zile'}`;
            })()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
