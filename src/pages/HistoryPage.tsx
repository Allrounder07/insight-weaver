import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Database, Calendar, FileSpreadsheet, Rows3, Columns3,
  AlertTriangle, Trash2, Loader2, ArrowRight, Search,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";

interface DatasetRecord {
  id: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  missing_values: number;
  missing_percent: number;
  duplicate_rows: number;
  created_at: string;
  share_id: string | null;
  ai_insights: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDatasets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("datasets")
        .select("id, file_name, file_size, row_count, column_count, missing_values, missing_percent, duplicate_rows, created_at, share_id, ai_insights")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load history");
      } else {
        setDatasets((data as DatasetRecord[]) || []);
      }
      setLoading(false);
    };
    fetchDatasets();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("datasets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete dataset");
    } else {
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dataset deleted");
    }
    setDeleting(null);
  };

  const filtered = datasets.filter((d) =>
    d.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="section-container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Database className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-widest">History</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold">
            Your <span className="gradient-text">Datasets</span>
          </h1>
          <p className="mb-8 text-muted-foreground">
            All previously uploaded and analyzed datasets
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search datasets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card flex flex-col items-center py-20 text-center"
          >
            <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-2 text-lg font-semibold">
              {search ? "No matching datasets" : "No datasets yet"}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Upload your first CSV or Excel file to get started with analysis."}
            </p>
            {!search && (
              <Button onClick={() => navigate("/upload")} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Upload Dataset
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4"
            initial="hidden"
            animate="visible"
          >
            {filtered.map((d, i) => {
              const date = new Date(d.created_at);
              const hasIssues = d.missing_values > 0 || d.duplicate_rows > 0;
              return (
                <motion.div
                  key={d.id}
                  custom={i}
                  variants={fadeUp}
                  className="glass-card hover-lift group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{d.file_name}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Rows3 className="h-3 w-3" />
                          {d.row_count.toLocaleString()} rows
                        </span>
                        <span className="flex items-center gap-1">
                          <Columns3 className="h-3 w-3" />
                          {d.column_count} cols
                        </span>
                        <span>{formatSize(d.file_size)}</span>
                        {hasIssues && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {d.missing_values > 0 && `${d.missing_values} missing`}
                            {d.missing_values > 0 && d.duplicate_rows > 0 && ", "}
                            {d.duplicate_rows > 0 && `${d.duplicate_rows} dupes`}
                          </span>
                        )}
                      </div>
                      {d.ai_insights && (
                        <p className="mt-2 line-clamp-1 max-w-lg text-xs text-muted-foreground/70">
                          {d.ai_insights.slice(0, 120)}…
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {d.share_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/shared/${d.share_id}`);
                          toast.success("Share link copied!");
                        }}
                      >
                        Share Link
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(d.id)}
                      disabled={deleting === d.id}
                    >
                      {deleting === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
