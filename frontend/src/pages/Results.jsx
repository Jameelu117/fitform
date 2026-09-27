// src/pages/Results.jsx
import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Clock, Repeat, Gauge, Save, TrendingUp, RotateCcw, Loader2 } from "lucide-react";
import { workoutApi } from "../services/api";
import { useToast } from "../context/ToastContext";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Results() {
  const { state } = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state) return <Navigate to="/dashboard" replace />;
  const { exercise_id, exercise_name, duration, reps, form_score, feedback, demo } = state;

  const save = async () => {
    setSaving(true);
    try {
      await workoutApi.save({ exercise_id, duration, reps, form_score, feedback });
      setSaved(true);
      toast.push("Workout saved!");
    } catch (err) { toast.push(err.message, "error"); }
    finally { setSaving(false); }
  };

  const scoreColor = form_score >= 85 ? "text-emerald-400" : form_score >= 70 ? "text-amber-400" : "text-red-400";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-cyan-400/30 flex items-center justify-center">
          <Trophy size={36} className="text-cyan-300" />
        </motion.div>
        <h1 className="mt-5 text-3xl font-extrabold">WORKOUT <span className="text-gradient">COMPLETE</span></h1>
        {demo && <p className="mt-2 text-xs text-violet-300">Recorded from DEMO MODE</p>}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: RotateCcw, label: "Exercise", value: exercise_name, small: true },
            { icon: Repeat, label: "Reps", value: reps },
            { icon: Clock, label: "Duration", value: fmt(duration) },
            { icon: Gauge, label: "Form", value: `${Math.round(form_score)}%`, color: scoreColor },
          ].map(({ icon: Icon, label, value, color, small }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
              className="glass p-4">
              <Icon size={18} className="mx-auto text-slate-500" />
              <div className={`mt-2 font-bold ${small ? "text-base" : "text-2xl"} ${color || ""}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Score ring */}
        <div className="mt-8 flex justify-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle cx="65" cy="65" r="55" fill="none" stroke="url(#ring)" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 55}
              initial={{ strokeDashoffset: 2 * Math.PI * 55 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 55 * (1 - form_score / 100) }}
              transition={{ duration: 1.2, delay: 0.4 }} transform="rotate(-90 65 65)" />
            <defs>
              <linearGradient id="ring"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
            </defs>
            <text x="65" y="72" textAnchor="middle" className="fill-slate-100" fontSize="24" fontWeight="800">
              {Math.round(form_score)}%
            </text>
          </svg>
        </div>

        <div className="mt-6 text-left glass p-5">
          <h3 className="font-semibold mb-3">Session feedback</h3>
          <ul className="flex flex-col gap-2">
            {(feedback?.length ? feedback : [{ text: "Good effort — keep it up!", type: "good" }]).map((f, i) => (
              <li key={i} className={`text-sm ${f.type === "good" ? "text-emerald-300" : f.type === "warning" ? "text-amber-300" : "text-slate-300"}`}>
                {f.type === "good" ? "✓" : f.type === "warning" ? "⚠" : "•"} {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button className="btn-primary flex-1 py-3" onClick={save} disabled={saving || saved}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {saved ? "Saved ✓" : "Save Workout"}
          </button>
          <button className="btn-ghost flex-1 py-3" onClick={() => nav("/progress")}><TrendingUp size={17} /> View Progress</button>
          <button className="btn-ghost flex-1 py-3" onClick={() => nav(`/ai-workout/${exercise_id}`)}><RotateCcw size={17} /> Workout Again</button>
        </div>
      </motion.div>
    </div>
  );
}