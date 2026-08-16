"use client";

import { HistoryEntry, StoredFactor } from "@/actions/score-history";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";

interface ScoreChangePanelProps {
  entry: HistoryEntry;
  onClose?: () => void;
}

const BAND_COLORS: Record<string, string> = {
  "Very Strong":      "text-emerald-600 dark:text-emerald-400",
  "Strong":           "text-blue-600 dark:text-blue-400",
  "Moderate":         "text-amber-600 dark:text-amber-400",
  "Emerging":         "text-orange-600 dark:text-orange-400",
  "Building History": "text-rose-600 dark:text-rose-400",
};

const FACTOR_ICONS: Record<string, string> = {
  income:  "💰",
  payment: "✅",
  trend:   "📈",
  tenure:  "🏆",
};

export function ScoreChangePanel({ entry, onClose }: ScoreChangePanelProps) {
  const [showAllFactors, setShowAllFactors] = useState(false);

  const { scoreDelta, bandChanged, confidenceDelta, factorChanges, factors } = entry;
  const date = format(new Date(entry.calculatedAt), "MMMM d, yyyy 'at' h:mm a");

  // Overall change direction
  const overallDir = scoreDelta === null ? "first"
    : scoreDelta > 0  ? "improved"
    : scoreDelta < 0  ? "declined"
    : "unchanged";

  return (
    <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b">
        <div>
          <h3 className="font-bold text-base">
            {overallDir === "first"     && "First recorded score"}
            {overallDir === "improved"  && `Score improved by +${scoreDelta} points`}
            {overallDir === "declined"  && `Score declined by ${scoreDelta} points`}
            {overallDir === "unchanged" && "Score unchanged"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Score hero */}
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{entry.totalScore}</div>
            <div className="text-xs text-muted-foreground">/ 900</div>
          </div>
          <div className="flex-1 space-y-1">
            <div className={`text-lg font-semibold ${BAND_COLORS[entry.bandLabel] ?? ""}`}>
              {entry.bandLabel}
              {bandChanged && <span className="ml-2 text-xs font-normal text-muted-foreground">(band changed)</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Confidence: <strong>{entry.confidence}%</strong></span>
              {confidenceDelta !== null && confidenceDelta !== 0 && (
                <span className={confidenceDelta > 0 ? "text-emerald-500" : "text-rose-500"}>
                  ({confidenceDelta > 0 ? "+" : ""}{confidenceDelta}%)
                </span>
              )}
            </div>
          </div>
          {/* Delta badge */}
          {scoreDelta !== null && (
            <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
              scoreDelta > 0
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : scoreDelta < 0
                ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {scoreDelta > 0 ? <TrendingUp className="h-4 w-4" /> : scoreDelta < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {scoreDelta > 0 ? "+" : ""}{scoreDelta} pts
            </div>
          )}
        </div>

        {/* Factor changes (why did it change?) */}
        {factorChanges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Why did my score change?</h4>
            <div className="space-y-2.5">
              {factorChanges.map(change => (
                <div
                  key={change.factorKey}
                  className={`rounded-lg border p-3 ${
                    change.direction === "improved"
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{FACTOR_ICONS[change.factorKey] ?? "📊"}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-tight">{change.factorLabel}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{change.explanation}</p>
                      </div>
                    </div>
                    <div className={`shrink-0 flex items-center gap-1 text-sm font-bold ${
                      change.direction === "improved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {change.direction === "improved"
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
                      {change.delta > 0 ? "+" : ""}{change.delta} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scoreDelta === null && (
          <p className="text-sm text-muted-foreground">
            This is your first recorded score. Add more financial data over time to see how your score evolves.
          </p>
        )}

        {scoreDelta !== null && factorChanges.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No significant factor changes detected between this and the previous score.
            Small shifts may be due to statistical adjustments.
          </p>
        )}

        {/* All factor details (expandable) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAllFactors(v => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllFactors ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAllFactors ? "Hide" : "Show"} all factor scores at this snapshot
          </button>

          {showAllFactors && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {factors.map((f: StoredFactor) => (
                <div key={f.factorKey} className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span>{FACTOR_ICONS[f.factorKey] ?? "📊"}</span>
                    <span>{f.factorLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold tabular-nums">{Math.round(f.rawScore)}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-bold tabular-nums text-primary">+{Math.round(f.contribution)}</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(f.rawScore, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{f.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
