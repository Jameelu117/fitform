// App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import WorkoutDetails from "./pages/WorkoutDetails";
import AIWorkout from "./pages/AIWorkout";
import Results from "./pages/Results";
import Progress from "./pages/Progress";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
const Page = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const hideNav = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen">
      {!hideNav && user && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Landing /></Page>} />
          <Route path="/login" element={<Page><Login /></Page>} />
          <Route path="/signup" element={<Page><Signup /></Page>} />
          <Route path="/dashboard" element={<Protected><Page><Dashboard /></Page></Protected>} />
          <Route path="/workouts" element={<Protected><Page><Workouts /></Page></Protected>} />
          <Route path="/workouts/:id" element={<Protected><Page><WorkoutDetails /></Page></Protected>} />
          <Route path="/ai-workout/:id" element={<Protected><Page><AIWorkout /></Page></Protected>} />
          <Route path="/results" element={<Protected><Page><Results /></Page></Protected>} />
          <Route path="/progress" element={<Protected><Page><Progress /></Page></Protected>} />
          <Route path="/history" element={<Protected><Page><History /></Page></Protected>} />
          <Route path="/profile" element={<Protected><Page><Profile /></Page></Protected>} />
          <Route path="/settings" element={<Protected><Page><Settings /></Page></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

