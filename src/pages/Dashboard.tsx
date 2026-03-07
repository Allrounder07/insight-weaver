import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import {
  Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, GitBranch,
  Database, Rows3, Columns3, Hash
} from "lucide-react";

// Mock data
const barData = [
  { genre: "Action", count: 342 },
  { genre: "Drama", count: 518 },
  { genre: "Comedy", count: 287 },
  { genre: "Thriller", count: 195 },
  { genre: "Sci-Fi", count: 163 },
  { genre: "Romance", count: 142 },
];

const lineData = [
  { year: 2015, rating: 6.2 },
  { year: 2016, rating: 6.4 },
  { year: 2017, rating: 6.5 },
  { year: 2018, rating: 6.8 },
  { year: 2019, rating: 7.0 },
  { year: 2020, rating: 7.1 },
  { year: 2021, rating: 7.3 },
  { year: 2022, rating: 7.2 },
  { year: 2023, rating: 7.5 },
];

const pieData = [
  { name: "Drama", value: 32 },
  { name: "Action", value: 21 },
  { name: "Comedy", value: 18 },
  { name: "Thriller", value: 12 },
  { name: "Other", value: 17 },
];

const scatterData = Array.from({ length: 40 }, (_, i) => ({
  x: Math.round(50 + Math.random() * 200),
  y: Math.round(4 + Math.random() * 5.5 * 10) / 10,
}));

const COLORS = [
  "hsl(174, 72%, 52%)",
  "hsl(262, 60%, 58%)",
  "hsl(38, 92%, 60%)",
  "hsl(340, 65%, 58%)",
  "hsl(200, 80%, 55%)",
];

const stats = [
  { icon: Rows3, label: "Total Rows", value: "1,647" },
  { icon: Columns3, label: "Columns", value: "12" },
  { icon: Hash, label: "Numeric Fields", value: "7" },
  { icon: Database, label: "Missing Values", value: "23 (0.12%)" },
];

const insights = [
  {
    icon: TrendingUp,
    title: "Rating Trend",
    text: "Movies released after 2017 show a consistent upward trend in audience ratings, with an average increase of 0.15 points per year.",
  },
  {
    icon: Sparkles,
    title: "Genre Dominance",
    text: "Drama is the most represented genre at 32% of the dataset, followed by Action at 21%. Comedy and Thriller combined make up 30%.",
  },
  {
    icon: AlertTriangle,
    title: "Outlier Detection",
    text: "3 entries with ratings below 2.0 were identified as potential outliers. These are concentrated in low-budget productions from 2016.",
  },
  {
    icon: CheckCircle2,
    title: "Data Quality",
    text: "Dataset is 99.88% complete. Only 23 missing values detected across 2 columns (runtime, rating). No duplicate rows found.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="section-container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Analysis <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Netflix Movies Dataset — 1,647 records</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
        >
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

        {/* Charts grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Bar chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Movies by Genre</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis dataKey="genre" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Line chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Average Rating Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174,72%,52%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(174,72%,52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis dataKey="year" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <YAxis domain={[5.5, 8]} tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                <Area type="monotone" dataKey="rating" stroke="hsl(174,72%,52%)" fill="url(#ratingGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Genre Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Scatter plot */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Runtime vs Rating</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
                <XAxis dataKey="x" name="Runtime" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <YAxis dataKey="y" name="Rating" domain={[3, 10]} tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                <Scatter data={scatterData} fill="hsl(262,60%,58%)" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
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
              Based on the dataset structure (labeled categorical + numerical features), the following models are recommended:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { model: "Random Forest", reason: "Best for mixed feature types with categorical targets" },
                { model: "Logistic Regression", reason: "Genre classification with high interpretability" },
                { model: "K-Means Clustering", reason: "Discover hidden groupings in unlabeled data" },
              ].map((m) => (
                <div key={m.model} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="mb-1 font-mono text-sm font-semibold text-foreground">{m.model}</p>
                  <p className="text-xs leading-relaxed">{m.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
