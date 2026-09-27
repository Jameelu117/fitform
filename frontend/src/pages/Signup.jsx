// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScanLine, User, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const { signup, loading } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    try {
      await signup(form.name, form.email, form.password);
      toast.push("Account created — welcome to FitForm AI!");
      nav("/dashboard");
    } catch (err) { setError(err.message); }
  };

  const Field = ({ icon: Icon, ...props }) => (
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input className="input pl-11" required {...props} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="glass w-full max-w-md p-8 relative z-10">
        <div className="flex items-center gap-2 justify-center mb-8">
          <ScanLine className="text-cyan-400" size={26} />
          <span className="font-bold text-lg">FITFORM <span className="text-gradient">AI</span></span>
        </div>
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        {error && <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</div>}
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field icon={User} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Field icon={Mail} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Field icon={Lock} type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <Field icon={Lock} type="password" placeholder="Confirm password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
          <button className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Create account"}
          </button>
        </form>
        <p className="text-sm text-slate-400 text-center mt-6">
          Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}