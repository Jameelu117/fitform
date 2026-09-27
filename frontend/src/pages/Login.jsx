// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScanLine, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login, loading } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      toast.push("Welcome back!");
      nav("/dashboard");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/3 w-[500px] h-[400px] bg-violet-500/10 blur-[120px] rounded-full" />
      <div className="glass w-full max-w-md p-8 relative z-10">
        <div className="flex items-center gap-2 justify-center mb-8">
          <ScanLine className="text-cyan-400" size={26} />
          <span className="font-bold text-lg">FITFORM <span className="text-gradient">AI</span></span>
        </div>
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        <p className="text-sm text-slate-400 text-center mt-1">Log in to continue training</p>

        {error && <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</div>}

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-11" type="email" placeholder="Email" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-11" type="password" placeholder="Password" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="text-right">
            <button type="button" className="text-xs text-cyan-400 hover:underline"
              onClick={() => toast.push("Password reset is not enabled in this deployment.", "warning")}>
              Forgot password?
            </button>
          </div>
          <button className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Log in"}
          </button>
        </form>
        <p className="text-sm text-slate-400 text-center mt-6">
          No account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}