// src/pages/History.jsx
import { useEffect, useState } from "react";
import { workoutApi } from "../services/api";
import { Calendar, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CardSkeleton } from "../components/Skeleton";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function History() {
  const [items, setItems] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { workoutApi.history().then(setItems).catch(e => setError(e.message)); }, []);

  const open = async (id) => {
    try { setDetail(await workoutApi.detail(id)); } catch (e) { setError(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">Workout <span className="text-gradient">History</span></h1>
      {error && <div className="mt-4 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">{error}</div>}

      <div className="mt-8 flex flex-col gap-3">
        {!items ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          : items.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500">
              <Calendar size={36} className="mx-auto mb-3 opacity-50" />
              No workouts recorded yet.
            </div>
          ) : items.map(w => (
            <button key={w.id} onClick={() => open(w.id)}
              className="glass p-5 flex flex-wrap items-center justify-between gap-4 text-left hover:border-cyan-400/25 transition-colors">
              <div>
                <div className="font-semibold">{w.exercise_name}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(w.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-400">{fmt(w.duration)}</span>
                <span className="text-slate-300">{w.reps} reps</span>
                <span className={`font-bold ${w.form_score >= 85 ? "text-emerald-400" : w.form_score >= 70 ? "text-amber-400" : "text-red-400"}`}>
                  {Math.round(w.form_score)}%
                </span>
              </div>
            </button>
          ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDetail(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="glass w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">{detail.exercise_name}</h2>
                <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-white/10"><X size={18} /></button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[["Duration", fmt(detail.duration)], ["Reps", detail.reps], ["Form", `${Math.round(detail.form_score)}%`]].map(([k, v]) => (
                  <div key={k} className="glass py-3"><div className="font-bold text-cyan-300">{v}</div><div className="text-xs text-slate-500">{k}</div></div>
                ))}
              </div>
              <h3 className="mt-5 font-semibold text-sm">Feedback</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(detail.feedback.length ? detail.feedback : [{ text: "No feedback recorded.", type: "info" }]).map((f, i) => (
                  <li key={i} className={`text-sm ${f.type === "good" ? "text-emerald-300" : f.type === "warning" ? "text-amber-300" : "text-slate-400"}`}>
                    {f.type === "good" ? "✓" : f.type === "warning" ? "⚠" : "•"} {f.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}