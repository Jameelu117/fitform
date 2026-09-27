// src/components/StatCard.jsx
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, suffix, accent = "text-cyan-400", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass p-5 hover:border-cyan-400/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon size={20} className={accent} />
      </div>
      <div className="mt-2 text-3xl font-bold">
        {value}<span className="text-base font-medium text-slate-400 ml-1">{suffix}</span>
      </div>
    </motion.div>
  );
}