// src/pages/Progress.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { progressApi } from "../services/api";
import StatCard from "../components/StatCard";
import { StatSkeleton } from "../components/Skeleton";
import { Dumbbell, Flame, Repeat, Gauge } from "lucide-react";

export default function Progress() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { progressApi.get().then(setData).catch(e => setError(e.message)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">Progress <span className="text-gradient">Dashboard</span></h1>
      {error && <div className="mt-4 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">{error}</div>}

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!data ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : <>
          <StatCard icon={Dumbbell} label="Total workouts" value={data.total_workouts} />
          <StatCard icon={Repeat} label="Total reps" value={data.total_reps} accent="text-emerald-400" delay={0.05} />
          <StatCard icon={Gauge} label="Avg form score" value={data.avg_form_score} suffix="%" accent="text-violet-400" delay={0.1} />
          <StatCard icon={Flame} label="Current streak" value={data.current_streak} suffix="days" accent="text-amber-400" delay={0.15} />
        </>}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Weekly reps */}
        <div className="glass p-6">
          <h2 className="font-semibold mb-4">Weekly reps</h2>
          <div className="h-64">
            {data && <ResponsiveContainer>
              <BarChart data={data.weekly}>
                <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0b101f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="reps" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Form score trend */}
        <div className="glass p-6">
          <h2 className="font-semibold mb-4">Form score trend</h2>
          <div className="h-64">
            {data && <ResponsiveContainer>
              <LineChart data={data.weekly}>
                <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0b101f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="form_score" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ fill: "#8b5cf6", r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>}
          </div>
        </div>
      </div>

      {/* ASCII-style form bars */}
      <div className="mt-6 glass p-6">
        <h2 className="font-semibold mb-4">Form Score by Day</h2>
        {data?.weekly.map(d => (
          <div key={d.day} className="flex items-center gap-4 py-1.5">
            <span className="w-10 text-sm text-slate-400 font-mono">{d.day}</span>
            <div className="flex-1 font-mono text-cyan-400 text-sm tracking-tighter">
              {"█".repeat(Math.round(d.form_score / 10)) || <span className="text-slate-700">—</span>}
            </div>
            <span className="w-12 text-right text-sm font-semibold text-slate-300">{d.form_score ? `${d.form_score}%` : "—"}</span>
          </div>
        ))}
      </div>

      {/* By exercise */}
      <div className="mt-6 glass p-6">
        <h2 className="font-semibold mb-4">Exercise performance</h2>
        {!data?.by_exercise.length
          ? <p className="text-slate-500 text-sm py-6 text-center">Complete workouts to see per-exercise performance.</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 text-left border-b border-white/5">
                  <th className="pb-3">Exercise</th><th className="pb-3">Workouts</th><th className="pb-3">Total reps</th><th className="pb-3">Avg form</th>
                </tr></thead>
                <tbody>
                  {data.by_exercise.map(e => (
                    <tr key={e.name} className="border-b border-white/5 last:border-0">
                      <td className="py-3 font-medium">{e.name}</td>
                      <td className="py-3 text-slate-400">{e.workouts}</td>
                      <td className="py-3 text-slate-400">{e.reps}</td>
                      <td className={`py-3 font-bold ${e.avg_form >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{e.avg_form}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </div>
    </div>
  );
}