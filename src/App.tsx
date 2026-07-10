import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Heart, Activity, Wind, BookOpen, Trash2, 
  AlertTriangle, RefreshCw, Moon, Sun, CheckCircle2, ChevronRight
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AssessmentFlow from './components/AssessmentFlow';
import BreathingExercise from './components/BreathingExercise';
import { AssessmentResult } from './types';

// Standardized initial seed records to display stunning dashboard timelines out of the box
const SEED_HISTORY: AssessmentResult[] = [
  {
    id: "seed_1",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    overallScore: 68,
    riskLevel: "Moderate Anxiety",
    emotions: { happy: 15, sad: 25, angry: 10, fear: 12, neutral: 20, anxious: 18 },
    behavioralCues: { eyeOpenness: 78, smileIntensity: 22, speakingSpeed: "Slow", voiceEnergy: "Low", blinkRate: 19 },
    sentimentAnalysis: {
      sentiment: "Negative",
      indicatorsDetected: ["Fatigue cues", "Mild speech monotone", "Anxiety vocabulary"],
      transcriptSummary: "Discussed feeling slightly overwhelmed with academic deadlines and having trouble falling asleep."
    },
    explainability: { questionnaire: 45, facialExpressions: 15, speechAcoustics: 20, speechContent: 20 },
    recommendations: [
      {
        title: "Guided Diaphragmatic Breathing",
        description: "Follow the interactive 4-7-8 breathing circle to lower your resting pulse rate.",
        type: "breathing",
        duration: "5 mins"
      },
      {
        title: "Cognitive Journaling Exercise",
        description: "Write out what matters to you and list items you have control over.",
        type: "cognitive",
        duration: "10 mins"
      }
    ],
    detailedAnalysis: "Baseline assessment conducted last week indicated moderately elevated anxiety markers. Questionnaires flagged PSS stress score. Expression markers showed moderate facial fatigue and decreased vocal speed. Recommendations focused heavily on stress reduction and somatic recovery techniques."
  },
  {
    id: "seed_2",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    overallScore: 82,
    riskLevel: "Mild Stress",
    emotions: { happy: 45, sad: 12, angry: 4, fear: 6, neutral: 25, anxious: 8 },
    behavioralCues: { eyeOpenness: 86, smileIntensity: 54, speakingSpeed: "Normal", voiceEnergy: "Medium", blinkRate: 14 },
    sentimentAnalysis: {
      sentiment: "Positive",
      indicatorsDetected: [],
      transcriptSummary: "Reported getting better rest and enjoying a walk outdoors."
    },
    explainability: { questionnaire: 50, facialExpressions: 18, speechAcoustics: 16, speechContent: 16 },
    recommendations: [
      {
        title: "Somatic Relaxation Breathing",
        description: "Practice the 4-7-8 cycle before rest periods.",
        type: "breathing",
        duration: "5 mins"
      },
      {
        title: "Gratitude Mapping Session",
        description: "Jot down three small wins from your day.",
        type: "cognitive",
        duration: "10 mins"
      }
    ],
    detailedAnalysis: "Subsequent follow-up indicated a positive upward trend in overall subjective well-being. Sleep indicators improved (PHQ-9 question 3 decreased). Speech acoustics demonstrated significantly more vocal range variation and natural rhythm. Continue existing daily meditation."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'breathing' | 'resources'>('dashboard');
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [theme, setTheme] = useState<'slate-dark'>('slate-dark'); // Custom polished slate dark theme

  // Fetch or seed history on mount
  useEffect(() => {
    const stored = localStorage.getItem('talk2mind_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.warn("Could not parse stored session logs, loading seeds...");
        setHistory(SEED_HISTORY);
      }
    } else {
      // Seed with sample data to make dashboard immediately interactive
      setHistory(SEED_HISTORY);
      localStorage.setItem('talk2mind_history', JSON.stringify(SEED_HISTORY));
    }
  }, []);

  // Save changes to history
  const saveHistory = (updated: AssessmentResult[]) => {
    setHistory(updated);
    localStorage.setItem('talk2mind_history', JSON.stringify(updated));
  };

  // Handler for finished assessment
  const handleAssessmentComplete = (newResult: AssessmentResult) => {
    const updated = [...history, newResult];
    saveHistory(updated);
    setActiveTab('dashboard');
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your local assessment history? This is irreversible.")) {
      saveHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Visual background ambient blobs */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Application Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/60 py-4 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Heart className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-100 font-sans">Talk2Mind</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                MULTIMODAL WELLNESS CORE
              </span>
            </div>
          </div>

          {/* Core Navigation Bar */}
          <nav className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'assessment' 
                  ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Screening
            </button>
            <button
              onClick={() => setActiveTab('breathing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'breathing' 
                  ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Breathing
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === 'resources' 
                  ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Resources
            </button>
          </nav>

        </div>
      </header>

      {/* Primary Application Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 z-10">
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            history={history} 
            onStartAssessment={() => setActiveTab('assessment')}
            onClearHistory={handleClearHistory}
            onTriggerBreathing={() => setActiveTab('breathing')}
          />
        )}

        {activeTab === 'assessment' && (
          <AssessmentFlow 
            onComplete={handleAssessmentComplete} 
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'breathing' && (
          <div className="py-6">
            <BreathingExercise />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="max-w-3xl mx-auto space-y-6 py-6 animate-fade-in">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-100">Validated Screening Information</h2>
              <p className="text-xs md:text-sm text-slate-400">Understanding standard psychological metrics used in the Talk2Mind fusion score.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900/20 border border-slate-800/80 rounded-2xl space-y-2">
                <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">PHQ-9</span>
                <h4 className="text-sm font-semibold text-slate-200">Patient Health Questionnaire</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The standard 9-question instrument used by medical providers to screen for presence and intensity of depressive symptomatology.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">Range: 0-27 (Severity breaks at 5, 10, 15, 20)</div>
              </div>

              <div className="p-5 bg-slate-900/20 border border-slate-800/80 rounded-2xl space-y-2">
                <span className="text-[9px] font-mono font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">GAD-7</span>
                <h4 className="text-sm font-semibold text-slate-200">Generalized Anxiety Disorder</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A rapid 7-question psychometric scale designed to identify clinical anxiety states, panic responses, and worry levels.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">Range: 0-21 (Severity breaks at 5, 10, 15)</div>
              </div>

              <div className="p-5 bg-slate-900/20 border border-slate-800/80 rounded-2xl space-y-2">
                <span className="text-[9px] font-mono font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">PSS-4</span>
                <h4 className="text-sm font-semibold text-slate-200">Perceived Stress Scale</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A classic measure of the degree to which life situations are appraised as unpredictable, uncontrollable, and overloading.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">Range: 0-16 (Stress indicators)</div>
              </div>
            </div>

            <div className="p-6 bg-red-500/5 border border-red-500/15 rounded-3xl space-y-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-slate-200">Immediate Wellness & Support Helplines</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you are experiencing acute crisis, persistent severe distress, or thoughts of self-harm, please connect with trained professionals who can provide immediate, compassionate support. Talk2Mind is a supportive screening framework and does not substitute for clinical emergency intervention.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">UNITED STATES CRISIS LINE</div>
                  <div className="font-bold text-red-400 mt-1">988 Suicide & Crisis Lifeline</div>
                  <div className="text-[10px] text-slate-400">Call or Text 24/7 (Free)</div>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">INTERNATIONAL RESOURCES</div>
                  <div className="font-bold text-red-400 mt-1">Befrienders Worldwide</div>
                  <div className="text-[10px] text-slate-400">befrienders.org (Global Directory)</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Global Application Footer */}
      <footer className="py-6 px-6 border-t border-slate-800/40 mt-auto text-center font-mono text-[9px] text-slate-500">
        <div>TALK2MIND PROJECT WORKSPACE • POWERED BY GEMINI MULTIMODAL AI</div>
        <div className="mt-1">All data stays in localized client storage • Built with React & Express</div>
      </footer>

    </div>
  );
}
