import { useMemo, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, GitBranch,
  Database, Rows3, Columns3, Hash, Upload, Download, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataset } from "@/context/DatasetContext";
import { toast } from "@/components/ui/sonner";
import DataTable from "@/components/DataTable";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";
import HistogramCharts from "@/components/HistogramCharts";
import BoxPlotCharts from "@/components/BoxPlotCharts";

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

const tooltipStyle = {
  background: "hsl(220,18%,10%)",
  border: "1px solid hsl(220,14%,18%)",
  borderRadius: 8,
  color: "hsl(210,20%,92%)",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

const Dashboard = () => {
  const { analysis } = useDataset();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!dashboardRef.current || !analysis) return;
    setExporting(true);
    toast("Generating PDF report…");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: "#0f1117",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      let position = 0;
      const pageHeight = 297;

      // Multi-page support
      let remainingHeight = imgHeight;
      while (remainingHeight > 0) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          position -= pageHeight;
        }
      }

      pdf.save(`${analysis.fileName.replace(/\.[^.]+$/, "")}_analysis.pdf`);
      toast.success("PDF report downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  }, [analysis]);

  // Derived chart data
  const { barChartData, pieChartData, scatterData, trendData, insights, mlModels } = useMemo(() => {
    if (!analysis) return { barChartData: [], pieChartData: [], scatterData: [], trendData: [], insights: [], mlModels: [] };

    // Bar chart: first categorical column counts (top 8)
    const firstCat = analysis.categoricalColumns[0];
    const barChartData = firstCat
      ? Object.entries(analysis.categoricalCounts[firstCat])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }))
      : [];

    // Pie chart: same data as percentages
    const pieChartData = barChartData.map(d => ({ name: d.name, value: d.count }));

    // Scatter plot: first two numeric columns
    const n1 = analysis.numericColumns[0];
    const n2 = analysis.numericColumns[1];
    const scatterData = n1 && n2
      ? analysis.rawData
          .filter(r => r[n1] && r[n2] && !isNaN(Number(r[n1])) && !isNaN(Number(r[n2])))
          .slice(0, 200)
          .map(r => ({ x: Number(r[n1]), y: Number(r[n2]) }))
      : [];

    // Trend: if there's a numeric column that looks like a year or ordered, use first numeric as x, second as y
    const trendData = scatterData.length > 0
      ? [...scatterData].sort((a, b) => a.x - b.x).filter((_, i) => i % Math.max(1, Math.floor(scatterData.length / 30)) === 0)
      : [];

    // Insights
    const insights: { icon: typeof TrendingUp; title: string; text: string }[] = [];

    // Data quality
    insights.push({
      icon: CheckCircle2,
      title: "Data Quality",
      text: `Dataset is ${(100 - analysis.missingPercent).toFixed(2)}% complete with ${analysis.missingValues} missing values across ${analysis.columns.length} columns. ${analysis.duplicateRows} duplicate rows detected.`,
    });

    // Top category
    if (firstCat && barChartData.length > 0) {
      const top = barChartData[0];
      const pct = ((top.count / analysis.rows) * 100).toFixed(1);
      insights.push({
        icon: Sparkles,
        title: `Top ${firstCat}`,
        text: `"${top.name}" is the most frequent value in "${firstCat}" at ${pct}% (${top.count} records), followed by "${barChartData[1]?.name ?? "N/A"}" with ${barChartData[1]?.count ?? 0} records.`,
      });
    }

    // Correlation insight
    if (analysis.correlations.length > 0) {
      const sorted = [...analysis.correlations].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      const top = sorted[0];
      const dir = top.value > 0 ? "positive" : "negative";
      insights.push({
        icon: TrendingUp,
        title: "Strongest Correlation",
        text: `"${top.col1}" and "${top.col2}" show a ${dir} correlation of ${top.value.toFixed(3)}. ${Math.abs(top.value) > 0.7 ? "This is a strong relationship." : Math.abs(top.value) > 0.4 ? "This is a moderate relationship." : "This is a weak relationship."}`,
      });
    }

    // Outlier detection for first numeric
    if (n1 && analysis.stats[n1]) {
      const s = analysis.stats[n1];
      const iqr = s.max - s.min;
      insights.push({
        icon: AlertTriangle,
        title: "Value Range",
        text: `"${n1}" ranges from ${s.min.toFixed(2)} to ${s.max.toFixed(2)} (mean: ${s.mean.toFixed(2)}, std dev: ${s.stdDev.toFixed(2)}). ${s.stdDev > s.mean * 0.5 ? "High variability detected." : "Values are relatively consistent."}`,
      });
    }

    // ML model suggestions
    const hasLabeled = analysis.categoricalColumns.length > 0 && analysis.numericColumns.length > 0;
    const mlModels = hasLabeled
      ? [
          { model: "Random Forest", reason: `Best for mixed feature types with ${analysis.categoricalColumns.length} categorical and ${analysis.numericColumns.length} numeric columns` },
          { model: "Logistic Regression", reason: `Classification of "${analysis.categoricalColumns[0]}" with high interpretability` },
          { model: "K-Means Clustering", reason: `Discover hidden groupings across ${analysis.numericColumns.length} numeric dimensions` },
        ]
      : analysis.numericColumns.length >= 2
      ? [
          { model: "Linear Regression", reason: `Predict numeric outcomes with ${analysis.numericColumns.length} numeric features` },
          { model: "K-Means Clustering", reason: "Discover natural groupings in the data" },
          { model: "PCA", reason: `Reduce dimensionality of ${analysis.numericColumns.length} numeric columns` },
        ]
      : [{ model: "Association Rules", reason: "Find patterns in categorical data" }];

    return { barChartData, pieChartData, scatterData, trendData, insights, mlModels };
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col items-center justify-center gap-6">
        <Database className="h-16 w-16 text-muted-foreground/30" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Dataset Loaded</h2>
          <p className="text-muted-foreground mb-6">Upload a CSV file to see your analysis dashboard.</p>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Dataset
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Rows3, label: "Total Rows", value: analysis.rows.toLocaleString() },
    { icon: Columns3, label: "Columns", value: analysis.columns.length.toString() },
    { icon: Hash, label: "Numeric Fields", value: analysis.numericColumns.length.toString() },
    { icon: Database, label: "Missing Values", value: `${analysis.missingValues} (${analysis.missingPercent.toFixed(2)}%)` },
  ];

  const firstCat = analysis.categoricalColumns[0];
  const n1 = analysis.numericColumns[0];
  const n2 = analysis.numericColumns[1];

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="section-container" ref={dashboardRef}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Analysis <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.fileName} — {analysis.rows.toLocaleString()} records × {analysis.columns.length} columns
            </p>
          </div>
          <Button onClick={handleExportPDF} disabled={exporting} variant="outline" size="sm" className="gap-1.5 shrink-0">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </Button>
        </motion.div>

        {/* Stats cards */}
        <motion.div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible">
          {stats.map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeUp} className="glass-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-mono text-lg font-semibold">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Numeric stats table */}
        {analysis.numericColumns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card mb-8 overflow-x-auto p-6">
            <h3 className="mb-4 text-sm font-semibold">Numeric Column Statistics</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Column</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Mean</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Median</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Min</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Max</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Std Dev</th>
                </tr>
              </thead>
              <tbody>
                {analysis.numericColumns.filter(c => analysis.stats[c]).map(col => {
                  const s = analysis.stats[col];
                  return (
                    <tr key={col} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-foreground">{col}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.mean.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.median.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.min.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.max.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{s.stdDev.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Charts grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {barChartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">Distribution: {firstCat}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215,12%,52%)", fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {trendData.length > 2 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">{n1} vs {n2} Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(174,72%,52%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(174,72%,52%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                  <XAxis dataKey="x" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="y" stroke="hsl(174,72%,52%)" fill="url(#trendGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {pieChartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">{firstCat} Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {scatterData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">{n1} vs {n2}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                  <XAxis dataKey="x" name={n1} tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                  <YAxis dataKey="y" name={n2} tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Scatter data={scatterData} fill="hsl(262,60%,58%)" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Histogram Distributions */}
        {analysis.numericColumns.length > 0 && (
          <HistogramCharts analysis={analysis} />
        )}

        {/* Correlation Heatmap */}
        {analysis.numericColumns.length >= 2 && (
          <CorrelationHeatmap analysis={analysis} />
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div initial="hidden" animate="visible" className="mb-8">
            <motion.div custom={0} variants={fadeUp} className="mb-6 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">AI Insights</h2>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {insights.map((ins, i) => (
                <motion.div key={ins.title} custom={i + 1} variants={fadeUp} className="glass-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ins.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{ins.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ins.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ML Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card glow-border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">ML Model Recommendation</h2>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Based on the dataset structure ({analysis.numericColumns.length} numeric + {analysis.categoricalColumns.length} categorical features, {analysis.rows.toLocaleString()} samples):
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {mlModels.map((m) => (
                <div key={m.model} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="mb-1 font-mono text-sm font-semibold text-foreground">{m.model}</p>
                  <p className="text-xs leading-relaxed">{m.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <div className="mt-8">
          <DataTable data={analysis.rawData} columns={analysis.columns} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
