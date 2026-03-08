-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Datasets table: stores metadata about uploaded datasets
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_types JSONB NOT NULL DEFAULT '{}'::jsonb,
  numeric_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  categorical_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_values INTEGER NOT NULL DEFAULT 0,
  missing_percent NUMERIC NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlations JSONB NOT NULL DEFAULT '[]'::jsonb,
  categorical_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_report JSONB DEFAULT NULL,
  ai_insights TEXT DEFAULT NULL,
  share_id TEXT UNIQUE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own datasets"
  ON public.datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON public.datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON public.datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON public.datasets FOR DELETE
  USING (auth.uid() = user_id);

-- Public access for shared reports
CREATE POLICY "Anyone can view shared datasets"
  ON public.datasets FOR SELECT
  USING (share_id IS NOT NULL);

-- Timestamp trigger
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_datasets_share_id ON public.datasets(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);

-- Storage bucket for raw dataset files
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);

CREATE POLICY "Users can upload their own datasets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own dataset files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own dataset files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);