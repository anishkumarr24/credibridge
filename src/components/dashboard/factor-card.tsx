"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type FactorKey = "income" | "payment" | "trend" | "tenure" | "obm";

export interface FactorCardProps {
  factorKey: FactorKey;
  label: string;
  rawScore: number;        // 0–100
  contribution: number | null;  // weighted points, server-provided
  maxContribution: number;      // max possible points for this factor (for bar indicator)
  explanation: string;           // server-generated explanation string
  excluded: boolean;
  isPositive: boolean;
  // Optional chart data — same data used by scoring engine
  earningsChart?: { month: string; earnings: number }[];
  paymentChart?: { name: string; value: number; color: string }[];
  evidence?: Record<string, string | number>;  // additional evidence key-value pairs
}

const FACTOR_META: Record<FactorKey, { icon: string; color: string; accent: string }> = {
  income:  { icon: "💰", color: "from-violet-500/10 to-violet-500/5", accent: "#8b5cf6" },
  payment: { icon: "✅", color: "from-emerald-500/10 to-emerald-500/5", accent: "#10b981" },
  trend:   { icon: "📈", color: "from-blue-500/10 to-blue-500/5",    accent: "#3b82f6" },
  tenure:  { icon: "🏆", color: "from-amber-500/10 to-amber-500/5",  accent: "#f59e0b" },
  obm:     { icon: "⚖️", color: "from-rose-500/10 to-rose-500/5",    accent: "#f43f5e" },
};

function ScoreBar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: accent }}
      />
    </div>
  );
}

export function FactorCard({
  factorKey,
  label,
  rawScore,
  contribution,
  maxContribution,
  explanation,
  excluded,
  isPositive,
  earningsChart,
  paymentChart,
  evidence,
}: FactorCardProps) {
  const meta = FACTOR_META[factorKey];

  if (excluded) {
    return (
      <div className="rounded-xl border bg-card/60 p-5 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{meta.icon}</span>
          <h3 className="font-semibold text-sm text-muted-foreground">{label}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{explanation}</p>
      </div>
    );
  }

  const TrendIcon = isPositive ? TrendingUp : (rawScore >= 50 ? Minus : TrendingDown);
  const trendColor = isPositive ? "text-emerald-500" : (rawScore >= 50 ? "text-amber-500" : "text-rose-500");

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${meta.color} bg-card p-5 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{label}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: meta.accent }}
              >
                {Math.round(rawScore)}
                <span className="text-xs font-normal text-muted-foreground">/100</span>
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {contribution !== null ? (
            <>
              <div
                className="text-xl font-bold tabular-nums"
                style={{ color: meta.accent }}
              >
                +{contribution}
              </div>
              <div className="text-xs text-muted-foreground">pts</div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">N/A</span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar value={contribution ?? 0} max={maxContribution} accent={meta.accent} />

      {/* Explanation */}
      <div className="flex items-start gap-2">
        <TrendIcon className={`h-4 w-4 mt-0.5 shrink-0 ${trendColor}`} />
        <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
      </div>

      {/* Evidence */}
      {evidence && Object.keys(evidence).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(evidence).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-background/60 px-3 py-2">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="text-sm font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Earnings mini chart */}
      {earningsChart && earningsChart.length >= 2 && (
        <div className="h-28 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={earningsChart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Earnings"]}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke={meta.accent}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment bar chart */}
      {paymentChart && paymentChart.length > 0 && (
        <div className="h-24 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentChart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {paymentChart.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
