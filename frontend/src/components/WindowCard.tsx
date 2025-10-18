import React from 'react';
import { TimeWindow, formatPercentile, getStabilityIcon } from '@/utils/scoreData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

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
    <Card className={`p-4 md:p-5 border-l-4 ${getColorClass()} bg-white hover:shadow-md transition-shadow overflow-hidden`}>
      <div className="space-y-3">
        {/* Time interval */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {window.start}–{window.end}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {(() => {
                const [eh, em] = window.end.split(':').map((v) => parseInt(v, 10));
                const [sh, sm] = window.start.split(':').map((v) => parseInt(v, 10));
                let mins = (eh * 60 + em) - (sh * 60 + sm);
                if (mins < 0) mins += 24 * 60; // handle overnight wrap
                return `${mins} minute`;
              })()}
            </div>
          </div>
          <div className="text-2xl">{stabilityIcon}</div>
        </div>
        
        {/* Score metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Scor mediu</div>
            <div className="font-semibold text-gray-900">
              {Math.round(window.avgScore)} <span className="text-gray-500">({formatPercentile(window.percentile)})</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500">vs. acum</div>
            <div className={`font-semibold ${window.deltaVsNow > 0 ? 'text-green-600' : window.deltaVsNow < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {window.deltaVsNow > 0 ? '+' : ''}{Number(window.deltaVsNow.toFixed(2))}
            </div>
          </div>
        </div>
        
        {/* Stability */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Stabilitate:</span>
            <span className="font-medium text-gray-900">{window.stability}</span>
            <span className="text-gray-400">(±{Number(window.stabilityValue.toFixed(2))}p)</span>
          </div>
        </div>
  {/* Actions */}
  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 w-full min-w-0">
          <Button 
            className="flex-1 min-w-0 whitespace-normal break-words text-center bg-[#2E8540] hover:bg-[#236835] text-white cursor-pointer py-4 px-2"
            onClick={async () => {
              try {
                // Build ISO datetime for today's date at the window start time (local)
                const now = new Date();
                const [hh, mm] = window.start.split(':').map((v) => parseInt(v, 10));
                const when = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0).toISOString();
                // Call backend decision endpoint through Next.js proxy with the planned start time
                const resp = await fetch('/api/wash/decision', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ when }),
                });
                const json = await resp.json().catch(() => ({}));
                console.log('Washer decision:', json);
                const color = json?.details?.Color;
                const start = window.start;
                const end = window.end;
                if (json?.ok) {
                  if (json?.triggered) {
                    toast.success(`Mașina a pornit (power=on)`, {
                      description: `Fereastra ${start}–${end}${color ? ` • culoare: ${color}` : ''}`,
                    });
                  } else if (json?.inside_interval) {
                    toast.message('Condițiile nu au declanșat pornirea', {
                      description: `Fereastra ${start}–${end}${color ? ` • culoare: ${color}` : ''}`,
                    });
                  } else {
                    // Evităm mesajul "În afara ferestrelor din CSV";
                    // afișăm un info neutru când nu se poate decide pe baza datelor curente
                    toast.message('Condițiile nu au declanșat pornirea', {
                      description: `Fereastra ${start}–${end}${color ? ` • culoare: ${color}` : ''}`,
                    });
                  }
                } else {
                  toast.error('Eroare backend', {
                    description: String(json?.error || 'necunoscută'),
                  });
                }
                if (onNotify) onNotify();
              } catch (e) {
                console.error('Failed to trigger decision', e);
                toast.error('Nu s-a putut contacta backend-ul');
                if (onNotify) onNotify();
              }
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Trimite notificare la start
          </Button>
        </div>
      </div>
    </Card>
  );
}
