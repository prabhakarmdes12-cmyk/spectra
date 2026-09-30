import { useEffect, useRef, useState } from 'react';
import { Camera, Crosshair, Gauge, ShieldCheck, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpectraStore } from '../../stores/useSpectraStore';
import { StatPill } from '../common/StatPill';

export function ARReticleView() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapshot = useSpectraStore((state) => state.snapshot);

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (!enabled) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch (cameraError) {
        setError(cameraError instanceof Error ? cameraError.message : 'Camera permission denied.');
        setEnabled(false);
      }
    }
    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  const beta = snapshot.orientation.beta ?? 0;
  const gamma = snapshot.orientation.gamma ?? 0;
  const horizonY = Math.max(-42, Math.min(42, beta * 0.9));
  const horizonRotate = Math.max(-35, Math.min(35, gamma * 0.85));

  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-black">
      {enabled ? (
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-70" playsInline muted autoPlay />
      ) : (
        <div className="absolute inset-0 scan-grid grid place-items-center bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.12),rgba(5,5,8,0.96))]">
          <div className="max-w-xs text-center">
            <VideoOff className="mx-auto mb-4 size-12 text-white/35" />
            <p className="text-sm font-semibold text-white/80">Camera HUD is permission gated</p>
            <p className="mt-2 text-xs leading-relaxed text-white/50">AR reticle overlays only measured scene information. Unlocated audio or magnetic events are not pinned to the camera view.</p>
            {error && <p className="mt-3 rounded-xl border border-amber/30 bg-amber/10 p-2 text-xs text-amber">{error}</p>}
            <button onClick={() => setEnabled(true)} className="mt-5 rounded-full bg-cyan px-5 py-3 text-sm font-bold text-black shadow-lg shadow-cyan/25">
              Enable environment camera
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_45%,rgba(0,0,0,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/35 shadow-[0_0_40px_rgba(0,240,255,0.13)]" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
        <Crosshair className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 text-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-0.5 w-[72%] origin-center bg-gradient-to-r from-transparent via-amber to-transparent"
          style={{ y: horizonY, rotate: horizonRotate }}
        />
        <div className="absolute left-6 top-6 right-6 flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
            <p className="telemetry-label mb-2">AR Reticle HUD</p>
            <div className="grid gap-2">
              <StatPill label="HDG" value={`${Math.round(snapshot.orientation.heading ?? 0)}°`} />
              <StatPill label="EDI" value={`${Math.round(snapshot.edi)}`} tone={snapshot.edi > 50 ? 'amber' : 'green'} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/55 p-3 text-right backdrop-blur-md">
            <p className="telemetry-label mb-2">Spatial rule</p>
            <p className="max-w-[12rem] text-xs leading-relaxed text-white/60">Only camera-supported scene features may anchor here. Unknown-origin signals stay on radar/timeline.</p>
          </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
          <div className="rounded-2xl border border-phosphor/20 bg-black/55 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-phosphor"><ShieldCheck className="size-4" /> Measured ≠ estimated</div>
            <p className="mt-1 text-[0.68rem] text-white/45">Strict spatial honesty overlay active.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-cyan"><Gauge className="size-4" /> Pitch {beta.toFixed(0)}° · Roll {gamma.toFixed(0)}°</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/55"><Camera className="size-4" /> {enabled ? 'Camera live' : 'Camera idle'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
