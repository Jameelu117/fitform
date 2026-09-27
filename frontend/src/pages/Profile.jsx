// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { profileApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { User, Loader2, Dumbbell, Repeat, Flame, Gauge } from "lucide-react";
import { CardSkeleton } from "../components/Skeleton";

const GOALS = ["General fitness", "Build strength", "Lose weight", "Improve endurance", "Flexibility"];
const TYPES = ["Strength", "Cardio", "HIIT", "Mixed"];

export default function Profile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", fitness_goal: GOALS[0], preferred_workout: TYPES[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.get().then(p => {
      setProfile(p);
      setForm({ name: p.name, fitness_goal: p.fitness_goal, preferred_workout: p.preferred_workout });
    }).catch(e => toast.push(e.message, "error"));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileApi.update(form);
      setProfile(updated);
      toast.push("Profile updated!");
    } catch (err) { toast.push(err.message, "error"); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="max-w-3xl mx-auto px-6 py-8"><CardSkeleton /></div>;

  const stats = [
    { icon: Dumbbell, label: "Total workouts", value: profile.total_workouts },
    { icon: Repeat, label: "Total reps", value: profile.total_reps },
    { icon: Flame, label: "Current streak", value: `${profile.current_streak} days` },
    { icon: Gauge, label: "Avg form score", value: `${profile.avg_form_score}%` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="mt-6 glass p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-cyan-400/30 flex items-center justify-center">
          <User size={28} className="text-cyan-300" />
        </div>
        <div>
          <div className="font-bold text-xl">{profile.name}</div>
          <div className="text-sm text-slate-400">{profile.email}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass p-4 text-center">
            <Icon size={18} className="mx-auto text-cyan-400" />
            <div className="mt-2 font-bold text-lg">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="mt-6 glass p-6 flex flex-col gap-4">
        <h2 className="font-semibold">Edit profile</h2>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Name</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Fitness goal</label>
            <select className="input" value={form.fitness_goal} onChange={e => setForm({ ...form, fitness_goal: e.target.value })}>
              {GOALS.map(g => <option key={g} className="bg-panel">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Preferred workout</label>
            <select className="input" value={form.preferred_workout} onChange={e => setForm({ ...form, preferred_workout: e.target.value })}>
              {TYPES.map(t => <option key={t} className="bg-panel">{t}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary self-start" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : "Save changes"}
        </button>
      </form>
    </div>
  );
}