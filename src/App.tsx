import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const GlobePage = lazy(() => import('./pages/GlobePage'));
const OpsConsole = lazy(() => import('./pages/OpsConsole'));

function Booting() {
  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-void">
      <span className="hud-label animate-blink">// ESTABLISHING UPLINK…</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Booting />}>
      <Routes>
        <Route path="/" element={<GlobePage />} />
        <Route path="/ops-console" element={<OpsConsole />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
