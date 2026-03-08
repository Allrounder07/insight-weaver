import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { DatasetAnalysis } from "@/context/DatasetContext";

const HIST_COLORS = [
  "hsl(174, 72%, 52%)",
  "hsl(262, 60%, 58%)",
  "hsl(38, 92%, 60%)",
  "hsl(340, 65%, 58%)",
  "hsl(200, 80%, 55%)",
  "hsl(120, 50%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 50%, 60%)",
];

const tooltipStyle = {
  background: "hsl(220,18%,10%)",
  border: "1px solid hsl(220,14%,18%)",
  borderRadius: 8,
  color: "hsl(210,20%,92%)",
};

const NUM_BINS = 15;

function buildHistogram(values: number[], bins: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: `${min.toFixed(1)}`, count: values.length }];
  const binWidth = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  }
  return counts.map((count, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}`,
    count,
  }));
}

interface HistogramChartsProps {
  analysis: DatasetAnalysis;
}

const HistogramCharts = ({ analysis }: HistogramChartsProps) => {
  const histograms = useMemo(() => {
    return analysis.numericColumns.map((col) => {
      const values = analysis.rawData
        .map((r) => Number(r[col]))
        .filter((v) => !isNaN(v));
      return { col, data: buildHistogram(values, NUM_BINS) };
    });
  }, [analysis]);

  if (histograms.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mb-8"
    >
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Numeric Distributions</h3>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {histograms.map(({ col, data }, idx) => (
          <div key={col} className="glass-card p-4">
            <p className="mb-3 truncate font-mono text-xs font-semibold text-foreground" title={col}>
              {col}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "hsl(215,12%,52%)", fontSize: 9 }}
                  interval={Math.max(0, Math.floor(data.length / 5) - 1)}
                  angle={-30}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fill: "hsl(215,12%,52%)", fontSize: 10 }} width={35} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  fill={HIST_COLORS[idx % HIST_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default HistogramCharts;
