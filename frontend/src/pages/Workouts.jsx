// src/pages/Workouts.jsx
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { exerciseApi } from "../services/api";
import WorkoutCard from "../components/WorkoutCard";
import { CardSkeleton } from "../components/Skeleton";

const categories = ["all", "lower body", "upper body", "cardio"];

export default function Workouts() {
  const [exercises, setExercises] = useState(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    exerciseApi.list().then(setExercises).catch(e => setError(e.message));
  }, []);

  const filtered = useMemo(() => (exercises || []).filter(e =>
    (cat === "all" || e.category === cat) &&
    e.name.toLowerCase().includes(query.toLowerCase())), [exercises, query, cat]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">Workout <span className="text-gradient">Library</span></h1>
      <p className="text-slate-400 mt-1">Choose an exercise to begin AI-guided training.</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-11 pr-4" placeholder="Search exercises..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm capitalize transition ${cat === c ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30" : "glass text-slate-400 hover:text-slate-200"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-6 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">{error}</div>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!exercises
          ? [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
          : filtered.length === 0
            ? <div className="col-span-full text-center text-slate-500 py-16">No exercises match your search.</div>
            : filtered.map((e, i) => <WorkoutCard key={e.id} exercise={e} index={i} />)}
      </div>
    </div>
  );
}