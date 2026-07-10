import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BreathingExercise() {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Simple clean synthesized bell sound for breathing cues
  const playTone = (freq: number, duration: number) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext tone failed:", e);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'idle') {
      setSeconds(0);
      return;
    }

    timer = setInterval(() => {
      setSeconds((prev) => {
        if (phase === 'inhale' && prev >= 4) {
          setPhase('hold');
          playTone(440, 1.5); // Hold tone
          return 0;
        }
        if (phase === 'hold' && prev >= 7) {
          setPhase('exhale');
          playTone(330, 2.0); // Exhale tone
          return 0;
        }
        if (phase === 'exhale' && prev >= 8) {
          setCompletedCycles((c) => c + 1);
          setPhase('inhale');
          playTone(554.37, 1.0); // Inhale tone
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isMuted]);

  const startExercise = () => {
    setCompletedCycles(0);
    setPhase('inhale');
    playTone(554.37, 1.0); // Start tone (Inhale)
  };

  const stopExercise = () => {
    setPhase('idle');
  };

  // Circular scale sizes depending on breath phase
  const getScale = () => {
    if (phase === 'inhale') return 1.5;
    if (phase === 'hold') return 1.5;
    if (phase === 'exhale') return 1.0;
    return 1.05;
  };

  const getInstructions = () => {
    switch (phase) {
      case 'inhale':
        return { text: 'Inhale through the nose', color: 'text-emerald-400' };
      case 'hold':
        return { text: 'Suspend the breath', color: 'text-sky-400' };
      case 'exhale':
        return { text: 'Exhale through the mouth', color: 'text-teal-400' };
      default:
        return { text: 'Click Play to begin the 4-7-8 Breathing Technique', color: 'text-slate-400' };
    }
  };

  const currentInfo = getInstructions();

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-medium text-slate-200">Interactive 4-7-8 Breathing Guide</h2>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center my-6">
        {/* Breathing Outer Ring Background */}
        <div className="absolute inset-0 rounded-full border border-slate-800/50" />
        <div className="absolute inset-10 rounded-full border border-slate-800/40" />

        {/* Dynamic Expanding/Contracting Circle */}
        <motion.div
          animate={{
            scale: getScale(),
          }}
          transition={{
            duration: phase === 'inhale' ? 4 : (phase === 'exhale' ? 8 : 0.5),
            ease: "easeInOut",
          }}
          className={`absolute rounded-full w-40 h-40 opacity-20 blur-xl ${
            phase === 'inhale' ? 'bg-emerald-500' : (phase === 'hold' ? 'bg-sky-500' : 'bg-teal-500')
          }`}
        />

        <motion.div
          animate={{
            scale: getScale(),
          }}
          transition={{
            duration: phase === 'inhale' ? 4 : (phase === 'exhale' ? 8 : 0.5),
            ease: "easeInOut",
          }}
          className={`absolute rounded-full w-36 h-36 flex items-center justify-center border-2 border-dashed ${
            phase === 'inhale' ? 'border-emerald-400/80 bg-emerald-950/20' : 
            (phase === 'hold' ? 'border-sky-400/80 bg-sky-950/20' : 'border-teal-400/80 bg-teal-950/20')
          }`}
        />

        {/* Floating Center Numbers */}
        <div className="z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs font-mono uppercase tracking-widest text-slate-400"
            >
              {phase === 'idle' ? 'Ready' : phase}
            </motion.span>
          </AnimatePresence>
          <span className="text-4xl font-semibold font-mono text-slate-100 my-1">
            {phase === 'idle' ? '0' : seconds}
          </span>
          {completedCycles > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Cycle {completedCycles} Complete
            </span>
          )}
        </div>
      </div>

      <div className="text-center max-w-sm mt-4 min-h-[48px]">
        <p className={`text-sm font-medium ${currentInfo.color} transition-colors duration-300`}>
          {currentInfo.text}
        </p>
      </div>

      <div className="flex gap-4 mt-8 w-full">
        {phase === 'idle' ? (
          <button
            onClick={startExercise}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-medium text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Start Session
          </button>
        ) : (
          <button
            onClick={stopExercise}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 font-medium text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Square className="w-4 h-4" /> Stop & Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-6 w-full pt-6 border-t border-slate-800/80 font-mono text-[9px] text-slate-400 text-center">
        <div>
          <div className="text-slate-500 mb-0.5">INHALE</div>
          <div className="text-xs font-semibold text-emerald-400">4 SECONDS</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5">HOLD</div>
          <div className="text-xs font-semibold text-sky-400">7 SECONDS</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5">EXHALE</div>
          <div className="text-xs font-semibold text-teal-400">8 SECONDS</div>
        </div>
      </div>
    </div>
  );
}
