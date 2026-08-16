"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { HistoryEntry } from "@/actions/score-history";

interface ScoreHistoryChartProps {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface ChartPoint {
  date: string;
  shortDate: string;
  score: number;
  band: string;
  confidence: number;
  id: string;
}

function bandColor(band: string): string {
  switch (band) {
    case "Very Strong":     return "#10b981";
    case "Strong":         return "#3b82f6";
    case "Moderate":       return "#f59e0b";
    case "Emerging":       return "#f97316";
    case "Building History": return "#ef4444";
    default:               return "#6366f1";
  }
}

// Custom dot that highlights the selected entry
function SelectableDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { cx, cy, payload, selectedId, onSelect } = props;
  if (!cx || !cy || !payload) return null;

  const isSelected = payload.id === selectedId;
  const color = bandColor(payload.band);

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(payload.id)}
      role="button"
      aria-label={`Score on ${payload.date}: ${payload.score}`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 8 : 5}
        fill={color}
        stroke="var(--background)"
        strokeWidth={2}
        opacity={isSelected ? 1 : 0.8}
      />
      {isSelected && (
        <circle cx={cx} cy={cy} r={13} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { value: number; payload: ChartPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border bg-card shadow-lg p-3 text-xs space-y-1.5 min-w-40">
      <p className="font-semibold text-sm">{d.date}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Score</span>
        <span className="font-bold text-primary">{d.score} / 900</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Band</span>
        <span className="font-medium" style={{ color: bandColor(d.band) }}>{d.band}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{d.confidence}%</span>
      </div>
      <p className="text-muted-foreground/70 italic pt-1">Click to see factor details</p>
    </div>
  );
}

export function ScoreHistoryChart({ entries, selectedId, onSelect }: ScoreHistoryChartProps) {
  const data: ChartPoint[] = [...entries].reverse().map(e => ({
    date:       format(new Date(e.calculatedAt), "MMM d, yyyy"),
    shortDate:  format(new Date(e.calculatedAt), "MMM d"),
    score:      e.totalScore,
    band:       e.bandLabel,
    confidence: e.confidence,
    id:         e.id,
  }));

  if (data.length === 0) return null;

  const scores = data.map(d => d.score);
  const minScore = Math.max(0,   Math.min(...scores) - 30);
  const maxScore = Math.min(900, Math.max(...scores) + 30);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-10" />
          <XAxis
            dataKey="shortDate"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minScore, maxScore]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Band reference lines */}
          <ReferenceLine y={750} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: "Very Strong", fontSize: 9, fill: "#10b981", position: "right" }} />
          <ReferenceLine y={650} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: "Strong", fontSize: 9, fill: "#3b82f6", position: "right" }} />
          <ReferenceLine y={500} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b", position: "right" }} />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2.5}
            activeDot={false}
            dot={(props) => (
              <SelectableDot
                key={props.index}
                cx={props.cx}
                cy={props.cy}
                payload={props.payload as ChartPoint}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
