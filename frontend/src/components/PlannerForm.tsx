import React, { useState } from 'react';
import { DurationChips } from '@/components/DurationChips';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface PlannerFormProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  constraints: {
    earliestAfter?: string;
    latestBefore?: string;
    deadline?: string;
  };
  onConstraintsChange: (constraints: any) => void;
}

export function PlannerForm({ 
  duration, 
  onDurationChange, 
  constraints, 
  onConstraintsChange 
}: PlannerFormProps) {
  const presetDurations = [30, 60, 90, 120];
  
  return (
    <Card className="p-5 bg-white border border-gray-200">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Configurează fereastra</h3>
          
          {/* Duration chips */}
          <div className="space-y-3">
            <Label>Durată</Label>
            <DurationChips 
              durations={presetDurations}
              selected={duration}
              onChange={onDurationChange}
            />
          </div>
          
          {/* Duration slider */}
          <div className="space-y-3 mt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Personalizat</span>
              <span className="font-semibold text-gray-900">{duration} minute</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={(value) => onDurationChange(value[0])}
              min={30}
              max={180}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>30 min</span>
              <span>180 min</span>
            </div>
          </div>
        </div>
        
        {/* Time constraints */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-900">Constrângeri (opțional)</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="earliest">Cel mai devreme după</Label>
              <Input
                id="earliest"
                type="time"
                value={constraints.earliestAfter || ''}
                onChange={(e) => onConstraintsChange({ ...constraints, earliestAfter: e.target.value })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="latest">Cel mai târziu înainte de</Label>
              <Input
                id="latest"
                type="time"
                value={constraints.latestBefore || ''}
                onChange={(e) => onConstraintsChange({ ...constraints, latestBefore: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deadline">Termină până la</Label>
            <Input
              id="deadline"
              type="time"
              value={constraints.deadline || ''}
              onChange={(e) => onConstraintsChange({ ...constraints, deadline: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
