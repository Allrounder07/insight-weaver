import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload, BarChart3, Brain, Sparkles, Database, Zap,
  ArrowRight, TrendingUp, PieChart, ScatterChart, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CursorLight from "@/components/CursorLight";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Upload, title: "Smart Upload", desc: "Drag & drop CSV or Excel files with instant validation and preview." },
  { icon: Sparkles, title: "Auto Cleaning", desc: "Detects missing values, duplicates, outliers, and fixes data types." },
  { icon: BarChart3, title: "Visual Analytics", desc: "Histograms, scatter plots, heatmaps, and trend lines generated automatically." },
  { icon: Brain, title: "AI Insights", desc: "Natural language explanations of patterns, correlations, and anomalies." },
  { icon: GitBranch, title: "ML Recommendations", desc: "Suggests optimal machine learning models for your dataset structure." },
  { icon: Zap, title: "Instant Results", desc: "Full analysis pipeline runs in seconds — no coding required." },
];

const workflow = [
  { step: "01", title: "Upload Dataset", desc: "Drop your CSV or Excel file" },
  { step: "02", title: "Auto Processing", desc: "Data cleaning & validation" },
  { step: "03", title: "Generate Visuals", desc: "Charts & statistical analysis" },
  { step: "04", title: "AI Insights", desc: "Smart explanations & recommendations" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CursorLight />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(174,72%,52%) 1px, transparent 1px), linear-gradient(90deg, hsl(174,72%,52%) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Glow orbs */}
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary/30"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        <div className="section-container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div custom={0} variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Data Analysis
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Analyse{" "}
              <span className="gradient-text">Datasets</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
              Upload any dataset and get instant statistical analysis, beautiful visualizations, and AI-generated insights.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/upload">
                <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90 group">
                  <Upload className="h-4 w-4" />
                  Upload Dataset
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="gap-2 px-8 group">
                  View Demo Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            {/* Tech names ticker */}
            <motion.div custom={4} variants={fadeUp} className="mt-16 flex flex-wrap items-center justify-center gap-3">
              {[
                "Python", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow",
                "PyTorch", "Matplotlib", "Jupyter", "R", "SQL", "Keras", "Spark",
              ].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {name}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <motion.p custom={0} variants={fadeUp} className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
              Features
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
              Everything You Need for
              <span className="gradient-text"> Data Analysis</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                className="glass-card hover-lift group p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-y border-border/50 bg-card/30 py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <motion.p custom={0} variants={fadeUp} className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
              How It Works
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
              From Upload to <span className="gradient-text">Insights</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {workflow.map((w, i) => (
              <motion.div key={w.step} custom={i} variants={fadeUp} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 font-mono text-lg font-bold text-primary">
                  {w.step}
                </div>
                <h3 className="mb-1 font-semibold">{w.title}</h3>
                <p className="text-sm text-muted-foreground">{w.desc}</p>
                {i < workflow.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-6 hidden h-5 w-5 text-border lg:block" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <motion.p custom={0} variants={fadeUp} className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
              Use Cases
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
              Built for <span className="gradient-text">Everyone</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: Database, title: "Students", desc: "Analyze datasets for academic projects" },
              { icon: TrendingUp, title: "Business", desc: "Sales and revenue data analysis" },
              { icon: PieChart, title: "Research", desc: "Experimental data exploration" },
              { icon: ScatterChart, title: "Marketing", desc: "Customer behavior insights" },
            ].map((u, i) => (
              <motion.div key={u.title} custom={i} variants={fadeUp} className="glass-card p-5 text-center hover-lift">
                <u.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                <h3 className="mb-1 font-semibold">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-card glow-border mx-auto max-w-2xl p-12 text-center"
          >
            <motion.h2 custom={0} variants={fadeUp} className="mb-4 text-3xl font-bold">
              Ready to <span className="gradient-text">Analyze</span>?
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mb-8 text-muted-foreground">
              Upload your first dataset and see the magic happen.
            </motion.p>
            <motion.div custom={2} variants={fadeUp}>
              <Link to="/upload">
                <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90 group">
                  <Upload className="h-4 w-4" />
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="section-container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">DataLens</span>
          </div>
          <p>AI-Powered Dataset Analysis Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
