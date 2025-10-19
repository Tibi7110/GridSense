import React from 'react';
import { TimeWindow } from '@/utils/scoreData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ExplainabilitySectionProps {
  window?: TimeWindow;
}

export function ExplainabilitySection({ window }: ExplainabilitySectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (!window) return null;
  
  // Build more relevant, data-driven reasons for recommendation
  const topPercent = Math.max(1, 100 - (Number.isFinite(window.percentile) ? window.percentile : 0));
  const delta = Number(window.deltaVsNow?.toFixed?.(2) ?? window.deltaVsNow);
  // Estimate color from percentile similar to backend thresholds
  const colorName = window.percentile >= 70 ? 'Verde' : window.percentile >= 50 ? 'Galben' : window.percentile >= 25 ? 'Portocaliu' : 'Roșu';
  const colorDot = window.percentile >= 70 ? '🟢' : window.percentile >= 50 ? '🟡' : window.percentile >= 25 ? '🟠' : '🔴';
  
  // Estimate CO₂ savings for running in this window vs. "acum"
  // Assumptions (adjustable):
  // - Linear mapping score 0..100 -> intensity 700..50 gCO₂/kWh (coal-ish to very clean mix)
  // - One wash uses ~1.2 kWh (specificare explicită în UI)
  // - Compact car emits ~120 g CO₂/km (tank-to-wheel)
  const INTENSITY_AT_0 = 700; // gCO₂/kWh when score=0
  const INTENSITY_AT_100 = 50; // gCO₂/kWh when score=100
  const PER_POINT_DELTA = (INTENSITY_AT_0 - INTENSITY_AT_100) / 100; // gCO₂/kWh per score point
  const KWH_PER_WASH = 1.2; // kWh per cycle (conform cerinței)
  const CAR_G_PER_KM = 120; // g/km
  const diffPoints = Math.max(0, delta); // only count savings when window is cleaner than acum
  const gramsSaved = diffPoints * PER_POINT_DELTA * KWH_PER_WASH; // g CO₂
  const kmEq = gramsSaved / CAR_G_PER_KM;
  const fmtGrams = gramsSaved >= 1000 ? `${(gramsSaved / 1000).toFixed(2)} kg` : `${gramsSaved.toFixed(0)} g`;
  const fmtKm = kmEq < 1 ? `${(kmEq * 1000).toFixed(0)} m` : `${kmEq.toFixed(1)} km`;
  const reasons = [
    `🌟 În top ${topPercent}% al zilei (P${window.percentile})`,
    `📈 Scor mediu ${Math.round(window.avgScore)}/100 — ${delta > 0 ? '+' : ''}${delta} vs. acum`,
    `${colorDot} Culoare estimată: ${colorName}`,
    `♻️ Emisii evitate: ~${fmtGrams} (≈ ${fmtKm} cu un autoturism, pentru 1.2 kWh/spălare)`
  ];
  
  return (
    <Card className="p-5 bg-blue-50 border-blue-200">
      <div className="space-y-4">
        {/* Pe scurt: 3 puncte sus */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="text-sm bg-white/70 border border-blue-200 rounded-md px-3 py-2 text-gray-800">
            <span className="font-semibold">Scor mediu:</span> {Math.round(window.avgScore)}/100
          </div>
          <div className="text-sm bg-white/70 border border-blue-200 rounded-md px-3 py-2 text-gray-800">
            <span className="font-semibold">Emisii evitate:</span> ~{fmtGrams}
          </div>
          <div className="text-sm bg-white/70 border border-blue-200 rounded-md px-3 py-2 text-gray-800">
            <span className="font-semibold">Top zi:</span> top {topPercent}% ({colorName})
          </div>
        </div>
        <h3 className="font-semibold text-gray-900">De ce e recomandat?</h3>
        
        <ul className="space-y-2">
          {reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            Semnificații
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2 text-sm text-gray-600">
            <p>• <strong>Despre proiect:</strong> Avem o formulă matematică de calcul pentru a determina scorul de sustenabilitate.</p>
            <p>• <strong>Calcul:</strong> Atribuim o pondere de 1 pentru sursele fără emisii de carbon, 
            0,5 pentru sursele pe bază de gaz și 0 pentru sursele pe cărbune.</p>
            <p>• <strong>Colorare:</strong> Împărțim scorurile în percentile zilnice (Verde ≥ P70, Galben P51–P69, Portocaliu P25–P50, Roșu &lt; P25)</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
