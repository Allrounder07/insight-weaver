import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useDataset } from "@/context/DatasetContext";
import { useAuth } from "@/context/AuthContext";
import { analyzeDataset } from "@/lib/analyzeDataset";
import { validateDataset } from "@/lib/validateDataset";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import ValidationReportCard from "@/components/ValidationReportCard";

const UploadPage = () => {
  const navigate = useNavigate();
  const { setAnalysis } = useDataset();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fullData, setFullData] = useState<string[][] | null>(null);
  const [validationReport, setValidationReport] = useState<ReturnType<typeof validateDataset> | null>(null);

  const processFile = useCallback((f: File) => {
    setError(null);
    setValidationReport(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      setError("Please upload a CSV or Excel file.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File size must be under 50MB.");
      return;
    }
    setFile(f);

    if (ext === "csv") {
      Papa.parse(f, {
        complete: (results) => {
          const data = results.data as string[][];
          setFullData(data);
          setPreview(data.slice(0, 6));
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
          const strData = data.map((row) => row.map((cell) => String(cell)));
          setFullData(strData);
          setPreview(strData.slice(0, 6));
        } catch {
          setError("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(f);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleAnalyze = () => {
    if (!fullData || !file) return;
    setAnalyzing(true);
    setTimeout(async () => {
      try {
        const result = analyzeDataset(fullData, file.name, file.size);
        const report = validateDataset(result);
        setValidationReport(report);
        result.validationReport = report;

        // Save to database
        if (user) {
          const shareId = crypto.randomUUID().slice(0, 8);
          const { data: saved, error: saveError } = await supabase
            .from("datasets")
            .insert({
              user_id: user.id,
              file_name: result.fileName,
              file_size: result.fileSize,
              row_count: result.rows,
              column_count: result.columns.length,
              columns: result.columns,
              column_types: result.columnTypes,
              numeric_columns: result.numericColumns,
              categorical_columns: result.categoricalColumns,
              missing_values: result.missingValues,
              missing_percent: result.missingPercent,
              duplicate_rows: result.duplicateRows,
              stats: result.stats,
              correlations: result.correlations,
              categorical_counts: result.categoricalCounts,
              validation_report: report as any,
              share_id: shareId,
            })
            .select("id, share_id")
            .single();

          if (saveError) {
            console.error("Save error:", saveError);
            toast.error("Analysis complete but failed to save to cloud.");
          } else if (saved) {
            result.savedId = saved.id;
            result.shareId = saved.share_id;
            toast.success("Analysis saved to cloud!");
          }

          // Request AI insights in background
          fetchAIInsights(result).then((insights) => {
            if (insights && saved) {
              result.aiInsights = insights;
              setAnalysis({ ...result });
              // Update in DB
              supabase
                .from("datasets")
                .update({ ai_insights: insights })
                .eq("id", saved.id)
                .then(() => {});
            }
          });
        }

        setAnalysis(result);
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
        setError("Failed to analyze dataset. Please check the file format.");
        setAnalyzing(false);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="section-container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Upload Your <span className="gradient-text">Dataset</span>
          </h1>
          <p className="text-muted-foreground">
            Drop a CSV or Excel file to start instant AI-powered analysis.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`glass-card relative cursor-pointer border-2 border-dashed p-12 text-center transition-all ${
              isDragging ? "border-primary bg-primary/5" : file ? "border-primary/30" : "border-border hover:border-primary/40"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{isDragging ? "Drop your file here" : "Drag & drop your dataset"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">or click to browse · CSV, XLSX · Max 50MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setFullData(null); setValidationReport(null); }}
                    className="ml-2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Preview table */}
          {preview && preview.length > 0 && preview[0].length > 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Data Preview {fullData && `· ${(fullData.length - 1).toLocaleString()} rows × ${fullData[0].length} columns`}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      {preview[0].map((h, i) => (
                        <th key={i} className="px-4 py-2.5 text-left font-medium text-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-b border-border/50 last:border-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2 text-muted-foreground font-mono text-xs">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Validation report (shown after analysis) */}
          {validationReport && (
            <div className="mt-6">
              <ValidationReportCard report={validationReport} />
            </div>
          )}

          {/* Analyze button */}
          {file && fullData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="gap-2 bg-primary px-10 text-primary-foreground hover:bg-primary/90"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Dataset
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

async function fetchAIInsights(analysis: any): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-dataset", {
      body: {
        stats: analysis.stats,
        columns: analysis.columns,
        numericColumns: analysis.numericColumns,
        categoricalColumns: analysis.categoricalColumns,
        rows: analysis.rows,
        missingPercent: analysis.missingPercent,
        duplicateRows: analysis.duplicateRows,
        correlations: analysis.correlations,
        categoricalCounts: analysis.categoricalCounts,
        validationReport: analysis.validationReport,
      },
    });
    if (error) {
      console.error("AI insights error:", error);
      return null;
    }
    return data?.insights ?? null;
  } catch (e) {
    console.error("AI insights fetch error:", e);
    return null;
  }
}

export default UploadPage;
