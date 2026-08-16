"use client";

import { useEffect, useRef } from "react";

interface ScoreDialProps {
  score: number;
  maxScore?: number;
  band: string;
}

const BAND_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  "Very Strong":    { stroke: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
  "Strong":         { stroke: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-600 dark:text-blue-400" },
  "Moderate":       { stroke: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400" },
  "Emerging":       { stroke: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400" },
  "Building History": { stroke: "#ef4444", bg: "bg-red-50 dark:bg-red-950/30",  text: "text-red-600 dark:text-red-400" },
};

export function ScoreDial({ score, maxScore = 900, band }: ScoreDialProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  // Arc spans 240 degrees (from 150deg to 30deg going clockwise)
  const arcDegrees = 240;
  const circumference = normalizedRadius * 2 * Math.PI;
  const arcLength = (arcDegrees / 360) * circumference;
  const gap = circumference - arcLength;

  const clampedScore = Math.min(Math.max(score, 0), maxScore);
  const pct = clampedScore / maxScore;
  const progressLength = pct * arcLength;
  const dashOffset = gap / 2; // offset to center the 240° arc at bottom

  const colors = BAND_COLORS[band] ?? BAND_COLORS["Building History"];

  useEffect(() => {
    if (!circleRef.current) return;
    const el = circleRef.current;
    el.style.strokeDashoffset = String(circumference - (gap / 2));
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.strokeDashoffset = String(circumference - progressLength - dashOffset);
    });
  }, [score, circumference, progressLength, dashOffset, gap]);

  const viewBoxSize = radius * 2 + stroke;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;

  // rotation so the arc starts at ~150° (bottom-left)
  const rotateAngle = 150;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative">
        <svg
          width={viewBoxSize}
          height={viewBoxSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          aria-label={`Credit score: ${score} out of ${maxScore}`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={normalizedRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
            strokeDasharray={`${arcLength} ${gap}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            transform={`rotate(${rotateAngle} ${cx} ${cy})`}
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={normalizedRadius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${gap}`}
            strokeDashoffset={circumference - dashOffset}
            strokeLinecap="round"
            transform={`rotate(${rotateAngle} ${cx} ${cy})`}
            style={{ willChange: "stroke-dashoffset" }}
          />
        </svg>

        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-4xl font-bold tabular-nums leading-none"
            style={{ color: colors.stroke }}
          >
            {score}
          </span>
          <span className="text-xs text-muted-foreground mt-1">/ {maxScore}</span>
        </div>
      </div>

      {/* Band label */}
      <span
        className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}
      >
        {band}
      </span>
    </div>
  );
}
