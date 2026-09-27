// src/pages/Settings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Camera, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AnimatePresence, motion } from "framer-motion";

export default function Settings() {
  const { logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="mt-6 glass p-6">
        <h2 className="font-semibold flex items-center gap-2"><Camera size={18} className="text-cyan-400" /> Camera & Privacy</h2>
        <ul className="mt-3 text-sm text-slate-400 flex flex-col gap-2 leading-relaxed">
          <li>• Camera frames are analyzed in real time for exercise-form guidance.</li>
          <li>• Frames are processed in memory and <span className="text-slate-200 font-medium">never recorded or permanently stored</span>.</li>
          <li>• Only workout statistics (reps, duration, form score, feedback text) are saved to your account.</li>
          <li>• You can revoke camera permission at any time in your browser settings.</li>
        </ul>
      </div>

      <div className="mt-4 glass p-6">
        <h2 className="font-semibold flex items-center gap-2"><Shield size={18} className="text-violet-400" /> Disclaimer</h2>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          FitForm AI provides general exercise guidance only. It does not provide medical advice,
          diagnose conditions, or guarantee injury prevention. Consult a qualified professional
          before starting a new exercise program.
        </p>
      </div>

      <div className="mt-4 glass p-6 border-red-400/20">
        <h2 className="font-semibold flex items-center gap-2 text-red-400"><Trash2 size={18} /> Account</h2>
        <button className="btn-ghost mt-4 !border-red-400/30 !text-red-400 hover:!bg-red-400/10"
          onClick={() => setConfirmLogout(true)}>
          <LogOut size={16} /> Log out of FitForm AI
        </button>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="glass w-full max-w-sm p-6 text-center">
              <h3 className="font-bold text-lg">Log out?</h3>
              <p className="text-sm text-slate-400 mt-2">You'll need to log in again to access your dashboard.</p>
              <div className="mt-5 flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setConfirmLogout(false)}>Cancel</button>
                <button className="btn-primary flex-1 !bg-none !bg-red-500 !text-white"
                  onClick={() => { logout(); toast.push("Logged out."); nav("/"); }}>
                  Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}