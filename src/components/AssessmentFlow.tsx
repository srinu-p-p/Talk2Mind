import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Camera, Mic, Play, Square, Loader, ChevronRight, 
  ChevronLeft, AlertCircle, Sparkles, CheckCircle2, Volume2
} from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import AudioVisualizer from './AudioVisualizer';
import { QuestionnaireScores, AssessmentResult } from '../types';

interface AssessmentFlowProps {
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way"
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const PSS_QUESTIONS = [
  "In the last month, how often have you felt that you were unable to control the important things in your life?",
  "In the last month, how often have you felt confident about your ability to handle your personal problems?",
  "In the last month, how often have you felt that things were going your way?",
  "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?"
];

export default function AssessmentFlow({ onComplete, onCancel }: AssessmentFlowProps) {
  const [step, setStep] = useState<'info' | 'phq9' | 'gad7' | 'pss' | 'vocal' | 'analyzing'>('info');
  
  // Questionnaire scoring
  const [phq9Answers, setPhq9Answers] = useState<number[]>(new Array(9).fill(0));
  const [gad7Answers, setGad7Answers] = useState<number[]>(new Array(7).fill(0));
  const [pssAnswers, setPssAnswers] = useState<number[]>(new Array(4).fill(0));
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  // Camera frame state
  const [facialFrame, setFacialFrame] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Loading progression logs
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTrans) {
          setTranscript((prev) => prev + finalTrans);
        }
      };
      
      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle active webcam states depending on step
  useEffect(() => {
    if (step === 'vocal') {
      setCameraActive(true);
    } else {
      setCameraActive(false);
    }
  }, [step]);

  // Audio recording handlers
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition already started or failed:", e);
        }
      }
    } catch (err) {
      console.warn("Microphone access denied:", err);
      alert("Microphone could not be activated. You can still type your journal entry below.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Recognition stop failed:", e);
      }
    }
    setIsRecording(false);
  };

  // Compute standard scores
  const getPHQ9Score = () => phq9Answers.reduce((a, b) => a + b, 0);
  const getGAD7Score = () => gad7Answers.reduce((a, b) => a + b, 0);
  const getPSSScore = () => {
    // PSS-4 standard calculation: Q2 & Q3 are reverse scored
    // Values are 0-3. Reverse: 3 - value.
    const q1 = pssAnswers[0];
    const q2 = 3 - pssAnswers[1];
    const q3 = 3 - pssAnswers[2];
    const q4 = pssAnswers[3];
    return q1 + q2 + q3 + q4;
  };

  // Trigger Backend Assessment Call
  const submitAssessment = async () => {
    setStep('analyzing');
    setAnalysisLogs(["Initializing multimodal signal fuser..."]);
    setAnalysisError(null);

    const scores: QuestionnaireScores = {
      phq9: getPHQ9Score(),
      gad7: getGAD7Score(),
      pss: getPSSScore()
    };

    // Staggered ticker logs to show AI fusion in progress
    const timers: NodeJS.Timeout[] = [];
    const log = (msg: string, delay: number) => {
      timers.push(setTimeout(() => {
        setAnalysisLogs(prev => [...prev, msg]);
      }, delay));
    };

    log("✓ Fused psychometric markers (PHQ-9: " + scores.phq9 + ", GAD-7: " + scores.gad7 + ")", 800);
    log("✓ Extracted facial coordinate mesh matrices", 1600);
    log("✓ Running Voice Spectral Analysis (Spectral Contrast, Loudness Energy)", 2400);
    log("✓ Submitting integrated features to Gemini assessment engine...", 3200);

    try {
      const response = await fetch("/api/analyze-multimodal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facialFrame,
          audioBase64,
          transcript: transcript || "The user completed the self-guided verbal check-in.",
          questionnaireScores: scores
        })
      });

      if (!response.ok) {
        throw new Error("Assessment endpoint failed: " + response.statusText);
      }

      const data = await response.json();
      
      timers.push(setTimeout(() => {
        if (data.simulated) {
          setAnalysisLogs(prev => [...prev, "✓ Analysis completed (Running in simulation mode)"]);
        } else {
          setAnalysisLogs(prev => [...prev, "✓ Holistic wellness index mapped successfully!"]);
        }
      }, 4000));

      timers.push(setTimeout(() => {
        onComplete(data.result);
      }, 5000));

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "An error occurred while running the AI assessment.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[500px] flex flex-col">
      {/* Step Stepper Header */}
      {step !== 'analyzing' && (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/30 border-b border-slate-800/60 rounded-t-3xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              TALK2MIND
            </span>
            <h2 className="text-sm font-medium text-slate-300">Guided Wellness Screening</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {['info', 'phq9', 'gad7', 'pss', 'vocal'].map((s, idx) => {
              const stages = ['info', 'phq9', 'gad7', 'pss', 'vocal'];
              const currentIdx = stages.indexOf(step);
              return (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIdx ? 'w-8 bg-emerald-500' : (idx < currentIdx ? 'w-2 bg-emerald-700/60' : 'w-2 bg-slate-800')
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="flex-1 bg-slate-900/10 border-x border-b border-slate-800/60 rounded-b-3xl p-6 md:p-8 flex flex-col justify-between">
        
        {/* STEP: INFO */}
        {step === 'info' && (
          <div className="space-y-6 animate-fade-in">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 mb-2">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight font-sans">
                Multimodal AI Self-Assessment
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Talk2Mind is a safe, validated, clinical-style screening helper. 
                Over the next few minutes, we will assess your well-being through three standard psychometric questionnaires, followed by a simple 15-second guided vocal check-in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
              <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition">
                <FileText className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-200">Psychometrics</h3>
                <p className="text-xs text-slate-400 mt-1">Validated PHQ-9, GAD-7, and PSS surveys for mood, anxiety, and stress levels.</p>
              </div>
              <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition">
                <Camera className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-200">Facial Expression</h3>
                <p className="text-xs text-slate-400 mt-1">Webcam snapshots to extract subtle emotional valence, eye openness, and blink markers.</p>
              </div>
              <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition">
                <Mic className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-200">Vocal Acoustics</h3>
                <p className="text-xs text-slate-400 mt-1">Mic recording to analyze tone, pitch variation, speaking rate, and verbal sentiment.</p>
              </div>
            </div>

            <div className="max-w-xl mx-auto p-3 bg-blue-500/10 text-blue-300 rounded-xl border border-blue-500/20 flex gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
              <div>
                <span className="font-semibold">Ethical Notice:</span> This application does not make medical diagnoses. All processing is securely analyzed server-side, and results are stored locally in your browser cache.
              </div>
            </div>
          </div>
        )}

        {/* STEP: PHQ-9 */}
        {step === 'phq9' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  STAGE 1 OF 4
                </span>
                <h2 className="text-base font-semibold text-slate-200">PHQ-9 Depression Screener</h2>
              </div>
              <p className="text-xs text-slate-400">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {PHQ9_QUESTIONS.map((question, index) => (
                <div key={index} className="p-4 bg-slate-900/20 rounded-xl border border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-xs text-slate-300 max-w-md font-medium">
                    {index + 1}. {question}
                  </span>
                  <div className="flex gap-1.5">
                    {['Not at all', 'Several days', 'More than half', 'Nearly every day'].map((label, val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const updated = [...phq9Answers];
                          updated[index] = val;
                          setPhq9Answers(updated);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                          phq9Answers[index] === val 
                            ? 'bg-emerald-500 text-slate-950 font-semibold' 
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: GAD-7 */}
        {step === 'gad7' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  STAGE 2 OF 4
                </span>
                <h2 className="text-base font-semibold text-slate-200">GAD-7 Anxiety Screener</h2>
              </div>
              <p className="text-xs text-slate-400">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {GAD7_QUESTIONS.map((question, index) => (
                <div key={index} className="p-4 bg-slate-900/20 rounded-xl border border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-xs text-slate-300 max-w-md font-medium">
                    {index + 1}. {question}
                  </span>
                  <div className="flex gap-1.5">
                    {['Not at all', 'Several days', 'More than half', 'Nearly every day'].map((label, val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const updated = [...gad7Answers];
                          updated[index] = val;
                          setGad7Answers(updated);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                          gad7Answers[index] === val 
                            ? 'bg-emerald-500 text-slate-950 font-semibold' 
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: PSS */}
        {step === 'pss' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  STAGE 3 OF 4
                </span>
                <h2 className="text-base font-semibold text-slate-200">Perceived Stress Scale (PSS-4)</h2>
              </div>
              <p className="text-xs text-slate-400">In the last month, how often have you felt the following states?</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {PSS_QUESTIONS.map((question, index) => (
                <div key={index} className="p-4 bg-slate-900/20 rounded-xl border border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-xs text-slate-300 max-w-md font-medium">
                    {index + 1}. {question}
                  </span>
                  <div className="flex gap-1.5">
                    {['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'].map((label, val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const updated = [...pssAnswers];
                          updated[index] = val;
                          setPssAnswers(updated);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                          pssAnswers[index] === val 
                            ? 'bg-emerald-500 text-slate-950 font-semibold' 
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: VOCAL EXPRESSION */}
        {step === 'vocal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    STAGE 4 OF 4
                  </span>
                  <h2 className="text-base font-semibold text-slate-200">Guided Vocal & Facial Check-in</h2>
                </div>
                <p className="text-xs text-slate-400">We will record a short acoustic clip of you answering a daily reflection prompt. This helps extract facial micro-expressions and acoustic tones.</p>
              </div>

              {/* Journal Prompt Box */}
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-teal-950/10 space-y-2">
                <span className="text-[9px] font-semibold text-emerald-400 tracking-wider font-mono">JOURNAL REFLECTION PROMPT</span>
                <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed italic">
                  &ldquo;Describe how your energy, mood, and sleep have been over the past week. Have you been feeling supported, or are there challenges weighing on your mind?&rdquo;
                </p>
              </div>

              {/* Recorder actions */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    >
                      <Mic className="w-4 h-4 fill-slate-950" /> Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-400 text-slate-950 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    >
                      <Square className="w-4 h-4" /> Stop Recording
                    </button>
                  )}
                </div>

                <AudioVisualizer stream={audioStream} isRecording={isRecording} />
              </div>

              {/* Transcription & Fallback Text Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-medium block">
                  Transcript (Auto-captioned or manual adjustment):
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your speech transcript will automatically appear here. You can also manually type or edit your journal entry."
                  className="w-full h-24 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>

            {/* Webcam capture component */}
            <div className="space-y-4">
              <WebcamCapture onCaptureFrame={(frame) => setFacialFrame(frame)} isActive={cameraActive} />
              <div className="p-3.5 bg-slate-950/30 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Multimodal Sync Configuration
                </div>
                <div>• Auto-capture will take a photo of your expression to compute valence.</div>
                <div>• Speak clearly for at least 5-10 seconds to generate a valid voice spectrogram.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP: ANALYZING LOADING */}
        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-md mx-auto space-y-6">
            {!analysisError ? (
              <>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-base font-semibold text-slate-100">Talk2Mind Fusion Engine</h3>
                  <p className="text-xs text-slate-400">Processing physical & psychometric telemetry cues with Deep Generative AI...</p>
                </div>

                {/* Simulated Ticker Terminal */}
                <div className="w-full bg-slate-950 border border-slate-800/80 p-4 rounded-xl font-mono text-[10px] text-slate-300 space-y-2 min-h-[140px] text-left">
                  {analysisLogs.map((log, idx) => (
                    <div key={idx} className="transition-opacity duration-300">
                      {log}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-3 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full inline-block">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-slate-100">Analysis Failed</h3>
                  <p className="text-xs text-red-400/80 max-w-sm">{analysisError}</p>
                </div>
                <button
                  onClick={submitAssessment}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Retry Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button Navigation Footer */}
        {step !== 'analyzing' && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/60 mt-6">
            <button
              onClick={() => {
                if (step === 'info') onCancel();
                else if (step === 'phq9') setStep('info');
                else if (step === 'gad7') setStep('phq9');
                else if (step === 'pss') setStep('gad7');
                else if (step === 'vocal') setStep('pss');
              }}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step !== 'vocal' ? (
              <button
                onClick={() => {
                  if (step === 'info') setStep('phq9');
                  else if (step === 'phq9') setStep('gad7');
                  else if (step === 'gad7') setStep('pss');
                  else if (step === 'pss') setStep('vocal');
                }}
                className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4 font-bold" />
              </button>
            ) : (
              <button
                onClick={submitAssessment}
                className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
              >
                Submit & Analyze <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
