import { useEffect, useRef } from 'react';

export function useSpectraFeedback(active: boolean, muted: boolean) {
  const audioRef = useRef<AudioContext | null>(null);
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);

  const ensureContext = () => {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioRef.current) audioRef.current = new AudioContextCtor({ latencyHint: 'interactive' });
    if (audioRef.current.state === 'suspended') void audioRef.current.resume();
    return audioRef.current;
  };

  useEffect(() => {
    if (!active || muted) {
      humGainRef.current?.gain.setTargetAtTime(0, audioRef.current?.currentTime ?? 0, 0.08);
      return;
    }
    const context = ensureContext();
    if (!context) return;
    if (!humOscRef.current) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 43;
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      humOscRef.current = oscillator;
      humGainRef.current = gain;
    }
    humGainRef.current?.gain.setTargetAtTime(0.018, context.currentTime, 0.25);
  }, [active, muted]);

  useEffect(() => {
    return () => {
      humOscRef.current?.stop();
      humOscRef.current?.disconnect();
      humGainRef.current?.disconnect();
      void audioRef.current?.close().catch(() => undefined);
    };
  }, []);

  const pulse = (strong = false) => {
    if (navigator.vibrate) navigator.vibrate(strong ? [30, 50, 30] : [15]);
    if (muted) return;
    const context = ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(strong ? 164 : 112, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(strong ? 64 : 58, context.currentTime + 0.07);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(strong ? 0.12 : 0.055, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  };

  return { pulse };
}
