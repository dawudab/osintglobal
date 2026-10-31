import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import type { OsintEvent } from '../types';
import { CATEGORIES, hexToRgba } from '../utils/categories';
import { escapeHtml } from '../utils/format';

export interface GlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number) => void;
}

interface Props {
  events: OsintEvent[];
  selectedId?: string;
  onSelect: (e: OsintEvent) => void;
}

const GlobeView = forwardRef<GlobeHandle, Props>(function GlobeView({ events, selectedId, onSelect }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

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
    g.pointOfView({ lat: 25, lng: 30, altitude: window.innerWidth < 768 ? 2.6 : 2.1 }, 0);
  }, []);

  const rings = useMemo(() => events.map((e) => ({ ...e, _sel: e.id === selectedId })), [events, selectedId]);

  return (
    <div ref={wrapRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        onGlobeReady={onReady}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-dark.jpg"
        showAtmosphere
        atmosphereColor="#00e5ff"
        atmosphereAltitude={0.15}
        rendererConfig={{ antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance', alpha: true }}
        pointsData={events}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d) => CATEGORIES[(d as OsintEvent).category].color}
        pointAltitude={(d) => ((d as OsintEvent).id === selectedId ? 0.12 : 0.03)}
        pointRadius={0.65}
        pointResolution={12}
        pointsMerge={false}
        pointsTransitionDuration={300}
        pointLabel={(d) => {
          const e = d as OsintEvent;
          const c = CATEGORIES[e.category];
          return `<div style="font-family:ui-monospace,monospace;background:rgba(10,15,24,.92);border:1px solid ${c.color};padding:6px 8px;border-radius:4px;max-width:240px"><div style="color:${c.color};font-size:10px;letter-spacing:.15em">${c.label}</div><div style="color:#e2e8f0;font-size:12px">${escapeHtml(e.title)}</div><div style="color:#00e5ff;font-size:10px">${escapeHtml(e.locationName)}</div></div>`;
        }}
        onPointClick={(d) => onSelect(d as OsintEvent)}
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: object) => {
          const color = CATEGORIES[(d as OsintEvent).category].color;
          return (t: number) => hexToRgba(color, Math.max(0, 1 - t));
        }}
        ringMaxRadius={(d) => ((d as { _sel: boolean })._sel ? 6 : 3.5)}
        ringPropagationSpeed={2.5}
        ringRepeatPeriod={(d) => ((d as { _sel: boolean })._sel ? 600 : 1400)}
        ringAltitude={0.004}
      />
    </div>
  );
});

export default GlobeView;
