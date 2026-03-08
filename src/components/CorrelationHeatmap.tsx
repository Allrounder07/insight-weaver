import { useMemo } from "react";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";
import { Tooltip as RechartsTooltip } from "recharts";
import { DatasetAnalysis } from "@/context/DatasetContext";

interface CorrelationHeatmapProps {
  analysis: DatasetAnalysis;
}

const getColor = (value: number) => {
  // -1 (cool blue) → 0 (neutral) → +1 (hot teal/green)
  if (value >= 0) {
    const t = value;
    return `hsl(174, ${Math.round(72 * t)}%, ${Math.round(52 - 20 * t)}%)`;
  }
  const t = Math.abs(value);
  return `hsl(262, ${Math.round(60 * t)}%, ${Math.round(58 - 15 * t)}%)`;
};

const CorrelationHeatmap = ({ analysis }: CorrelationHeatmapProps) => {
  const cols = analysis.numericColumns;

  const matrix = useMemo(() => {
    const lookup: Record<string, number> = {};
    for (const c of analysis.correlations) {
      lookup[`${c.col1}__${c.col2}`] = c.value;
      lookup[`${c.col2}__${c.col1}`] = c.value;
    }
    return cols.map((row) =>
      cols.map((col) => (row === col ? 1 : lookup[`${row}__${col}`] ?? 0))
    );
  }, [cols, analysis.correlations]);

  if (cols.length < 2) return null;

  const cellSize = Math.min(48, Math.max(28, 400 / cols.length));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card mb-8 p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Grid3X3 className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Correlation Heatmap</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex" style={{ paddingLeft: cellSize * 2.5 }}>
            {cols.map((col) => (
              <div
                key={col}
                className="text-[10px] text-muted-foreground font-mono truncate"
                style={{
                  width: cellSize,
                  transform: "rotate(-45deg)",
                  transformOrigin: "left bottom",
                  whiteSpace: "nowrap",
                  height: cellSize * 1.2,
                  display: "flex",
                  alignItems: "flex-end",
                }}
                title={col}
              >
                {col.length > 10 ? col.slice(0, 9) + "…" : col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {cols.map((rowCol, ri) => (
            <div key={rowCol} className="flex items-center">
              <div
                className="text-[10px] text-muted-foreground font-mono truncate text-right pr-2 shrink-0"
                style={{ width: cellSize * 2.5 }}
                title={rowCol}
              >
                {rowCol.length > 14 ? rowCol.slice(0, 13) + "…" : rowCol}
              </div>
              {cols.map((colCol, ci) => {
                const val = matrix[ri][ci];
                return (
                  <div
                    key={colCol}
                    className="relative group border border-background/20 flex items-center justify-center font-mono transition-transform hover:scale-110 hover:z-10"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getColor(val),
                      borderRadius: 3,
                    }}
                  >
                    <span
                      className="text-[9px] font-semibold"
                      style={{
                        color: Math.abs(val) > 0.5 ? "hsl(0,0%,100%)" : "hsl(210,20%,80%)",
                      }}
                    >
                      {val.toFixed(2)}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-lg border border-border">
                      {rowCol} × {colCol}: {val.toFixed(3)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>-1</span>
            <div className="flex h-3 w-32 rounded overflow-hidden">
              {Array.from({ length: 20 }, (_, i) => {
                const v = -1 + (2 * i) / 19;
                return <div key={i} className="flex-1" style={{ backgroundColor: getColor(v) }} />;
              })}
            </div>
            <span>+1</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CorrelationHeatmap;
