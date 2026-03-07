import { createContext, useContext, useState, ReactNode } from "react";

export interface DatasetAnalysis {
  fileName: string;
  fileSize: number;
  rows: number;
  columns: string[];
  columnTypes: Record<string, "numeric" | "categorical">;
  numericColumns: string[];
  categoricalColumns: string[];
  missingValues: number;
  missingPercent: number;
  duplicateRows: number;
  rawData: Record<string, string>[];
  stats: Record<string, { mean: number; median: number; min: number; max: number; stdDev: number }>;
  correlations: { col1: string; col2: string; value: number }[];
  categoricalCounts: Record<string, Record<string, number>>;
}

interface DatasetContextType {
  analysis: DatasetAnalysis | null;
  setAnalysis: (a: DatasetAnalysis | null) => void;
}

const DatasetContext = createContext<DatasetContextType>({ analysis: null, setAnalysis: () => {} });

export const useDataset = () => useContext(DatasetContext);

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  return (
    <DatasetContext.Provider value={{ analysis, setAnalysis }}>
      {children}
    </DatasetContext.Provider>
  );
};
