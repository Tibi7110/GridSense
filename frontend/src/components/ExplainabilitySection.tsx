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
  
  const reasons = [
    `Scor în ${window.percentile >= 90 ? 'top 10%' : window.percentile >= 75 ? 'top 25%' : 'top 50%'} al zilei`,
    `Trend local ${window.trend === 'în creștere' ? 'ascendent' : window.trend === 'în scădere' ? 'descendent' : 'stabil'}`,
    `Variație ${window.stability === 'ridicată' ? 'redusă' : window.stability === 'medie' ? 'moderată' : 'ridicată'} (±${window.stabilityValue} puncte)`
  ];
  
  return (
    <Card className="p-5 bg-blue-50 border-blue-200">
      <div className="space-y-4">
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
            Cum calculăm
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2 text-sm text-gray-600">
            <p>• <strong>Colorare:</strong> Împărțim scorurile în percentile zilnice (Verde ≥ P70, Galben P51–P69, Portocaliu P25–P50, Roșu &lt; P25)</p>
            <p>• <strong>Ferestre:</strong> Calculăm medii mobile pentru durata aleasă</p>
            <p>• <strong>Stabilitate:</strong> Penalizăm variația mare și evităm ferestre foarte apropiate</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
