import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CyberTransitionProvider } from './context/CyberTransitionContext';

const GlobePage = lazy(() => import('./pages/GlobePage'));
const OpsConsole = lazy(() => import('./pages/OpsConsole'));

function Booting() {
  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-black">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-zinc-950/80 px-5 py-3 backdrop-blur-2xl shadow-[0_0_24px_rgba(255,255,255,0.1)]">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-white font-mono uppercase">
          GLOBAL RESISTANCE NETWORK — CONNECTING TO NODE…
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CyberTransitionProvider>
      <Suspense fallback={<Booting />}>
        <Routes>
          <Route path="/" element={<GlobePage />} />
          <Route path="/admin" element={<OpsConsole />} />
          <Route path="/ops-console" element={<OpsConsole />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </CyberTransitionProvider>
  );
}
