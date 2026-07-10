import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export default function AudioVisualizer({ stream, isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array = new Uint8Array(0);

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 80;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (stream && isRecording) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.warn("Failed to initialize Web Audio API for visualizer:", err);
      }
    }

    const draw = () => {
      if (!ctx || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark transparent background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / 40);
      let x = 0;

      if (analyser && isRecording && dataArray.length > 0) {
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < 40; i++) {
          const percent = dataArray[i % dataArray.length] / 255;
          const barHeight = percent * height * 0.9 + 4;

          // Beautiful calming emerald/teal gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#10b981'); // Emerald
          gradient.addColorStop(0.5, '#14b8a6'); // Teal
          gradient.addColorStop(1, '#06b6d4'); // Cyan

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      } else {
        // Simulated smooth wave when idle or recording with fallback
        const time = Date.now() * 0.003;
        for (let i = 0; i < 40; i++) {
          const amplitude = isRecording ? 25 : 8;
          const speedFactor = isRecording ? 2.5 : 1.0;
          const offset = i * 0.15;
          const barHeight = Math.sin(time * speedFactor + offset) * amplitude + amplitude + 4;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          if (isRecording) {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#0ea5e9');
          } else {
            gradient.addColorStop(0, '#64748b'); // Slate gray
            gradient.addColorStop(1, '#475569');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [stream, isRecording]);

  return (
    <div className="w-full bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800/80 p-2">
      <div className="flex justify-between items-center px-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {isRecording ? 'Acoustic Signal Captured' : 'Audio Feed Idle'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[10px] font-mono text-slate-500">16kHz PCM</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-16 block rounded bg-slate-900/40" />
    </div>
  );
}
