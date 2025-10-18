// Utility functions for score data and calculations

export interface ScorePoint {
  time: string; // HH:mm format
  score: number; // 0-100
  timestamp: Date;
}

export interface TimeWindow {
  start: string;
  end: string;
  avgScore: number;
  percentile: number;
  deltaVsNow: number;
  stability: 'ridicată' | 'medie' | 'scăzută';
  stabilityValue: number;
  trend: 'în creștere' | 'stabil' | 'în scădere';
}

// Generate mock data: 144 points for 24 hours (10-minute intervals)
export function generateMockScoreData(): ScorePoint[] {
  const data: ScorePoint[] = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 144; i++) {
    const time = new Date(baseDate.getTime() + i * 10 * 60 * 1000);
    const hours = time.getHours();
    
    // Create patterns: lower scores during peak hours (7-9, 17-21), higher at night
    let baseScore = 50;
    
    if (hours >= 0 && hours < 6) baseScore = 75; // Night
    else if (hours >= 6 && hours < 9) baseScore = 35; // Morning peak
    else if (hours >= 9 && hours < 17) baseScore = 60; // Day
    else if (hours >= 17 && hours < 21) baseScore = 30; // Evening peak
    else baseScore = 70; // Late evening
    
    // Add randomness ±15
    const score = Math.max(0, Math.min(100, baseScore + (Math.random() * 30 - 15)));
    
    data.push({
      time: `${String(hours).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
      score: Math.round(score),
      timestamp: time
    });
  }
  
  return data;
}

// Calculate percentiles for threshold determination
export function calculatePercentile(data: ScorePoint[], percentile: number): number {
  const sorted = [...data].sort((a, b) => a.score - b.score);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)].score;
}

// Get color based on score and percentiles with hysteresis
export function getScoreColor(score: number, p25: number, p75: number, prevColor?: string): string {
  const hysteresis = 5;
  
  // Apply hysteresis to prevent flicker
  if (prevColor === 'green' && score >= p75 - hysteresis) return 'green';
  if (prevColor === 'yellow' && score >= p25 - hysteresis && score < p75 + hysteresis) return 'yellow';
  if (prevColor === 'red' && score < p25 + hysteresis) return 'red';
  
  // Default threshold logic
  if (score >= p75) return 'green';
  if (score >= p25) return 'yellow';
  return 'red';
}

// Find best time windows for a given duration
export function findBestWindows(
  data: ScorePoint[],
  durationMinutes: number,
  currentScore: number,
  constraints?: {
    earliestAfter?: string;
    latestBefore?: string;
    deadline?: string;
  }
): TimeWindow[] {
  const windowSize = Math.ceil(durationMinutes / 10); // Number of 10-min segments
  const windows: TimeWindow[] = [];
  
  for (let i = 0; i <= data.length - windowSize; i++) {
    const windowData = data.slice(i, i + windowSize);
    const start = windowData[0].time;
    const end = windowData[windowData.length - 1].time;
    
    // Apply constraints
    if (constraints?.earliestAfter && start < constraints.earliestAfter) continue;
    if (constraints?.latestBefore && start > constraints.latestBefore) continue;
    if (constraints?.deadline && end > constraints.deadline) continue;
    
    const avgScore = Math.round(windowData.reduce((sum, p) => sum + p.score, 0) / windowData.length);
    const scores = windowData.map(p => p.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const stabilityValue = maxScore - minScore;
    
    const stability: 'ridicată' | 'medie' | 'scăzută' = 
      stabilityValue <= 5 ? 'ridicată' : stabilityValue <= 10 ? 'medie' : 'scăzută';
    
    // Calculate trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendDiff = secondAvg - firstAvg;
    
    const trend: 'în creștere' | 'stabil' | 'în scădere' =
      trendDiff > 3 ? 'în creștere' : trendDiff < -3 ? 'în scădere' : 'stabil';
    
    const allScores = data.map(d => d.score).sort((a, b) => a - b);
    const percentileIndex = allScores.findIndex(s => s >= avgScore);
    const percentile = Math.round((percentileIndex / allScores.length) * 100);
    
    windows.push({
      start,
      end,
      avgScore,
      percentile,
      deltaVsNow: avgScore - currentScore,
      stability,
      stabilityValue,
      trend
    });
  }
  
  // Sort by average score (descending), then by stability (ascending)
  windows.sort((a, b) => {
    if (Math.abs(a.avgScore - b.avgScore) > 2) return b.avgScore - a.avgScore;
    return a.stabilityValue - b.stabilityValue;
  });
  
  return windows.slice(0, 3);
}

// Get current time index (mock: assume it's 14:30)
export function getCurrentTimeIndex(): number {
  // For demo, let's say current time is 14:30 (87th point: 14*6 + 3)
  return 87;
}

// Format percentile for display
export function formatPercentile(percentile: number): string {
  if (percentile >= 90) return `top ${100 - percentile}% azi`;
  if (percentile >= 75) return `top 25% azi`;
  return `P${percentile}`;
}

// Get trend icon
export function getTrendIcon(trend: 'în creștere' | 'stabil' | 'în scădere'): string {
  if (trend === 'în creștere') return '↑';
  if (trend === 'în scădere') return '↓';
  return '→';
}

// Get stability icon
export function getStabilityIcon(stability: 'ridicată' | 'medie' | 'scăzută'): string {
  if (stability === 'ridicată') return '✓';
  if (stability === 'medie') return '~';
  return '!';
}
