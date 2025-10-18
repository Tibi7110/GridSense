import React from 'react';
import { TimeWindow, formatPercentile, getStabilityIcon } from '@/utils/scoreData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Copy, Info } from 'lucide-react';

interface WindowCardProps {
  window: TimeWindow;
  onNotify?: () => void;
  onDetails?: () => void;
}

export function WindowCard({ window, onNotify, onDetails }: WindowCardProps) {
  const stabilityIcon = getStabilityIcon(window.stability);
  
  const getColorClass = () => {
    if (window.percentile >= 75) return 'border-l-[#2E8540]';
    if (window.percentile >= 25) return 'border-l-[#F5A623]';
    return 'border-l-[#D0021B]';
  };
  
  return (
    <Card className={`p-4 md:p-5 border-l-4 ${getColorClass()} bg-white hover:shadow-md transition-shadow`}>
      <div className="space-y-3">
        {/* Time interval */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {window.start}–{window.end}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {Math.round((window.end.split(':')[0] as any) * 60 + (window.end.split(':')[1] as any) - 
                (window.start.split(':')[0] as any) * 60 - (window.start.split(':')[1] as any))} minute
            </div>
          </div>
          <div className="text-2xl">{stabilityIcon}</div>
        </div>
        
        {/* Score metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Scor mediu</div>
            <div className="font-semibold text-gray-900">
              {window.avgScore} <span className="text-gray-500">({formatPercentile(window.percentile)})</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500">vs. acum</div>
            <div className={`font-semibold ${window.deltaVsNow > 0 ? 'text-green-600' : window.deltaVsNow < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {window.deltaVsNow > 0 ? '+' : ''}{window.deltaVsNow}
            </div>
          </div>
        </div>
        
        {/* Stability and trend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Stabilitate:</span>
            <span className="font-medium text-gray-900">{window.stability}</span>
            <span className="text-gray-400">(±{window.stabilityValue}p)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Trend:</span>
            <span className="font-medium text-gray-900">{window.trend}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            className="flex-1 bg-[#2E8540] hover:bg-[#236835] text-white cursor-pointer"
            onClick={onNotify}
          >
            <Bell className="w-4 h-4 mr-2" />
            Trimite notificare la start
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 cursor-pointer"
            onClick={onDetails}
          >
            <Info className="w-4 h-4 mr-2" />
            Detalii și explicații
          </Button>
        </div>
      </div>
    </Card>
  );
}
