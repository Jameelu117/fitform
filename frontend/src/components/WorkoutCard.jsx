// src/components/WorkoutCard.jsx
import { motion } from "framer-motion";
import { Clock, Flame, Play, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const diffColor = { Beginner: "text-emerald-400 bg-emerald-400/10", Intermediate: "text-amber-400 bg-amber-400/10", Advanced: "text-red-400 bg-red-400/10" };

export default function WorkoutCard({ exercise, index = 0 }) {
  const nav = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="glass p-5 flex flex-col gap-4 hover:border-violet-400/30 hover:-translate-y-1 transition-all cursor-pointer group"
      onClick={() => nav(`/workouts/${exercise.id}`)}>
      <div className="h-32 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 flex items-center justify-center">
        <Dumbbell size={44} className="text-cyan-300/70 group-hover:scale-110 transition-transform" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{exercise.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${diffColor[exercise.difficulty] || diffColor.Beginner}`}>
            {exercise.difficulty}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5"><Flame size={14} /> {exercise.target_muscles}</p>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5"><Clock size={14} /> ~{Math.ceil(exercise.recommended_reps * 3 / 60) + 3} min · {exercise.recommended_reps} reps</p>
      </div>
      <button className="btn-primary w-full" onClick={(e) => { e.stopPropagation(); nav(`/workouts/${exercise.id}`); }}>
        <Play size={16} /> Start
      </button>
    </motion.div>
  );
}