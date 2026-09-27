// src/pages/AIWorkout.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Pause, Play, Square, Loader2, FlaskConical, AlertTriangle } from "lucide-react";
import { aiApi, exerciseApi } from "../services/api";
import { useToast } from "../context/ToastContext";

const FRAME_INTERVAL_MS = 220;      // ~4.5 fps analysis — good balance for free-tier hosting
const JPEG_QUALITY = 0.55;

// MediaPipe pose skeleton edges for the overlay
const EDGES = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],
               [23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];

export default function AIWorkout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const demo = params.get("demo") === "1";
  const nav = useNavigate();
  const toast = useToast();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const sessionRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const pausedRef = useRef(false);

  const [exercise, setExercise] = useState(null);
  const [phase, setPhase] = useState("init");   // init | ready | error
  const [cameraError, setCameraError] = useState("");
  const [paused, setPaused] = useState(false);
  const [ending, setEnding] = useState(false);
  const [analysis, setAnalysis] = useState({
    rep_count: 0, form_score: 100, status: "no_pose", state: "STANDING",
    feedback: ["Initializing..."], pose_detected: false,
  });

  // ---------- Camera ----------
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access is required for AI form analysis. Please allow camera access and try again."
          : err.name === "NotFoundError"
          ? "No camera was found on this device. Try Demo Mode instead."
          : "Camera unavailable. It may be in use by another application.");
    }
  }, []);

  useEffect(() => {
    exerciseApi.get(id).then(setExercise).catch(() => {});
    if (!demo) startCamera(); else setPhase("ready");
    return () => {
      clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [id, demo, startCamera]);

  // ---------- Frame capture + backend analysis ----------
  const captureAndAnalyze = useCallback(async () => {
    if (pausedRef.current || !sessionRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    try {
      const result = await aiApi.analyzeFrame({
        session_id: sessionRef.current,
        exercise: exercise.image,
        image_base64: image,
      });
      setAnalysis(result);
      drawOverlay(result.landmarks);
    } catch { /* transient network error — keep previous state */ }
  }, [exercise]);

  const drawOverlay = (landmarks) => {
    const overlay = overlayRef.current, video = videoRef.current;
    if (!overlay || !video) return;
    const ctx = overlay.getContext("2d");
    overlay.width = video.videoWidth || 640;
    overlay.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!landmarks) return;
    const px = (lm) => [lm.x * overlay.width, lm.y * overlay.height];
    ctx.strokeStyle = "rgba(139,92,246,0.9)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    EDGES.forEach(([a, b]) => {
      const [x1, y1] = px(landmarks[a]); const [x2, y2] = px(landmarks[b]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.fillStyle = "#22d3ee";
    landmarks.forEach(lm => {
      if (lm.visibility > 0.5) {
        const [x, y] = px(lm);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    });
  };

  // ---------- Demo mode simulation ----------
  const runDemoTick = useCallback(() => {
    if (pausedRef.current) return;
    setAnalysis(prev => {
      const states = ["STANDING", "DESCENDING", "BOTTOM", "ASCENDING"];
      const nextState = states[(states.indexOf(prev.state) + 1) % 4];
      const rep = nextState === "STANDING" && prev.state === "ASCENDING" ? prev.rep_count + 1 : prev.rep_count;
      const msgs = {
        STANDING: ["Stand in frame to begin"], DESCENDING: ["✓ Good alignment"],
        BOTTOM: ["⚠ Try slightly greater depth"], ASCENDING: ["✓ Good posture"],
      };
      return {
        ...prev, state: nextState, rep_count: rep, pose_detected: true,
        form_score: Math.max(78, 100 - Math.floor(rep * 1.5)),
        status: nextState === "BOTTOM" ? "warning" : "good",
        feedback: msgs[nextState],
      };
    });
  }, []);

  // ---------- Start session + analysis loop ----------
  useEffect(() => {
    if (phase !== "ready" || !exercise) return;
    startTimeRef.current = Date.now();
    if (demo) {
      intervalRef.current = setInterval(runDemoTick, 900);
    } else {
      aiApi.start("squat")
        .then(s => {
          sessionRef.current = s.session_id;
          intervalRef.current = setInterval(captureAndAnalyze, FRAME_INTERVAL_MS);
        })
        .catch(err => {
          setPhase("error");
          setCameraError(`AI service unavailable: ${err.message} Try Demo Mode instead.`);
        });
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, exercise, demo, captureAndAnalyze, runDemoTick]);

  // ---------- Controls ----------
  const togglePause = () => { pausedRef.current = !paused; setPaused(!paused); };

  const endWorkout = async () => {
    setEnding(true);
    clearInterval(intervalRef.current);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    let final = { rep_count: analysis.rep_count, form_score: analysis.form_score,
                  feedback: [{ text: "Good consistency", type: "good" }] };
    if (!demo && sessionRef.current) {
      try { final = await aiApi.end(sessionRef.current); } catch { /* use local state */ }
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    nav("/results", {
      state: {
        exercise_id: exercise.id, exercise_name: exercise.name,
        duration, reps: final.rep_count,
        form_score: final.form_score, feedback: final.feedback, demo,
      },
    });
  };

  const statusColor = { good: "text-emerald-400", warning: "text-amber-400", error: "text-red-400", no_pose: "text-slate-400", no_pose_yet: "text-slate-400" };
  const statusLabel = { good: "GOOD", warning: "ADJUST", error: "ERROR", no_pose: "NO POSE", no_pose_yet: "READY" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {demo && (
        <div className="mb-4 glass px-4 py-2.5 flex items-center gap-2 text-sm text-violet-300 border-violet-400/30">
          <FlaskConical size={16} /> DEMO MODE — pose, reps and feedback are simulated. No camera or AI is active.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ---------- Camera ---------- */}
        <div className="lg:col-span-2">
          <div className="glass overflow-hidden relative aspect-[4/3] bg-black/40">
            {phase === "error" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <CameraOff size={44} className="text-red-400" />
                <p className="text-slate-300 max-w-md">{cameraError}</p>
                <div className="flex gap-3">
                  <button className="btn-ghost" onClick={startCamera}>Retry camera</button>
                  <button className="btn-primary" onClick={() => nav(`/ai-workout/${id}?demo=1`)}>Use Demo Mode</button>
                </div>
              </div>
            ) : demo ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simulated skeleton */}
                <motion.svg viewBox="0 0 200 220" className="h-full"
                  animate={{ y: analysis.state === "BOTTOM" ? 26 : analysis.state === "DESCENDING" ? 13 : 0 }}
                  transition={{ duration: 0.5 }}>
                  {[[100,30],[100,70],[70,85],[130,85],[100,120],[80,160],[120,160],[75,200],[125,200]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="5" fill="#22d3ee" />
                  ))}
                  {[[0,1],[1,2],[1,3],[1,4],[4,5],[4,6],[5,7],[6,8]].map(([a,b],i) => {
                    const pts = [[100,30],[100,70],[70,85],[130,85],[100,120],[80,160],[120,160],[75,200],[125,200]];
                    return <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
                      stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />;
                  })}
                </motion.svg>
              </div>
            ) : (
              <>
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none" />
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {phase === "init" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="animate-spin text-cyan-400" size={36} />
              </div>
            )}
            {paused && phase === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <span className="text-2xl font-bold text-slate-300">PAUSED</span>
              </div>
            )}

            {/* Status pill */}
            <div className={`absolute top-4 left-4 glass px-3 py-1.5 text-xs font-bold tracking-wider ${statusColor[analysis.status]}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
              {statusLabel[analysis.status]}
            </div>
            <div className="absolute top-4 right-4 glass px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5">
              <Camera size={13} /> Frames analyzed live — never recorded
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3">
            <button className="btn-ghost flex-1" onClick={togglePause} disabled={phase !== "ready"}>
              {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? "Resume" : "Pause"}
            </button>
            <button className="btn-primary flex-1 !bg-none !bg-red-500/90 !text-white hover:!brightness-110"
              onClick={endWorkout} disabled={ending || phase === "init"}>
              {ending ? <Loader2 className="animate-spin" size={16} /> : <Square size={16} />} End Workout
            </button>
          </div>
        </div>

        {/* ---------- Live analysis panel ---------- */}
        <div className="flex flex-col gap-4">
          <div className="glass p-5">
            <div className="text-sm text-slate-400">Exercise</div>
            <div className="text-xl font-bold">{exercise?.name || "..."}</div>
          </div>

          <div className="glass p-5 text-center">
            <div className="text-sm text-slate-400 mb-1">Repetitions</div>
            <motion.div key={analysis.rep_count} initial={{ scale: 1.25 }} animate={{ scale: 1 }}
              className="text-6xl font-extrabold text-gradient">
              {String(analysis.rep_count).padStart(2, "0")}
              <span className="text-2xl text-slate-500 font-semibold"> / {exercise?.recommended_reps ?? 12}</span>
            </motion.div>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                animate={{ width: `${Math.min(100, (analysis.rep_count / (exercise?.recommended_reps || 12)) * 100)}%` }} />
            </div>
          </div>

          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Form score</span>
              <span className={`text-2xl font-bold ${analysis.form_score >= 85 ? "text-emerald-400" : analysis.form_score >= 70 ? "text-amber-400" : "text-red-400"}`}>
                {analysis.form_score}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div className={`h-full ${analysis.form_score >= 85 ? "bg-emerald-400" : analysis.form_score >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                animate={{ width: `${analysis.form_score}%` }} />
            </div>
            <div className="mt-3 text-sm text-slate-400">
              Movement state: <span className="text-cyan-300 font-semibold">{analysis.state}</span>
            </div>
          </div>

          <div className="glass p-5 flex-1">
            <div className="text-sm text-slate-400 mb-3">Live feedback</div>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {analysis.feedback.map((f, i) => (
                  <motion.div key={f + i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className={`text-sm px-3 py-2 rounded-lg ${f.startsWith("✓") ? "bg-emerald-400/10 text-emerald-300" : f.startsWith("⚠") ? "bg-amber-400/10 text-amber-300" : "bg-white/5 text-slate-300"}`}>
                    {f}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass p-4 flex items-start gap-2.5 text-xs text-slate-500">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Form feedback is general exercise guidance, not medical advice or injury prevention.
          </div>
        </div>
      </div>
    </div>
  );
}