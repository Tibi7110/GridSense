import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreHeaderProps {
  currentScore: number;
  trend: 'în creștere' | 'stabil' | 'în scădere';
  nextBetterTime?: string;
}

export function ScoreHeader({ currentScore, trend }: ScoreHeaderProps) {
  const getTrendIcon = () => {
    if (trend === 'în creștere') return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === 'în scădere') return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };
  
  const getScoreColor = () => {
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
            <span className="text-3xl font-bold">69</span>
            <span className="text-xl text-gray-400">/100</span>
            {getTrendIcon()}
          </div>
        </div>
        {/* Legend and update time */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Scor 0–100 (mai mare = mai favorabil)
          </div>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            Ultima actualizare: acum 5 min
          </Badge>
        </div>
      </div>
    </div>
  );
}
