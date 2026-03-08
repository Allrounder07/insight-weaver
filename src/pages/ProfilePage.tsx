import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Mail, Shield, Calendar, Palette,
  Sparkles, BarChart3, BrainCircuit, FlaskConical, LineChart,
  PieChart, ScatterChart, TrendingUp, Binary, Sigma, Atom,
  Network,
} from "lucide-react";

const AVATAR_ICONS = [
  { icon: BrainCircuit, label: "ML", color: "174 72% 52%" },
  { icon: FlaskConical, label: "Research", color: "262 60% 58%" },
  { icon: BarChart3, label: "Analytics", color: "38 92% 60%" },
  { icon: LineChart, label: "Trends", color: "200 80% 55%" },
  { icon: PieChart, label: "Stats", color: "340 65% 58%" },
  { icon: ScatterChart, label: "Scatter", color: "174 72% 42%" },
  { icon: TrendingUp, label: "Forecast", color: "262 60% 68%" },
  { icon: Binary, label: "Binary", color: "38 92% 50%" },
  { icon: Sigma, label: "Sigma", color: "200 80% 45%" },
  { icon: Network, label: "Neural Net", color: "340 65% 68%" },
  { icon: Atom, label: "Science", color: "174 72% 62%" },
  { icon: Sparkles, label: "AI", color: "262 60% 48%" },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const saved = localStorage.getItem("datalens-avatar");
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatar(index);
    localStorage.setItem("datalens-avatar", String(index));
  };
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );

  const userEmail = user?.email || "";
  const provider = user?.app_metadata?.provider || "email";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  const SelectedIcon = AVATAR_ICONS[selectedAvatar].icon;
  const selectedColor = AVATAR_ICONS[selectedAvatar].color;

  const stats = useMemo(() => [
    { label: "Provider", value: provider.charAt(0).toUpperCase() + provider.slice(1) },
    { label: "Joined", value: createdAt },
    { label: "Status", value: "Active" },
  ], [provider, createdAt]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="section-container max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glow-border relative overflow-hidden p-8 md:p-12"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(${selectedColor}) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(262 60% 58%) 0%, transparent 50%)`,
          }} />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(hsl(174,72%,52%) 1px, transparent 1px), linear-gradient(90deg, hsl(174,72%,52%) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />

          <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div
                className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 transition-all duration-500"
                style={{
                  borderColor: `hsl(${selectedColor})`,
                  background: `linear-gradient(135deg, hsl(${selectedColor} / 0.15), hsl(${selectedColor} / 0.05))`,
                  boxShadow: `0 0 60px -15px hsl(${selectedColor} / 0.4)`,
                }}
              >
                <SelectedIcon className="h-14 w-14" style={{ color: `hsl(${selectedColor})` }} />
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background"
                style={{ background: `hsl(${selectedColor})` }}
              >
                <Palette className="h-3.5 w-3.5 text-background" />
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">
                {displayName || userEmail.split("@")[0]}
              </h1>
              <p className="mt-1 flex items-center justify-center gap-2 text-muted-foreground md:justify-start">
                <Mail className="h-4 w-4" />
                {userEmail}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">{s.label}: </span>
                    <span className="text-xs font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avatar Picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card mt-6 p-6 md:p-8"
        >
          <h2 className="mb-1 text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Choose Your Tech Avatar
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Select an icon that represents you
          </p>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-12">
            {AVATAR_ICONS.map((a, i) => {
              const isSelected = selectedAvatar === i;
              return (
                <motion.button
                  key={a.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAvatarSelect(i)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  style={isSelected ? { boxShadow: `0 0 30px -8px hsl(${a.color} / 0.5)` } : {}}
                >
                  <a.icon
                    className="h-6 w-6 transition-colors"
                    style={{ color: isSelected ? `hsl(${a.color})` : "hsl(var(--muted-foreground))" }}
                  />
                  <span className={`text-[10px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {a.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card mt-6 p-6 md:p-8"
        >
          <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Details
          </h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="max-w-md"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <Input value={userEmail} disabled className="max-w-md opacity-60" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Account Created
              </label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {createdAt}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
