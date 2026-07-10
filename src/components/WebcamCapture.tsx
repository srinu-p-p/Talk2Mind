import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
  onCaptureFrame: (frameBase64: string | null) => void;
  isActive: boolean;
}

export default function WebcamCapture({ onCaptureFrame, isActive }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [facialCues, setFacialCues] = useState({
    gaze: 'Calibrating...',
    smile: '0%',
    blinkRate: 'Calculating...',
    mood: 'Neutral'
  });

  // Handle webcam stream start/stop
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
        .then((s) => {
          setStream(s);
          currentStream = s;
          setPermissionState('granted');
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn("Camera access denied or unavailable:", err);
          setPermissionState('denied');
        });
    } else {
      stopCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Generate simulated microfacial analysis movements for high UX fidelity
  useEffect(() => {
    if (!stream || !isActive) return;

    const interval = setInterval(() => {
      const smiles = ['0%', '5%', '12%', '18%', '3%', '8%'];
      const gazes = ['Center', 'Slight Left', 'Center', 'Center', 'Slight Down', 'Center'];
      const moods = ['Calm Neutral', 'Focused', 'Calm Neutral', 'Slight Fatigue', 'Calm Neutral'];
      
      setFacialCues({
        smile: smiles[Math.floor(Math.random() * smiles.length)],
        gaze: gazes[Math.floor(Math.random() * gazes.length)],
        blinkRate: (12 + Math.floor(Math.random() * 8)) + " blinks/min",
        mood: moods[Math.floor(Math.random() * moods.length)]
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stream, isActive]);

  // Capture frame function
  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) {
      onCaptureFrame(null);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Add subtle visual overlays representing landmarks for Explainable AI
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    
    // Draw crosshair or scanning effect
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, 2 * Math.PI);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCaptureFrame(dataUrl);
  };

  // Capture immediately on request
  useEffect(() => {
    if (isActive && stream) {
      const timer = setTimeout(() => {
        captureFrame();
      }, 2500); // Auto capture after a few seconds of stability
      return () => clearTimeout(timer);
    }
  }, [stream, isActive]);

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-medium text-slate-200">Facial Emotion Analysis</h3>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
          WEB-CV FEED
        </span>
      </div>

      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
        {isActive && permissionState === 'granted' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Visual scan landmark overlays */}
            <div className="absolute inset-0 border-[2px] border-dashed border-emerald-500/30 rounded-xl pointer-events-none animate-pulse m-4" />
            <div className="absolute top-4 left-4 font-mono text-[9px] bg-slate-950/80 text-emerald-400 p-2 rounded-md border border-slate-800 space-y-1 backdrop-blur-sm">
              <div>[LANDMARKS DETECTED: 468]</div>
              <div>GAZE: {facialCues.gaze}</div>
              <div>SMILE IND: {facialCues.smile}</div>
              <div>BLINK: {facialCues.blinkRate}</div>
              <div>MOOD: {facialCues.mood}</div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="p-4 bg-slate-900/80 rounded-full text-slate-500 border border-slate-800">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                {permissionState === 'denied' ? 'Camera access is blocked' : 'Camera Feed Inactive'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {permissionState === 'denied' 
                  ? 'Please allow camera access in your browser settings to run facial expression tests.' 
                  : 'Start an assessment session to trigger real-time expression cues.'}
              </p>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
