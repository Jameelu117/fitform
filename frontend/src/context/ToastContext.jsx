// ToastContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
const icons = { success: CheckCircle2, warning: AlertTriangle, error: XCircle };
const colors = { success: "text-emerald-400 border-emerald-400/30", warning: "text-amber-400 border-amber-400/30", error: "text-red-400 border-red-400/30" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`glass px-4 py-3 flex items-center gap-3 text-sm ${colors[t.type]}`}>
                <Icon size={18} /><span className="text-slate-200">{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}