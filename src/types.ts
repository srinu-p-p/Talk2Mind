export interface QuestionnaireScores {
  phq9: number; // Depression (0-27)
  gad7: number; // Anxiety (0-21)
  pss: number;  // Stress (0-16 or 0-40, let's use 4 questions: 0-16)
}

export interface EmotionBreakdown {
  happy: number;
  sad: number;
  angry: number;
  fear: number;
  neutral: number;
  anxious: number;
}

export interface ExplainabilityWeights {
  questionnaire: number; // Percentage contribution (e.g. 35)
  facialExpressions: number; // Percentage contribution (e.g. 25)
  speechAcoustics: number; // Percentage contribution (e.g. 20)
  speechContent: number; // Percentage contribution (e.g. 20)
}

export interface AssessmentResult {
  id: string;
  timestamp: string;
  overallScore: number; // 0-100 (higher = better mental well-being)
  riskLevel: 'Healthy' | 'Mild Stress' | 'Moderate Anxiety' | 'High Stress' | 'High Risk';
  emotions: EmotionBreakdown;
  behavioralCues: {
    eyeOpenness: number; // 0-100
    smileIntensity: number; // 0-100
    speakingSpeed: string; // 'Slow' | 'Normal' | 'Fast'
    voiceEnergy: string; // 'Low' | 'Medium' | 'High'
    blinkRate: number; // blinks/min
  };
  sentimentAnalysis: {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    indicatorsDetected: string[];
    transcriptSummary: string;
  };
  explainability: ExplainabilityWeights;
  recommendations: {
    title: string;
    description: string;
    type: 'breathing' | 'meditation' | 'cognitive' | 'sleep' | 'clinical';
    duration?: string;
  }[];
  detailedAnalysis: string;
}

export interface SessionHistory {
  assessments: AssessmentResult[];
}
