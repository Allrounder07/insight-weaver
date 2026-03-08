import type { DatasetAnalysis } from "@/context/DatasetContext";

export interface ValidationIssue {
  column: string;
  type: "type_mismatch" | "missing_value" | "outlier" | "suggestion";
  severity: "error" | "warning" | "info";
  message: string;
  count?: number;
  suggestion?: string;
}

export interface ValidationReport {
  completenessScore: number;
  accuracyScore: number;
  overallScore: number;
  issues: ValidationIssue[];
  summary: string;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export function validateDataset(analysis: DatasetAnalysis): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Completeness: missing values
  const totalCells = analysis.rows * analysis.columns.length;
  const completenessScore = totalCells > 0 ? ((totalCells - analysis.missingValues) / totalCells) * 100 : 100;

  analysis.columns.forEach((col) => {
    const missingCount = analysis.rawData.filter((r) => !r[col] || r[col].trim() === "").length;
    if (missingCount > 0) {
      const pct = ((missingCount / analysis.rows) * 100).toFixed(1);
      issues.push({
        column: col,
        type: "missing_value",
        severity: missingCount / analysis.rows > 0.3 ? "error" : "warning",
        message: `${missingCount} missing values (${pct}%)`,
        count: missingCount,
        suggestion: missingCount / analysis.rows > 0.5
          ? `Consider dropping column "${col}" (>50% missing)`
          : analysis.columnTypes[col] === "numeric"
          ? `Fill with median (${analysis.stats[col]?.median.toFixed(2) ?? "N/A"})`
          : `Fill with mode or "Unknown"`,
      });
    }
  });

  // 2. Type validation: check for mismatches in numeric columns
  let typeMismatchCount = 0;
  analysis.numericColumns.forEach((col) => {
    const nonEmpty = analysis.rawData.filter((r) => r[col] && r[col].trim() !== "");
    const nonNumeric = nonEmpty.filter((r) => isNaN(Number(r[col])));
    if (nonNumeric.length > 0) {
      typeMismatchCount += nonNumeric.length;
      issues.push({
        column: col,
        type: "type_mismatch",
        severity: "error",
        message: `${nonNumeric.length} non-numeric values in numeric column`,
        count: nonNumeric.length,
        suggestion: `Convert or remove ${nonNumeric.length} non-numeric entries`,
      });
    }
  });

  // 3. Outlier detection using IQR for numeric columns
  let outlierCount = 0;
  analysis.numericColumns.forEach((col) => {
    const vals = analysis.rawData
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    if (vals.length < 4) return;

    const q1 = quantile(vals, 0.25);
    const q3 = quantile(vals, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const outliers = vals.filter((v) => v < lower || v > upper);

    if (outliers.length > 0) {
      outlierCount += outliers.length;
      const pct = ((outliers.length / vals.length) * 100).toFixed(1);
      issues.push({
        column: col,
        type: "outlier",
        severity: outliers.length / vals.length > 0.1 ? "warning" : "info",
        message: `${outliers.length} outliers detected (${pct}%)`,
        count: outliers.length,
        suggestion: `Values outside [${lower.toFixed(2)}, ${upper.toFixed(2)}] — consider capping or investigating`,
      });
    }
  });

  // 4. Duplicate row suggestion
  if (analysis.duplicateRows > 0) {
    issues.push({
      column: "(all)",
      type: "suggestion",
      severity: "warning",
      message: `${analysis.duplicateRows} duplicate rows found`,
      count: analysis.duplicateRows,
      suggestion: "Remove duplicate rows to avoid bias in analysis",
    });
  }

  // Accuracy score: penalize type mismatches and high outlier %
  const totalNumericCells = analysis.numericColumns.reduce(
    (sum, col) => sum + analysis.rawData.filter((r) => r[col] && r[col].trim() !== "").length,
    0
  );
  const accuracyScore = totalNumericCells > 0
    ? Math.max(0, 100 - ((typeMismatchCount / totalNumericCells) * 100) - ((outlierCount / totalNumericCells) * 50))
    : 100;

  const overallScore = (completenessScore * 0.5 + accuracyScore * 0.5);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;

  const summary = errorCount > 0
    ? `Dataset has ${errorCount} critical issue${errorCount > 1 ? "s" : ""} and ${warnCount} warning${warnCount !== 1 ? "s" : ""}. Review before analysis.`
    : warnCount > 0
    ? `Dataset looks mostly good with ${warnCount} warning${warnCount !== 1 ? "s" : ""} to consider.`
    : "Dataset quality is excellent — no issues detected!";

  return { completenessScore, accuracyScore, overallScore, issues, summary };
}
