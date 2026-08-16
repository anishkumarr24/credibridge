"use client";

import { useState } from "react";
import Link from "next/link";
import { HistoryEntry } from "@/actions/score-history";
import { ScoreHistoryChart } from "@/components/dashboard/score-history-chart";
import { ScoreChangePanel } from "@/components/dashboard/score-change-panel";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface ScoreHistoryClientProps {
  entries: HistoryEntry[];
}

const BAND_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Very Strong":      { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  "Strong":           { bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-400",     dot: "bg-blue-500"    },
  "Moderate":         { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500"   },
  "Emerging":         { bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500"  },
  "Building History": { bg: "bg-rose-100 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-400",    dot: "bg-rose-500"    },
};

export function ScoreHistoryClient({ entries }: ScoreHistoryClientProps) {
  // Default to most-recent entry selected
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);

  const selectedEntry = entries.find(e => e.id === selectedId) ?? null;

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">No score history yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Visit your dashboard to calculate your score. Each calculation is saved automatically and will appear here.
          </p>
        </div>
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-10 px-6 font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Chart card */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base">Score Progression</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length} snapshot{entries.length !== 1 ? "s" : ""} recorded · Click any point to see factor details
            </p>
          </div>
          {/* Latest score badge */}
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary tabular-nums">{entries[0].totalScore}</div>
            <div className="text-xs text-muted-foreground">Current score</div>
          </div>
        </div>
        <ScoreHistoryChart
          entries={entries}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        />
      </div>

      {/* Selected entry detail */}
      {selectedEntry && (
        <ScoreChangePanel
          entry={selectedEntry}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* History list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-base">All Snapshots</h2>
        <div className="rounded-xl border divide-y overflow-hidden">
          {entries.map(entry => {
            const bandMeta = BAND_COLORS[entry.bandLabel] ?? BAND_COLORS["Building History"];
            const isSelected = entry.id === selectedId;
            const { scoreDelta } = entry;

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(isSelected ? null : entry.id)}
                className={`w-full text-left flex items-center gap-4 p-4 transition-colors ${
                  isSelected
                    ? "bg-primary/5 dark:bg-primary/10"
                    : "hover:bg-muted/50 bg-card"
                }`}
                aria-pressed={isSelected}
                aria-label={`Score snapshot: ${entry.totalScore} on ${format(new Date(entry.calculatedAt), "MMM d, yyyy")}`}
              >
                {/* Delta indicator */}
                <div className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full ${
                  scoreDelta === null    ? "bg-muted"
                  : scoreDelta > 0      ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : scoreDelta < 0      ? "bg-rose-100 dark:bg-rose-900/30"
                  : "bg-muted"
                }`}>
                  {scoreDelta === null    && <Clock className="h-4 w-4 text-muted-foreground" />}
                  {scoreDelta !== null && scoreDelta > 0  && <TrendingUp   className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  {scoreDelta !== null && scoreDelta < 0  && <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                  {scoreDelta !== null && scoreDelta === 0 && <Minus        className="h-4 w-4 text-muted-foreground" />}
                </div>

                {/* Score + date */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base tabular-nums">{entry.totalScore}</span>
                    <span className="text-muted-foreground text-sm">/ 900</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bandMeta.bg} ${bandMeta.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${bandMeta.dot}`} />
                      {entry.bandLabel}
                    </span>
                    {scoreDelta !== null && scoreDelta !== 0 && (
                      <span className={`text-xs font-bold ${scoreDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.calculatedAt), "MMM d, yyyy · h:mm a")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Confidence: {entry.confidence}%
                    </span>
                  </div>
                </div>

                {/* Factor change count */}
                {entry.factorChanges.length > 0 && (
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {entry.factorChanges.length} factor{entry.factorChanges.length !== 1 ? "s" : ""} changed
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
