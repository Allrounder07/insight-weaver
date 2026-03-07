import type { DatasetAnalysis } from "@/context/DatasetContext";

function isNumeric(val: string): boolean {
  if (!val || val.trim() === "") return false;
  return !isNaN(Number(val));
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function stdDev(arr: number[], mean: number): number {
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx, yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function analyzeDataset(
  data: string[][],
  fileName: string,
  fileSize: number
): DatasetAnalysis {
  const headers = data[0];
  const rows = data.slice(1).filter(r => r.some(c => c.trim() !== ""));
  const rawData = rows.map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj;
  });

  // Determine column types by sampling
  const columnTypes: Record<string, "numeric" | "categorical"> = {};
  headers.forEach((h, ci) => {
    const sample = rows.slice(0, Math.min(100, rows.length));
    const numCount = sample.filter(r => isNumeric(r[ci])).length;
    const nonEmpty = sample.filter(r => r[ci]?.trim() !== "").length;
    columnTypes[h] = nonEmpty > 0 && numCount / nonEmpty > 0.7 ? "numeric" : "categorical";
  });

  const numericColumns = headers.filter(h => columnTypes[h] === "numeric");
  const categoricalColumns = headers.filter(h => columnTypes[h] === "categorical");

  // Missing values
  let missing = 0;
  rows.forEach(r => headers.forEach((_, ci) => {
    if (!r[ci] || r[ci].trim() === "") missing++;
  }));
  const totalCells = rows.length * headers.length;

  // Duplicates
  const rowStrings = new Set<string>();
  let dupes = 0;
  rows.forEach(r => {
    const key = r.join("||");
    if (rowStrings.has(key)) dupes++;
    else rowStrings.add(key);
  });

  // Stats for numeric columns
  const stats: DatasetAnalysis["stats"] = {};
  const numericArrays: Record<string, number[]> = {};
  numericColumns.forEach(h => {
    const ci = headers.indexOf(h);
    const vals = rows.map(r => r[ci]).filter(isNumeric).map(Number);
    numericArrays[h] = vals;
    if (vals.length > 0) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      stats[h] = {
        mean,
        median: median(vals),
        min: Math.min(...vals),
        max: Math.max(...vals),
        stdDev: stdDev(vals, mean),
      };
    }
  });

  // Correlations (top pairs)
  const correlations: DatasetAnalysis["correlations"] = [];
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const a = numericColumns[i], b = numericColumns[j];
      const xa = numericArrays[a], xb = numericArrays[b];
      // Align by row
      const ci_a = headers.indexOf(a), ci_b = headers.indexOf(b);
      const px: number[] = [], py: number[] = [];
      rows.forEach(r => {
        if (isNumeric(r[ci_a]) && isNumeric(r[ci_b])) {
          px.push(Number(r[ci_a]));
          py.push(Number(r[ci_b]));
        }
      });
      correlations.push({ col1: a, col2: b, value: pearson(px, py) });
    }
  }

  // Categorical counts
  const categoricalCounts: Record<string, Record<string, number>> = {};
  categoricalColumns.forEach(h => {
    const ci = headers.indexOf(h);
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      const v = (r[ci] ?? "").trim();
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    categoricalCounts[h] = counts;
  });

  return {
    fileName,
    fileSize,
    rows: rows.length,
    columns: headers,
    columnTypes,
    numericColumns,
    categoricalColumns,
    missingValues: missing,
    missingPercent: totalCells > 0 ? (missing / totalCells) * 100 : 0,
    duplicateRows: dupes,
    rawData,
    stats,
    correlations,
    categoricalCounts,
  };
}
