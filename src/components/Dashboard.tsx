import React, { useState } from 'react';
import { 
  Sparkles, History, Heart, ChevronRight, Activity, Calendar, 
  Trash2, BrainCircuit, MessageSquare, AlertTriangle, ShieldCheck,
  CheckCircle2, Compass, Play, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Cell, Legend, LineChart, Line 
} from 'recharts';
import { AssessmentResult } from '../types';

interface DashboardProps {
  history: AssessmentResult[];
  onStartAssessment: () => void;
  onClearHistory: () => void;
  onTriggerBreathing: () => void;
}

export default function Dashboard({ history, onStartAssessment, onClearHistory, onTriggerBreathing }: DashboardProps) {
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(
    history.length > 0 ? history[history.length - 1] : null
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Mild Stress': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Moderate Anxiety': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'High Stress': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'High Risk': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-sky-400';
    if (score >= 55) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Format historical timeline data for charts
  const timelineData = history.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: item.overallScore,
    risk: item.riskLevel
  }));

  // Structure Explainable AI data for contribution weights bar chart
  const explainabilityData = selectedResult ? [
    { name: 'Psychometrics', weight: selectedResult.explainability.questionnaire, fill: '#10b981' },
    { name: 'Facial Expressions', weight: selectedResult.explainability.facialExpressions, fill: '#14b8a6' },
    { name: 'Speech Acoustics', weight: selectedResult.explainability.speechAcoustics, fill: '#0ea5e9' },
    { name: 'Speech Content', weight: selectedResult.explainability.speechContent, fill: '#6366f1' },
  ] : [];

  // Structure current emotions data
  const emotionsData = selectedResult ? [
    { name: 'Happy', value: selectedResult.emotions.happy, fill: '#10b981' },
    { name: 'Sad', value: selectedResult.emotions.sad, fill: '#3b82f6' },
    { name: 'Neutral', value: selectedResult.emotions.neutral, fill: '#64748b' },
    { name: 'Anxious', value: selectedResult.emotions.anxious, fill: '#f59e0b' },
    { name: 'Angry', value: selectedResult.emotions.angry, fill: '#ef4444' },
    { name: 'Fear', value: selectedResult.emotions.fear, fill: '#8b5cf6' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner & Active Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </span>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-100 tracking-tight font-sans">
              Talk2Mind Well-Being Center
            </h1>
          </div>
          <p className="text-slate-400 text-xs md:text-sm">
            {history.length > 0 
              ? `You have completed ${history.length} screening sessions. View insights below or take a fresh test.`
              : "Welcome. Begin your primary screening to visualize emotional trends, acoustic signals, and support exercises."}
          </p>
        </div>
        <button
          onClick={onStartAssessment}
          className="py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" /> Start Assessment Session
        </button>
      </div>

      {history.length === 0 ? (
        /* Zero State View */
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 border border-slate-800/80 rounded-3xl space-y-4 py-16">
          <div className="p-4 bg-slate-900/60 rounded-full text-slate-600 border border-slate-800">
            <Activity className="w-10 h-10" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-medium text-slate-300">No Assessment Logs Present</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To plot emotional timelines, run acoustic waveform analyses, and generate personalized recommendations, you must complete your first 5-minute guided session.
            </p>
          </div>
          <button
            onClick={onStartAssessment}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Run Initial Screening
          </button>
        </div>
      ) : (
        /* Main Analytics Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: Historical sessions & Score Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Session Logs Selector */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Historical Logs
                </h3>
                <button
                  onClick={onClearHistory}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition"
                  title="Clear history logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((item, idx) => {
                  const dateStr = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const isSelected = selectedResult?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedResult(item)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/80 border-emerald-500/40 shadow-inner' 
                          : 'bg-slate-900/20 border-slate-800 hover:border-slate-700/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {dateStr}
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {item.riskLevel}
                        </div>
                      </div>
                      <span className={`text-base font-mono font-bold ${getScoreColorClass(item.overallScore)}`}>
                        {item.overallScore}
                      </span>
                    </button>
                  );
                }).reverse()}
              </div>
            </div>

            {/* Current Selected Score Summary Card */}
            {selectedResult && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 text-center space-y-6 flex flex-col items-center">
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">Composite Score</span>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG Radial Gauge */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#emeraldGradient)"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * selectedResult.overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold font-mono tracking-tight text-slate-100">
                        {selectedResult.overallScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">OF 100</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <div className={`py-1.5 px-3 rounded-full text-xs font-semibold border inline-block ${getRiskColor(selectedResult.riskLevel)}`}>
                    {selectedResult.riskLevel} Tier
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    A composite representation combining standardized psychometrics, facial expression, and acoustic frequency spectrum.
                  </p>
                </div>

                {/* Behavioral indicators checklist */}
                <div className="w-full pt-4 border-t border-slate-800/80 text-left space-y-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider block">Signal Telemetry Extraction</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                    <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Smile Int:</span>
                      <span className="font-bold text-emerald-400">{selectedResult.behavioralCues.smileIntensity}%</span>
                    </div>
                    <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Eye Open:</span>
                      <span className="font-bold text-emerald-400">{selectedResult.behavioralCues.eyeOpenness}%</span>
                    </div>
                    <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Speech Rate:</span>
                      <span className="font-bold text-emerald-400">{selectedResult.behavioralCues.speakingSpeed}</span>
                    </div>
                    <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Blinks:</span>
                      <span className="font-bold text-emerald-400">{selectedResult.behavioralCues.blinkRate}/m</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* MIDDLE & RIGHT PANEL: Graphical charts, Explainability & Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section: Timeline and Emotions Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Well-being Score Trend over Time */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-3">
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Score Timeline
                </h3>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#scoreArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Emotion breakdown bar chart */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-3">
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  Detected Emotions
                </h3>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {emotionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Section: Explainable AI & Detailed Report */}
            {selectedResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Explainable AI (SHAP weights) */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-teal-400 animate-pulse" />
                      Explainable AI (Fusion Weights)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      A visual representation showing the relative mathematical weight each source module contributed to your composite score.
                    </p>
                  </div>
                  <div className="w-full h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={explainabilityData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis type="number" stroke="#64748b" fontSize={9} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={8} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                        <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={10}>
                          {explainabilityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sentiment & Verbal linguistics summary */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Linguistic Sentiment
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500">Linguistic Sentiment:</span>
                      <span className={`text-xs font-bold ${
                        selectedResult.sentimentAnalysis.sentiment === 'Positive' ? 'text-emerald-400' :
                        (selectedResult.sentimentAnalysis.sentiment === 'Negative' ? 'text-red-400' : 'text-slate-300')
                      }`}>
                        {selectedResult.sentimentAnalysis.sentiment}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-semibold font-mono text-slate-500">DEPRESSION/ANXIETY WORD MARKERS DETECTED:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedResult.sentimentAnalysis.indicatorsDetected.length > 0 ? (
                          selectedResult.sentimentAnalysis.indicatorsDetected.map((indicator, idx) => (
                            <span key={idx} className="text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/15 px-2 py-0.5 rounded">
                              {indicator}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded">
                            No major distress triggers
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/20 rounded-xl border border-slate-800/50">
                      <span className="text-[9px] font-semibold font-mono text-slate-500 uppercase block mb-1">Journal Extract</span>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 italic">
                        &ldquo;{selectedResult.sentimentAnalysis.transcriptSummary}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Detailed Clinical Analysis */}
            {selectedResult && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Talk2Mind Clinical Screening Synthesis</h3>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 font-serif text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {selectedResult.detailedAnalysis}
                </div>
              </div>
            )}

            {/* Personalized Recommendations */}
            {selectedResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    Personalized Recommendation Engine
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">2 Recommended Protocols</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedResult.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700/60 transition rounded-3xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                            rec.type === 'breathing' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            (rec.type === 'meditation' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400')
                          }`}>
                            {rec.type.toUpperCase()}
                          </span>
                          {rec.duration && (
                            <span className="text-[10px] font-mono text-slate-500">{rec.duration}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">{rec.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                      </div>

                      {rec.type === 'breathing' && (
                        <button
                          onClick={onTriggerBreathing}
                          className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 hover:border-transparent text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Open Breathing Exercise
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
