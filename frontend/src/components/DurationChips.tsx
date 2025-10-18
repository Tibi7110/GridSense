import React from 'react';

interface DurationChipsProps {
  durations: number[];
  selected: number;
  onChange: (duration: number) => void;
}

export function DurationChips({ durations, selected, onChange }: DurationChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {durations.map((duration) => (
        <button
          key={duration}
          onClick={() => onChange(duration)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === duration
              ? 'bg-[#2E8540] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {duration} min
        </button>
      ))}
    </div>
  );
}
