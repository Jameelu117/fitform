// src/pages/Landing.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ScanLine, Camera, Brain, Repeat, BarChart3, Dumbbell,
  ArrowRight, CheckCircle2, Footprints, Flame, Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const steps = ["Choose an exercise", "Enable camera", "AI detects body landmarks", "Movement is analyzed",
  "Repetitions are counted", "Form feedback is displayed", "Results are saved"];

const features = [
  { icon: Brain, title: "AI Form Analysis", desc: "Pose estimation analyzes joint angles in real time and gives general exercise-form guidance.", color: "text-cyan-300", bg: "bg-cyan-400/10", ring: "hover:border-cyan-400/25" },
  { icon: Repeat, title: "Automatic Rep Counting", desc: "A movement state machine counts reps accurately — no manual logging.", color: "text-violet-300", bg: "bg-violet-400/10", ring: "hover:border-violet-400/25" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Streaks, form scores, and volume trends visualized beautifully.", color: "text-emerald-300", bg: "bg-emerald-400/10", ring: "hover:border-emerald-400/25" },
];

const exercises = [
  { name: "Squats", icon: Dumbbell },
  { name: "Push-ups", icon: Flame },
  { name: "Lunges", icon: Footprints },
  { name: "Bicep Curls", icon: Dumbbell },
  { name: "Jumping Jacks", icon: Zap },
];

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-96 -right-40 w-[500px] h-[500px] bg-violet-500/10 blur-[120px] rounded-full" />

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="text-cyan-400" size={26} />
          <span className="font-bold text-lg tracking-wide">FITFORM <span className="text-gradient">AI</span></span>
        </div>
        <div className="flex gap-3">
          {user
            ? <button className="btn-primary" onClick={() => nav("/dashboard")}>Dashboard</button>
            : <>
                <button className="btn-ghost" onClick={() => nav("/login")}>Log in</button>
                <button className="btn-primary" onClick={() => nav("/signup")}>Sign up</button>
              </>}
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl font-extrabold leading-tight">
            Move Better.<br /><span className="text-gradient">Train Smarter.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-5 text-lg text-slate-400 max-w-md">
            AI-powered workout tracking and exercise-form guidance — right from your camera.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-4">
            <button className="btn-primary text-base px-7 py-3" onClick={() => nav(user ? "/workouts" : "/signup")}>
              Start Training <ArrowRight size={18} />
            </button>
            <button className="btn-ghost text-base px-7 py-3" onClick={() => nav(user ? "/workouts" : "/login")}>
              Explore Workouts
            </button>
          </motion.div>
        </div>

        {/* Hero visual — pose concept */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          className="glass p-6 relative">
          <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> LIVE ANALYSIS
          </div>
          <svg viewBox="0 0 200 220" className="w-full max-w-xs mx-auto">
            {[[100,30],[100,70],[70,85],[130,85],[100,120],[80,160],[120,160],[75,200],[125,200]].map(([x,y],i) => (
              <motion.circle key={i} cx={x} cy={y} r="5" fill="#22d3ee"
                initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }} />
            ))}
            {[[0,1],[1,2],[1,3],[1,4],[4,5],[4,6],[5,7],[6,8]].map(([a,b],i) => {
              const pts = [[100,30],[100,70],[70,85],[130,85],[100,120],[80,160],[120,160],[75,200],[125,200]];
              return <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
                stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />;
            })}
          </svg>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[["Reps", "12"], ["Form", "94%"], ["State", "ASCENDING"]].map(([k, v]) => (
              <div key={k} className="glass !rounded-xl py-3">
                <div className="text-xs text-slate-400">{k}</div>
                <div className="font-bold text-cyan-300">{v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">How It <span className="text-gradient">Works</span></h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {steps.map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass p-5 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-300 flex items-center justify-center font-bold text-sm">{i + 1}</div>
              <p className="mt-3 text-sm text-slate-300">{s}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc, color, bg, ring }) => (
          <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className={`glass p-7 transition-colors ${ring}`}>
            <div className={`chip ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </section>

      {/* SUPPORTED EXERCISES */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Supported <span className="text-gradient">Exercises</span></h2>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {exercises.map(({ name, icon: Icon }) => (
            <div key={name} className="glass p-5 flex flex-col items-center gap-3">
              <div className="chip bg-violet-400/10">
                <Icon size={20} className="text-violet-300" />
              </div>
              <span className="text-sm font-medium text-slate-200">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="glass p-10 text-center bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
          <h2 className="text-3xl font-bold">Ready to train smarter?</h2>
          <p className="mt-3 text-slate-400">Camera frames are analyzed in real time and never recorded.</p>
          <button className="btn-primary mt-6 text-base px-8 py-3" onClick={() => nav("/signup")}>
            Create Free Account <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>FitForm AI — Move Better. Train Smarter.</p>
        <p className="mt-1 text-xs">Form feedback is general exercise guidance, not medical advice.</p>
      </footer>
    </div>
  );
}