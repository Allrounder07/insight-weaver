import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database, Loader2 } from "lucide-react";
import type { DatasetAnalysis } from "@/context/DatasetContext";
import { DatasetProvider, useDataset } from "@/context/DatasetContext";
import Dashboard from "./Dashboard";

const SharedDashboardInner = () => {
  const { shareId } = useParams();
  const { analysis, setAnalysis } = useDataset();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("datasets")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (fetchError || !data) {
        setError("Shared report not found.");
        setLoading(false);
        return;
      }

      const restored: DatasetAnalysis = {
        fileName: data.file_name,
        fileSize: Number(data.file_size),
        rows: data.row_count,
        columns: data.columns as string[],
        columnTypes: data.column_types as Record<string, "numeric" | "categorical">,
        numericColumns: data.numeric_columns as string[],
        categoricalColumns: data.categorical_columns as string[],
        missingValues: data.missing_values,
        missingPercent: Number(data.missing_percent),
        duplicateRows: data.duplicate_rows,
        rawData: [],
        stats: data.stats as any,
        correlations: data.correlations as any,
        categoricalCounts: data.categorical_counts as any,
        validationReport: data.validation_report as any,
        aiInsights: data.ai_insights ?? undefined,
        savedId: data.id,
        shareId: data.share_id ?? undefined,
      };

      setAnalysis(restored);
      setLoading(false);
    })();
  }, [shareId, setAnalysis]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col items-center justify-center gap-4">
        <Database className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return <Dashboard />;
};

const SharedDashboard = () => (
  <DatasetProvider>
    <SharedDashboardInner />
  </DatasetProvider>
);

export default SharedDashboard;
