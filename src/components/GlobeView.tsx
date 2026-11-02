import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import type { OsintEvent } from '../types';
import { getEventColor, getEventTags, hexToRgba } from '../utils/categories';
import { escapeHtml } from '../utils/format';

export interface GlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number) => void;
}

interface Props {
  events: OsintEvent[];
  selectedId?: string;
  onSelect: (e: OsintEvent) => void;
  autoRotate?: boolean;
  showAtmosphere?: boolean;
}

const GlobeView = forwardRef<GlobeHandle, Props>(function GlobeView({ events, selectedId, onSelect, autoRotate = true, showAtmosphere = true }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const isMobile = size.w < 768;

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, altitude = 1.5) => {
      const g = globeRef.current;
      if (!g) return;
      g.controls().autoRotate = false;
      g.pointOfView({ lat, lng, altitude }, 1000);
    },
  }));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const onReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const c = g.controls();
    c.autoRotate = true;
    c.autoRotateSpeed = 0.35;
    c.enableDamping = true;
    c.dampingFactor = 0.1;
    c.rotateSpeed = 0.6;
    c.zoomSpeed = 0.8;
    c.minDistance = 120;
    c.maxDistance = 600;
    c.addEventListener('start', () => (c.autoRotate = false));
    g.pointOfView({ lat: 25, lng: 30, altitude: window.innerWidth < 768 ? 2.5 : 2.05 }, 0);
  }, []);

  // Dynamically update autoRotate if setting changed by user
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    try {
      g.controls().autoRotate = autoRotate;
    } catch {
      // controls may not be initialized yet
    }
  }, [autoRotate]);

  const rings = useMemo(() => events.map((e) => ({ ...e, _sel: e.id === selectedId })), [events, selectedId]);

  return (
    <div ref={wrapRef} className="absolute inset-0 bg-black" style={{ touchAction: 'none' }}>
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        onGlobeReady={onReady}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-dark.jpg"
        showAtmosphere={showAtmosphere}
        atmosphereColor="#ffffff"
        atmosphereAltitude={0.14}
        rendererConfig={{ antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance', alpha: true }}
        pointsData={events}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d) => getEventColor(d as OsintEvent)}
        pointAltitude={(d) => ((d as OsintEvent).id === selectedId ? 0.14 : 0.04)}
        pointRadius={isMobile ? 1.15 : 0.85}
        pointResolution={18}
        pointsMerge={false}
        pointsTransitionDuration={250}
        pointLabel={(d) => {
          const e = d as OsintEvent;
          const color = getEventColor(e);
          const tags = getEventTags(e).join(' · ').toUpperCase();
          return `<div style="font-family:ui-monospace,monospace;background:rgba(9,9,11,.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.15);border-top:2px solid ${color};padding:8px 12px;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.7);max-width:260px"><div style="color:${color};font-size:10px;font-weight:700;letter-spacing:.15em">${escapeHtml(tags)}</div><div style="color:#ffffff;font-size:12px;margin-top:2px;font-weight:600;line-height:1.35">${escapeHtml(e.title)}</div><div style="color:#a1a1aa;font-size:10px;margin-top:4px">${escapeHtml(e.locationName)}</div></div>`;
        }}
        onPointClick={(d) => onSelect(d as OsintEvent)}
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: object) => {
          const color = getEventColor(d as OsintEvent);
          return (t: number) => hexToRgba(color, Math.max(0, 1 - t));
        }}
        ringMaxRadius={(d) => ((d as { _sel: boolean })._sel ? 6.5 : 3.8)}
        ringPropagationSpeed={2.4}
        ringRepeatPeriod={(d) => ((d as { _sel: boolean })._sel ? 600 : 1400)}
        ringAltitude={0.005}
      />
    </div>
  );
});

export default GlobeView;
