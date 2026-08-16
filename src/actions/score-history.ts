"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─── Types returned to the history page ─────────────────────────────────────

export type StoredFactor = {
  factorKey:    string;
  factorLabel:  string;
  rawScore:     number;
  weight:       number;
  contribution: number;
  explanation:  string;
  isPositive:   boolean;
};

export type ScoreSnapshot = {
  id:           string;
  totalScore:   number;
  bandLabel:    string;
  confidence:   number;
  engineVersion: string;
  calculatedAt: string; // ISO string — safe to serialize
  factors:      StoredFactor[];
};

export type ScoreChange = {
  factorKey:   string;
  factorLabel: string;
  direction:   "improved" | "declined" | "unchanged";
  delta:       number;          // contribution delta in points
  deltaRaw:    number;          // rawScore delta 0-100
  explanation: string;
};

export type HistoryEntry = ScoreSnapshot & {
  scoreDelta:    number | null;  // vs previous entry (null for first)
  bandChanged:   boolean;
  confidenceDelta: number | null;
  factorChanges: ScoreChange[];  // populated when comparing to previous
};

// ─── Fetch score history with factor details ─────────────────────────────────

export async function getScoreHistory(limit = 20): Promise<{
  entries: HistoryEntry[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) {
    return { entries: [], error: "Unauthorized" };
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { entries: [], error: "Profile not found" };

  // Fetch most-recent-first so we can easily compare adjacent entries
  const scores = await prisma.score.findMany({
    where: { profileId: profile.id },
    include: { factors: true },
    orderBy: { calculatedAt: "desc" },
    take: limit,
  });

  if (scores.length === 0) return { entries: [] };

  // Convert to history entries (chronological for the chart: oldest → newest)
  const sorted = [...scores].reverse(); // oldest first

  const entries: HistoryEntry[] = sorted.map((score, idx) => {
    const prev = idx > 0 ? sorted[idx - 1] : null;

    const snapshot: ScoreSnapshot = {
      id:            score.id,
      totalScore:    score.totalScore,
      bandLabel:     score.bandLabel,
      confidence:    score.confidence,
      engineVersion: score.engineVersion,
      calculatedAt:  score.calculatedAt.toISOString(),
      factors:       score.factors.map(f => ({
        factorKey:    f.factorKey,
        factorLabel:  f.factorLabel,
        rawScore:     f.rawScore,
        weight:       f.weight,
        contribution: f.contribution,
        explanation:  f.explanation,
        isPositive:   f.isPositive,
      })),
    };

    // Compute deltas vs previous snapshot
    let scoreDelta:      number | null = null;
    let confidenceDelta: number | null = null;
    let bandChanged = false;
    let factorChanges: ScoreChange[] = [];

    if (prev) {
      scoreDelta      = Math.round(score.totalScore - prev.totalScore);
      confidenceDelta = Math.round(score.confidence - prev.confidence);
      bandChanged     = score.bandLabel !== prev.bandLabel;

      // Build a map of previous factors by key
      const prevFactorMap = new Map(prev.factors.map(f => [f.factorKey, f]));

      factorChanges = score.factors.map(f => {
        const prevF = prevFactorMap.get(f.factorKey);
        const deltaRaw  = prevF ? f.rawScore    - prevF.rawScore    : 0;
        const deltaContr = prevF ? f.contribution - prevF.contribution : 0;

        let direction: ScoreChange["direction"] = "unchanged";
        if      (Math.abs(deltaContr) < 1) direction = "unchanged";
        else if (deltaContr > 0)           direction = "improved";
        else                               direction = "declined";

        return {
          factorKey:   f.factorKey,
          factorLabel: f.factorLabel,
          direction,
          delta:       Math.round(deltaContr),
          deltaRaw:    Math.round(deltaRaw),
          explanation: buildChangeExplanation(f.factorKey, f.factorLabel, direction, Math.round(deltaContr), Math.round(deltaRaw), f.explanation),
        };
      }).filter(c => c.direction !== "unchanged");

      // Sort: most-impactful first (by absolute contribution delta)
      factorChanges.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    }

    return { ...snapshot, scoreDelta, bandChanged, confidenceDelta, factorChanges };
  });

  // Return newest-first for the UI list, but the chart will reverse it
  return { entries: entries.reverse() };
}

// ─── Single-entry detail (for click-through modal) ───────────────────────────

export async function getScoreDetail(scoreId: string): Promise<{
  entry: HistoryEntry | null;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) {
    return { entry: null, error: "Unauthorized" };
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { entry: null, error: "Profile not found" };

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: { factors: true },
  });

  // Security: ensure the score belongs to this worker
  if (!score || score.profileId !== profile.id) {
    return { entry: null, error: "Not found" };
  }

  // Find the immediately preceding score for comparison
  const prev = await prisma.score.findFirst({
    where: {
      profileId:   profile.id,
      calculatedAt: { lt: score.calculatedAt },
    },
    include: { factors: true },
    orderBy: { calculatedAt: "desc" },
  });

  const snapshot: ScoreSnapshot = {
    id:            score.id,
    totalScore:    score.totalScore,
    bandLabel:     score.bandLabel,
    confidence:    score.confidence,
    engineVersion: score.engineVersion,
    calculatedAt:  score.calculatedAt.toISOString(),
    factors:       score.factors.map(f => ({
      factorKey:    f.factorKey,
      factorLabel:  f.factorLabel,
      rawScore:     f.rawScore,
      weight:       f.weight,
      contribution: f.contribution,
      explanation:  f.explanation,
      isPositive:   f.isPositive,
    })),
  };

  let scoreDelta:      number | null = null;
  let confidenceDelta: number | null = null;
  let bandChanged = false;
  let factorChanges: ScoreChange[] = [];

  if (prev) {
    scoreDelta      = Math.round(score.totalScore - prev.totalScore);
    confidenceDelta = Math.round(score.confidence - prev.confidence);
    bandChanged     = score.bandLabel !== prev.bandLabel;

    const prevFactorMap = new Map(prev.factors.map(f => [f.factorKey, f]));

    factorChanges = score.factors.map(f => {
      const prevF    = prevFactorMap.get(f.factorKey);
      const deltaRaw = prevF ? f.rawScore    - prevF.rawScore    : 0;
      const deltaContr = prevF ? f.contribution - prevF.contribution : 0;

      let direction: ScoreChange["direction"] = "unchanged";
      if      (Math.abs(deltaContr) < 1) direction = "unchanged";
      else if (deltaContr > 0)           direction = "improved";
      else                               direction = "declined";

      return {
        factorKey:   f.factorKey,
        factorLabel: f.factorLabel,
        direction,
        delta:       Math.round(deltaContr),
        deltaRaw:    Math.round(deltaRaw),
        explanation: buildChangeExplanation(f.factorKey, f.factorLabel, direction, Math.round(deltaContr), Math.round(deltaRaw), f.explanation),
      };
    }).filter(c => c.direction !== "unchanged");

    factorChanges.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  return { entry: { ...snapshot, scoreDelta, bandChanged, confidenceDelta, factorChanges } };
}

// ─── Server-side change explanation builder ───────────────────────────────────

function buildChangeExplanation(
  factorKey: string,
  factorLabel: string,
  direction: ScoreChange["direction"],
  deltaPoints: number,
  deltaRaw: number,
  currentExplanation: string
): string {
  const sign  = deltaPoints > 0 ? "+" : "";
  const ptsStr = `${sign}${deltaPoints} pts`;

  switch (direction) {
    case "improved":
      return `${factorLabel} improved by ${ptsStr} (factor score ${deltaRaw > 0 ? "+" : ""}${deltaRaw}/100). ${currentExplanation}`;
    case "declined":
      return `${factorLabel} declined by ${ptsStr} (factor score ${deltaRaw < 0 ? "" : "+"}${deltaRaw}/100). ${currentExplanation}`;
    default:
      return currentExplanation;
  }
}
