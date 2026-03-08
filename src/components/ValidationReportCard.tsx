import { motion } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, AlertCircle, Info, Lightbulb, CheckCircle2,
} from "lucide-react";
import type { ValidationReport } from "@/lib/validateDataset";

interface ValidationReportCardProps {
  report: ValidationReport;
}

const severityIcon = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityColor = {
  error: "text-destructive",
  warning: "text-yellow-500",
  info: "text-blue-400",
};

const scoreColor = (score: number) =>
  score >= 90 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-destructive";

const ScoreRing = ({ score, label }: { score: number; label: string }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(220,14%,18%)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ${scoreColor(score)}`}
        />
      </svg>
      <span className={`-mt-14 text-lg font-bold font-mono ${scoreColor(score)}`}>
        {score.toFixed(0)}%
      </span>
      <span className="mt-8 text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
};

const ValidationReportCard = ({ report }: ValidationReportCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Data Validation Report</h3>
      </div>

      {/* Scores */}
      <div className="mb-6 flex justify-center gap-8">
        <ScoreRing score={report.overallScore} label="Overall" />
        <ScoreRing score={report.completenessScore} label="Complete" />
        <ScoreRing score={report.accuracyScore} label="Accuracy" />
      </div>

      {/* Summary */}
      <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
        report.issues.filter(i => i.severity === "error").length > 0
          ? "bg-destructive/10 text-destructive"
          : report.issues.filter(i => i.severity === "warning").length > 0
          ? "bg-yellow-500/10 text-yellow-400"
          : "bg-green-500/10 text-green-400"
      }`}>
        {report.issues.filter(i => i.severity === "error").length > 0
          ? <AlertCircle className="h-4 w-4 shrink-0" />
          : <CheckCircle2 className="h-4 w-4 shrink-0" />}
        {report.summary}
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div className="space-y-2">
          {report.issues.map((issue, i) => {
            const Icon = severityIcon[issue.severity];
            return (
              <div
                key={`${issue.column}-${issue.type}-${i}`}
                className="rounded-lg border border-border bg-secondary/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${severityColor[issue.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{issue.column}</span>
                      <span className="text-foreground">{issue.message}</span>
                    </div>
                    {issue.suggestion && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                        <Lightbulb className="h-3 w-3 shrink-0" />
                        {issue.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ValidationReportCard;
