import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 audio and camera images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Helper to initialize Gemini safely when needed
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Check API key availability
app.get("/api/health", (req, res) => {
  const apiKeyExists = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    apiKeyConfigured: apiKeyExists,
    time: new Date().toISOString()
  });
});

// Primary Endpoint: Multimodal Assessment Fusion
app.post("/api/analyze-multimodal", async (req, res) => {
  const { facialFrame, audioBase64, transcript, questionnaireScores } = req.body;
  const aiClient = getGeminiClient();

  if (!aiClient) {
    console.log("GEMINI_API_KEY not configured or placeholder. Falling back to robust clinical simulation.");
    // Generate an extremely high-quality, realistic, mathematically consistent simulation based on questionnaire scores
    const { phq9 = 0, gad7 = 0, pss = 0 } = questionnaireScores || {};
    
    // Calculate a realistic mental well-being score (0-100)
    // PHQ-9 range: 0-27 (lower is better, weight = 1.3)
    // GAD-7 range: 0-21 (lower is better, weight = 1.5)
    // PSS range: 0-16 (lower is better, weight = 1.8)
    const depressionPct = Math.min(100, (phq9 / 27) * 100);
    const anxietyPct = Math.min(100, (gad7 / 21) * 100);
    const stressPct = Math.min(100, (pss / 16) * 100);
    
    const combinedDistress = (depressionPct * 0.4) + (anxietyPct * 0.35) + (stressPct * 0.25);
    const overallScore = Math.round(100 - combinedDistress);

    let riskLevel: 'Healthy' | 'Mild Stress' | 'Moderate Anxiety' | 'High Stress' | 'High Risk' = 'Healthy';
    if (overallScore < 40) riskLevel = 'High Risk';
    else if (overallScore < 55) riskLevel = 'High Stress';
    else if (overallScore < 70) riskLevel = 'Moderate Anxiety';
    else if (overallScore < 85) riskLevel = 'Mild Stress';

    // Build matching emotions
    const sadnessVal = Math.round(combinedDistress * 0.45);
    const anxiousVal = Math.round(combinedDistress * 0.35);
    const angryVal = Math.round(combinedDistress * 0.1);
    const fearVal = Math.round(combinedDistress * 0.1);
    const neutralVal = Math.max(5, Math.round(overallScore * 0.8));
    const happyVal = Math.max(2, Math.round(overallScore * 0.2));
    
    const sum = sadnessVal + anxiousVal + angryVal + fearVal + neutralVal + happyVal;
    const emotions = {
      happy: Math.round((happyVal / sum) * 100),
      sad: Math.round((sadnessVal / sum) * 100),
      angry: Math.round((angryVal / sum) * 100),
      fear: Math.round((fearVal / sum) * 100),
      neutral: Math.round((neutralVal / sum) * 100),
      anxious: Math.round((anxiousVal / sum) * 100)
    };

    const details = `[SIMULATED RESPONSE - Key not set] Questionnaire results indicate a ${riskLevel.toLowerCase()} profile. Depression score (PHQ-9) is ${phq9}/27, Anxiety score (GAD-7) is ${gad7}/21, and Perceived Stress (PSS) is ${pss}/16. In a real environment, your facial landmarks and voice acoustics would be fused dynamically with these psychometric markers. Standard recommenders suggest engaging in target cognitive-behavioral or calming routines.`;

    const result = {
      id: "sim_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      overallScore,
      riskLevel,
      emotions,
      behavioralCues: {
        eyeOpenness: phq9 > 15 ? 72 : 88,
        smileIntensity: phq9 > 12 ? 15 : 68,
        speakingSpeed: phq9 > 10 ? 'Slow' : 'Normal',
        voiceEnergy: gad7 > 12 ? 'High' : 'Normal',
        blinkRate: pss > 10 ? 22 : 14,
      },
      sentimentAnalysis: {
        sentiment: combinedDistress > 50 ? 'Negative' : (combinedDistress > 25 ? 'Neutral' : 'Positive'),
        indicatorsDetected: phq9 > 10 ? ["Social withdrawal", "Loss of interest", "Low energy"] : ["Mild fatigue"],
        transcriptSummary: transcript || "Self-guided verbal expression completed during session."
      },
      explainability: {
        questionnaire: 50,
        facialExpressions: 15,
        speechAcoustics: 15,
        speechContent: 20
      },
      recommendations: [
        {
          title: "Guided Diaphragmatic Breathing",
          description: "Follow the interactive 4-7-8 breathing circle on your dashboard to downregulate your sympathetic nervous system.",
          type: "breathing",
          duration: "5 mins"
        },
        {
          title: phq9 > 10 ? "Cognitive Restructuring Journal" : "Daily Mindful Walk",
          description: phq9 > 10 
            ? "Write down automatic negative thoughts and challenge them with balanced evidence." 
            : "Engage in a 15-minute screen-free walk, paying close attention to visual and tactile details.",
          type: phq9 > 10 ? "cognitive" : "meditation",
          duration: "15 mins"
        }
      ],
      detailedAnalysis: details
    };

    return res.json({ result, simulated: true });
  }

  try {
    // We have a real Gemini client.
    console.log("Analyzing multimodal mental well-being with Gemini API.");

    // Build the request contents. We'll send the prompt text, the facial image, and the voice file.
    const parts: any[] = [];

    // Let's create a solid prompt detailing the input parameters
    const promptText = `
Analyze the following multimodal session indicators for mental well-being assessment:
1. Questionnaire psychometrics:
   - PHQ-9 (Depression, Range 0-27): ${questionnaireScores?.phq9 ?? "Not Taken"}
   - GAD-7 (Anxiety, Range 0-21): ${questionnaireScores?.gad7 ?? "Not Taken"}
   - PSS (Stress, Range 0-16): ${questionnaireScores?.pss ?? "Not Taken"}
2. Optional Speech transcript: "${transcript ?? "Not provided"}"
3. Analyze the attached video snapshot (if present) for facial expressions, gaze, eye state, head posture, smile, and micro-expressions.
4. Analyze the attached speech audio (if present) for acoustical characteristics such as pitch stability, loudness variation, tone (sad, energetic, monotone), and speech pacing.

Please combine (fuse) all these inputs to predict a mental wellness summary.
Formulate a robust, compassionate clinical screening score (0-100 where 100 is absolute serene well-being and 0 is extreme distress) and corresponding risk level.
Return your response strictly in JSON format according to the requested schema.
`;

    parts.push({ text: promptText });

    // Append webcam frame if present
    if (facialFrame && facialFrame.includes("base64,")) {
      const mime = facialFrame.split(';')[0].split(':')[1];
      const base64Data = facialFrame.split('base64,')[1];
      parts.push({
        inlineData: {
          mimeType: mime || "image/jpeg",
          data: base64Data
        }
      });
    }

    // Append voice audio if present
    if (audioBase64 && audioBase64.includes("base64,")) {
      const mime = audioBase64.split(';')[0].split(':')[1];
      const base64Data = audioBase64.split('base64,')[1];
      parts.push({
        inlineData: {
          mimeType: mime || "audio/webm",
          data: base64Data
        }
      });
    }

    // Define response schema to enforce typings
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        overallScore: {
          type: Type.INTEGER,
          description: "A composite mental well-being score between 0 and 100, where 100 is optimal/perfect mental state, and lower means higher stress/anxiety/burnout."
        },
        riskLevel: {
          type: Type.STRING,
          description: "Must be exactly one of: 'Healthy', 'Mild Stress', 'Moderate Anxiety', 'High Stress', 'High Risk'"
        },
        emotions: {
          type: Type.OBJECT,
          description: "Percentage breakdown of emotions detected (values must sum to approximately 100)",
          properties: {
            happy: { type: Type.INTEGER },
            sad: { type: Type.INTEGER },
            angry: { type: Type.INTEGER },
            fear: { type: Type.INTEGER },
            neutral: { type: Type.INTEGER },
            anxious: { type: Type.INTEGER }
          },
          required: ["happy", "sad", "angry", "fear", "neutral", "anxious"]
        },
        behavioralCues: {
          type: Type.OBJECT,
          description: "Quantitative indices extracted from physical video/audio signals",
          properties: {
            eyeOpenness: { type: Type.INTEGER, description: "Eye openness level 0-100" },
            smileIntensity: { type: Type.INTEGER, description: "Smile intensity 0-100" },
            speakingSpeed: { type: Type.STRING, description: "Speed of speech: 'Slow', 'Normal', or 'Fast'" },
            voiceEnergy: { type: Type.STRING, description: "Loudness/Energy level: 'Low', 'Medium', or 'High'" },
            blinkRate: { type: Type.INTEGER, description: "Blinks per minute" }
          },
          required: ["eyeOpenness", "smileIntensity", "speakingSpeed", "voiceEnergy", "blinkRate"]
        },
        sentimentAnalysis: {
          type: Type.OBJECT,
          description: "Analysis of transcript linguistic content",
          properties: {
            sentiment: { type: Type.STRING, description: " Labeled as 'Positive', 'Neutral', or 'Negative'" },
            indicatorsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "E.g., 'Depressive speech content', 'Social isolation cues', 'High anxiety vocabulary'"
            },
            transcriptSummary: { type: Type.STRING, description: "Brief elegant summary of what the user talked about." }
          },
          required: ["sentiment", "indicatorsDetected", "transcriptSummary"]
        },
        explainability: {
          type: Type.OBJECT,
          description: "Percentage weights of what contributed to this score (must sum to 100)",
          properties: {
            questionnaire: { type: Type.INTEGER, description: "PHQ/GAD contribution percent" },
            facialExpressions: { type: Type.INTEGER, description: "Camera/video contribution percent" },
            speechAcoustics: { type: Type.INTEGER, description: "Acoustics contribution percent" },
            speechContent: { type: Type.INTEGER, description: "Transcript text content contribution percent" }
          },
          required: ["questionnaire", "facialExpressions", "speechAcoustics", "speechContent"]
        },
        recommendations: {
          type: Type.ARRAY,
          description: "Personalized support exercises and recommendations",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, description: "One of: 'breathing', 'meditation', 'cognitive', 'sleep', 'clinical'" },
              duration: { type: Type.STRING, description: "E.g. '10 mins'" }
            },
            required: ["title", "description", "type"]
          }
        },
        detailedAnalysis: {
          type: Type.STRING,
          description: "Compassionate, professional clinical assessment report detailing the user's emotional state, fusion reasoning, and supportive next steps. Address the user directly and warmly."
        }
      },
      required: [
        "overallScore",
        "riskLevel",
        "emotions",
        "behavioralCues",
        "sentimentAnalysis",
        "explainability",
        "recommendations",
        "detailedAnalysis"
      ]
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction: `You are Talk2Mind, a state-of-the-art multimodal clinical fusion model for screening and monitoring mental well-being.
Combine psychometrics (PHQ-9 for Depression, GAD-7 for Anxiety, PSS for Stress), facial expression cues (if present in frame), and voice acoustics (if present) to formulate a holistic, compassionate screening.
Your report MUST be scientific, professional, and explainable, yet written with deep warmth and validation.
Always return valid JSON adhering strictly to the responseSchema provided. Never include Markdown formatting in your JSON, just the raw JSON string.`,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const parsed = JSON.parse(text);
    // Ensure ID and timestamp exist
    parsed.id = "assess_" + Math.random().toString(36).substr(2, 9);
    parsed.timestamp = new Date().toISOString();

    res.json({ result: parsed, simulated: false });

  } catch (error: any) {
    console.error("Gemini Multi-modal assessment error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze multimodal session data." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Talk2Mind Server successfully running on http://localhost:${PORT}`);
  });
}

startServer();
