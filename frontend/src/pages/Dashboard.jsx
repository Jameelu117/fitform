// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Flame, Clock, Repeat, ScanLine, TrendingUp, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { progressApi, workoutApi, exerciseApi } from "../services/api";
import StatCard from "../components/StatCard";
import { StatSkeleton, CardSkeleton } from "../components/Skeleton";

const fmtDur = (s) => s >= 3600 ? `${(s / 3600).toFixed(1)}h` : `${Math.round(s / 60)}m`;

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState(null);
  const [exercises, setExercises] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([progressApi.get(), workoutApi.history(), exerciseApi.list()])
      .then(([p, h, e]) => { setProgress(p); setHistory(h.slice(0, 4)); setExercises(e); })
      .catch(err => setError(err.message));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const recommended = exercises?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">{greeting}, <span className="text-gradient">{user?.name}</span></h1>
      <p className="text-slate-400 mt-1">Here's your training overview.</p>
      {error && <div className="mt-4 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">{error}</div>}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!progress ? <>{[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}</> : <>
          <StatCard icon={Dumbbell} label="Workouts completed" value={progress.total_workouts} delay={0} />
          <StatCard icon={Flame} label="Current streak" value={progress.current_streak} suffix="days" accent="text-amber-400" delay={0.05} />
          <StatCard icon={Clock} label="Total time" value={fmtDur(progress.total_duration)} accent="text-violet-400" delay={0.1} />
          <StatCard icon={Repeat} label="Total reps" value={progress.total_reps} accent="text-emerald-400" delay={0.15} />
        </>}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="glass p-6 lg:col-span-2">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp size={18} className="text-cyan-400" /> Weekly activity</h2>
          <div className="h-56 mt-4">
            {progress && (
              <ResponsiveContainer>
                <AreaChart data={progress.weekly}>
                  <defs>
                    <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0b101f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="reps" stroke="#22d3ee" strokeWidth={2.5} fill="url(#repGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick actions + recommended */}
        <div className="flex flex-col gap-4">
          <div className="glass p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Quick actions</h2>
            <button className="btn-primary" onClick={() => nav("/workouts")}><ScanLine size={16} /> Start AI Workout</button>
            <button className="btn-ghost" onClick={() => nav("/workouts")}><Dumbbell size={16} /> Browse Workouts</button>
            <button className="btn-ghost" onClick={() => nav("/progress")}><TrendingUp size={16} /> View Progress</button>
          </div>
          {recommended && (
            <div className="glass p-5 bg-gradient-to-br from-violet-500/10 to-transparent">
              <div className="flex items-center gap-2 text-violet-300 text-sm font-semibold"><Sparkles size={15} /> Recommended</div>
              <h3 className="mt-2 font-bold text-lg">{recommended.name}</h3>
              <p className="text-sm text-slate-400">{recommended.target_muscles}</p>
              <button className="btn-primary w-full mt-4" onClick={() => nav(`/workouts/${recommended.id}`)}>Start</button>
            </div>
          )}
        </div>
      </div>

      {/* Recent workouts */}
      <div className="mt-6 glass p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent workouts</h2>
          <button className="text-sm text-cyan-400 hover:underline" onClick={() => nav("/history")}>View all</button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {!history ? <CardSkeleton /> : history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Dumbbell size={32} className="mx-auto mb-3 opacity-50" />
              No workouts yet. Start your first AI workout!
            </div>
          ) : history.map(w => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition cursor-pointer"
              onClick={() => nav("/history")}>
              <div>
                <div className="font-medium">{w.exercise_name}</div>
                <div className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString()} · {fmtDur(w.duration)}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-300">{w.reps} reps</span>
                <span className={`font-bold ${w.form_score >= 85 ? "text-emerald-400" : w.form_score >= 70 ? "text-amber-400" : "text-red-400"}`}>
                  {Math.round(w.form_score)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}