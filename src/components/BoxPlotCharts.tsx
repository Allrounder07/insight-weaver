import { useMemo } from "react";
import { motion } from "framer-motion";
import { BoxSelect } from "lucide-react";
import { DatasetAnalysis } from "@/context/DatasetContext";

interface BoxStats {
  col: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function computeBoxStats(values: number[], col: string): BoxStats {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const whiskerMin = sorted.find((v) => v >= lowerFence) ?? sorted[0];
  const whiskerMax = [...sorted].reverse().find((v) => v <= upperFence) ?? sorted[sorted.length - 1];
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  // Limit outliers for rendering
  const sampledOutliers = outliers.length > 30
    ? outliers.filter((_, i) => i % Math.ceil(outliers.length / 30) === 0)
    : outliers;
  return { col, min: whiskerMin, q1, median, q3, max: whiskerMax, outliers: sampledOutliers };
}

const COLORS = [
  "hsl(174, 72%, 52%)",
  "hsl(262, 60%, 58%)",
  "hsl(38, 92%, 60%)",
  "hsl(340, 65%, 58%)",
  "hsl(200, 80%, 55%)",
  "hsl(120, 50%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 50%, 60%)",
];

interface SingleBoxPlotProps {
  stats: BoxStats;
  color: string;
}

const PLOT_W = 220;
const PLOT_H = 120;
const PAD_X = 30;
const PAD_Y = 16;
const BOX_H = 36;

const SingleBoxPlot = ({ stats, color }: SingleBoxPlotProps) => {
  const { min, q1, median, q3, max, outliers } = stats;
  const range = max - min || 1;

  const x = (v: number) => PAD_X + ((v - min) / range) * (PLOT_W - PAD_X * 2);
  const midY = PLOT_H / 2;
  const boxTop = midY - BOX_H / 2;

  // Tick values
  const ticks = [min, q1, median, q3, max];

  return (
    <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} className="w-full" style={{ maxHeight: 130 }}>
      {/* Whisker line */}
      <line x1={x(min)} y1={midY} x2={x(max)} y2={midY} stroke={color} strokeWidth={1.5} opacity={0.5} />
      {/* Whisker caps */}
      <line x1={x(min)} y1={midY - 10} x2={x(min)} y2={midY + 10} stroke={color} strokeWidth={1.5} />
      <line x1={x(max)} y1={midY - 10} x2={x(max)} y2={midY + 10} stroke={color} strokeWidth={1.5} />
      {/* Box */}
      <rect
        x={x(q1)}
        y={boxTop}
        width={x(q3) - x(q1)}
        height={BOX_H}
        rx={4}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Median line */}
      <line x1={x(median)} y1={boxTop} x2={x(median)} y2={boxTop + BOX_H} stroke={color} strokeWidth={2.5} />
      {/* Outliers */}
      {outliers.map((v, i) => (
        <circle key={i} cx={x(v)} cy={midY} r={2.5} fill={color} fillOpacity={0.7} />
      ))}
      {/* Tick labels */}
      {ticks.map((v, i) => (
        <text
          key={i}
          x={x(v)}
          y={PLOT_H - 2}
          textAnchor="middle"
          fill="hsl(215,12%,52%)"
          fontSize={8}
          fontFamily="monospace"
        >
          {v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1)}
        </text>
      ))}
    </svg>
  );
};

interface BoxPlotChartsProps {
  analysis: DatasetAnalysis;
}

const BoxPlotCharts = ({ analysis }: BoxPlotChartsProps) => {
  const boxData = useMemo(() => {
    return analysis.numericColumns
      .map((col) => {
        const values = analysis.rawData
          .map((r) => Number(r[col]))
          .filter((v) => !isNaN(v));
        if (values.length < 4) return null;
        return computeBoxStats(values, col);
      })
      .filter(Boolean) as BoxStats[];
  }, [analysis]);

  if (boxData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <div className="mb-4 flex items-center gap-2">
        <BoxSelect className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Box Plots</h3>
        <span className="text-xs text-muted-foreground ml-1">Quartiles &amp; Outliers</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boxData.map((stats, idx) => (
          <div key={stats.col} className="glass-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="truncate font-mono text-xs font-semibold text-foreground" title={stats.col}>
                {stats.col}
              </p>
              {stats.outliers.length > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                  {stats.outliers.length} outlier{stats.outliers.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <SingleBoxPlot stats={stats} color={COLORS[idx % COLORS.length]} />
            <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[9px] text-muted-foreground font-mono">
              <div><span className="block text-foreground/70">Min</span>{stats.min.toFixed(1)}</div>
              <div><span className="block text-foreground/70">Q1</span>{stats.q1.toFixed(1)}</div>
              <div><span className="block text-foreground/70">Med</span>{stats.median.toFixed(1)}</div>
              <div><span className="block text-foreground/70">Q3</span>{stats.q3.toFixed(1)}</div>
              <div><span className="block text-foreground/70">Max</span>{stats.max.toFixed(1)}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BoxPlotCharts;
