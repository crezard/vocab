import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word, Topic, Difficulty } from "../types";
import { decode, decodeAudioData } from "./audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Context Singleton to prevent multiple contexts
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
}

export const generateWordList = async (topic: Topic, level: string): Promise<Word[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 10 English vocabulary words suitable for Middle School students (Level: ${level}) related to the topic "${topic}". 
      Include the English word, Korean definition, a simple example sentence in English, and the part of speech.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING, description: "Korean meaning" },
              example: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              pronunciation: { type: Type.STRING, description: "Phonetic spelling e.g. /æpəl/" }
            },
            required: ["term", "definition", "example", "partOfSpeech"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as Word[];
  } catch (error) {
    console.error("Error generating word list:", error);
    return [];
  }
};

export const playPronunciation = async (text: string) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error("No audio data returned");
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      ctx,
      24000,
      1,
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

  } catch (error) {
    console.error("Error playing audio:", error);
    alert("오디오 재생 중 오류가 발생했습니다.");
  }
};