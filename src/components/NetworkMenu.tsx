import { useEffect, useRef, useState } from 'react';
import { Heart, Lock, Radio, Settings, SlidersHorizontal } from 'lucide-react';
import SiteSettingsModal, { type SiteSettings } from './SiteSettingsModal';
import DonationModal from './DonationModal';
import NetworkManifestoModal from './NetworkManifestoModal';

interface Props {
  settings: SiteSettings;
  onUpdateSettings: (updater: (prev: SiteSettings) => SiteSettings) => void;
  onAdminClick: () => void;
}

export default function NetworkMenu({ settings, onUpdateSettings, onAdminClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="relative inline-block font-mono" ref={menuRef}>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Network & System Menu"
        aria-expanded={menuOpen}
        title="Network & System Menu"
        className="tac-btn min-h-[38px] px-2.5 sm:px-3 text-[11px] font-mono whitespace-nowrap rounded-xl border-white/20 hover:border-white hover:bg-white/10 flex items-center gap-1.5 transition-all"
      >
        <SlidersHorizontal size={14} className="text-white" />
        <span className="hidden sm:inline">MENU</span>
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950/95 p-3 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Menu Title / Telemetry Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              SYSTEM NETWORK
            </span>
            <span className="tabular-nums">TAO // OP_RELAY</span>
          </div>

          {/* Menu Options */}
          <div className="space-y-1">
            {/* Site Settings */}
            <button
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
                <Settings size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[12px]">Site Settings</div>
                <div className="text-[10px] text-zinc-400 font-normal">Audio FX, globe motion, visual preferences</div>
              </div>
            </button>

            {/* Resistance Fund / Donations */}
            <button
              onClick={() => {
                setMenuOpen(false);
                setDonationOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
                <Heart size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[12px]">Resistance Fund</div>
                <div className="text-[10px] text-zinc-400 font-normal">Crypto support (TAO, XMR, BTC)</div>
              </div>
            </button>

            {/* Network Telemetry / Manifesto */}
            <button
              onClick={() => {
                setMenuOpen(false);
                setManifestoOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
                <Radio size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[12px]">Network Manifesto</div>
                <div className="text-[10px] text-zinc-400 font-normal">P2P telemetry & zero-trace protocol</div>
              </div>
            </button>
          </div>

          {/* Discreet Footer with Subtle Lock Icon for Admin Access */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 px-2 text-[10px] text-zinc-500">
            <span className="font-mono text-[9px] tracking-widest uppercase">
              NODE // RN-v2.5
            </span>

            {/* Unassuming lock sign button for admin entrance */}
            <button
              onClick={() => {
                setMenuOpen(false);
                onAdminClick();
              }}
              title="Encrypted Clearance Gate"
              aria-label="Security Clearance Gate"
              className="group flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-zinc-500 hover:border-white/30 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              <Lock size={12} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <SiteSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={onUpdateSettings}
      />

      <DonationModal
        open={donationOpen}
        onClose={() => setDonationOpen(false)}
      />

      <NetworkManifestoModal
        open={manifestoOpen}
        onClose={() => setManifestoOpen(false)}
      />
    </div>
  );
}
