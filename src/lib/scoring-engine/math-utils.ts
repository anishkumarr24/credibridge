import { differenceInDays, differenceInMonths } from "date-fns";

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function mad(arr: number[]): number {
  if (arr.length === 0) return 0;
  const med = median(arr);
  const deviations = arr.map((x) => Math.abs(x - med));
  return median(deviations);
}

export function theilSenSlope(arr: number[]): number {
  if (arr.length < 2) return 0;
  const slopes: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      slopes.push((arr[j] - arr[i]) / (j - i));
    }
  }
  return median(slopes);
}

export function bayesianShrink(n: number, rawScore: number, prior: number, k: number): number {
  if (n === 0) return prior;
  return (n * rawScore + k * prior) / (n + k);
}

export function interpolate(value: number, breakpoints: { value: number; score: number }[], clampLow: number, clampHigh: number): number {
  if (value <= breakpoints[0].value) return clampLow;
  if (value >= breakpoints[breakpoints.length - 1].value) return clampHigh;

  for (let i = 0; i < breakpoints.length - 1; i++) {
    if (value >= breakpoints[i].value && value <= breakpoints[i + 1].value) {
      const x0 = breakpoints[i].value;
      const x1 = breakpoints[i + 1].value;
      const y0 = breakpoints[i].score;
      const y1 = breakpoints[i + 1].score;
      const rangeX = x1 - x0;
      const rangeY = y1 - y0;
      const pct = (value - x0) / rangeX;
      return y0 + pct * rangeY;
    }
  }
  return clampHigh;
}

export function deseasonalize(series: number[], months: Date[]): number[] {
  if (series.length < 12) return series;

  // Simple ratio-to-moving-average requires computing moving average first
  const MA_WINDOW = 12;
  const movingAverages: (number | null)[] = new Array(series.length).fill(null);
  
  for (let i = Math.floor(MA_WINDOW/2); i < series.length - Math.ceil(MA_WINDOW/2); i++) {
    const window = series.slice(i - 6, i + 6);
    movingAverages[i] = window.reduce((a, b) => a + b, 0) / MA_WINDOW;
  }

  // Calculate seasonal indices per calendar month (0-11)
  const monthSums = new Array(12).fill(0);
  const monthCounts = new Array(12).fill(0);

  for (let i = 0; i < series.length; i++) {
    const ma = movingAverages[i];
    if (ma !== null && ma !== 0) {
      const calMonth = months[i].getMonth();
      monthSums[calMonth] += series[i] / ma;
      monthCounts[calMonth]++;
    }
  }

  const seasonalIndices = new Array(12).fill(1);
  for (let m = 0; m < 12; m++) {
    if (monthCounts[m] > 0) {
      seasonalIndices[m] = monthSums[m] / monthCounts[m];
    }
  }

  // Normalize indices to average 1
  const avgIndex = seasonalIndices.reduce((a, b) => a + b, 0) / 12;
  for (let m = 0; m < 12; m++) {
    seasonalIndices[m] /= avgIndex;
  }

  // Apply deseasonalization
  return series.map((val, i) => val / seasonalIndices[months[i].getMonth()]);
}

export function daysBetween(date1: Date, date2: Date): number {
  return differenceInDays(date1, date2);
}

export function monthsSince(date: Date): number {
  return differenceInMonths(new Date(), date);
}
