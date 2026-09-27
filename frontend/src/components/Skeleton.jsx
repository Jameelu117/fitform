// src/components/Skeleton.jsx
export const CardSkeleton = () => (
  <div className="glass p-5 animate-pulse">
    <div className="h-32 rounded-xl bg-white/5 mb-4" />
    <div className="h-4 w-2/3 bg-white/5 rounded mb-2" />
    <div className="h-3 w-1/2 bg-white/5 rounded" />
  </div>
);
export const StatSkeleton = () => <div className="glass p-5 h-24 animate-pulse" />;