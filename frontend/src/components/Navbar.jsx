// src/components/Navbar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, Dumbbell, TrendingUp, History, User, Settings, LogOut, ScanLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/history", icon: History, label: "History" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass !rounded-none border-x-0 border-t-0 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => nav("/dashboard")}>
          <ScanLine className="text-cyan-400" size={24} />
          <span className="font-bold tracking-wide">FITFORM <span className="text-gradient">AI</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${isActive ? "bg-cyan-400/10 text-cyan-300" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-400">{user?.name}</span>
          <button onClick={() => { logout(); nav("/"); }}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition" title="Log out">
            <LogOut size={18} />
          </button>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            <Activity size={20} className="text-cyan-400" />
          </button>
        </div>
      </header>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass m-3 p-2 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl flex items-center gap-3 ${isActive ? "bg-cyan-400/10 text-cyan-300" : "text-slate-300"}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}