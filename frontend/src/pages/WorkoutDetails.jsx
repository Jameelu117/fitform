// src/pages/WorkoutDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Flame, Target, AlertTriangle, CheckCircle2, ListOrdered, Camera } from "lucide-react";
import { exerciseApi } from "../services/api";
import { CardSkeleton } from "../components/Skeleton";

const List = ({ text, icon: Icon, color }) =>
  (text || "").split("\n").filter(Boolean).map((line, i) => (
    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
      <Icon size={15} className={`mt-0.5 shrink-0 ${color}`} />{line.replace(/^\d+\.\s*/, "")}
    </li>
  ));

export default function WorkoutDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [ex, setEx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { exerciseApi.get(id).then(setEx).catch(e => setError(e.message)); }, [id]);

  if (error) return <div className="max-w-3xl mx-auto px-6 py-16 text-amber-400">{error}</div>;
  if (!ex) return <div className="max-w-3xl mx-auto px-6 py-8"><CardSkeleton /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <button className="btn-ghost mb-6" onClick={() => nav("/workouts")}><ArrowLeft size={16} /> Back</button>

      <div className="glass p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{ex.name}</h1>
            <p className="mt-2 text-slate-400 max-w-xl">{ex.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="glass px-3 py-1.5 text-xs flex items-center gap-1.5"><Target size={13} className="text-cyan-400" />{ex.target_muscles}</span>
              <span className="glass px-3 py-1.5 text-xs flex items-center gap-1.5"><Flame size={13} className="text-amber-400" />{ex.difficulty}</span>
              <span className="glass px-3 py-1.5 text-xs">{ex.recommended_reps} recommended reps</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="glass p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ListOrdered size={16} className="text-cyan-400" /> Instructions</h3>
            <ul className="flex flex-col gap-2"><List text={ex.instructions} icon={CheckCircle2} color="text-cyan-400" /></ul>
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Form tips</h3>
            <ul className="flex flex-col gap-2"><List text={ex.form_tips} icon={CheckCircle2} color="text-emerald-400" /></ul>
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" /> Common mistakes</h3>
            <ul className="flex flex-col gap-2"><List text={ex.common_mistakes} icon={AlertTriangle} color="text-amber-400" /></ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button className="btn-primary flex-1 py-3.5 text-base" onClick={() => nav(`/ai-workout/${ex.id}`)}>
            <ScanLine size={18} /> Start AI Analysis
          </button>
          <button className="btn-ghost flex-1 py-3.5 text-base" onClick={() => nav(`/ai-workout/${ex.id}?demo=1`)}>
            <Camera size={18} /> Try Demo Mode
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-500 text-center">
          AI form guidance is general exercise guidance — not medical advice. Camera frames are processed live and never recorded.
        </p>
      </div>
    </div>
  );
}