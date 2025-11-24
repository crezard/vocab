import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BookOpen, BrainCircuit, Sparkles, Loader2, Search, GraduationCap, Volume2, ChevronDown, ChevronUp, CheckCircle2, XCircle, RefreshCcw, ArrowRight } from 'lucide-react';

// --- TYPES ---

export interface Word {
  term: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  pronunciation?: string; 
}

export enum AppMode {
  LEARN = 'LEARN',
  QUIZ = 'QUIZ',
}

export enum Difficulty {
  GRADE_1 = 'Grade 1 (초1-2 수준)',
  GRADE_2 = 'Grade 2 (초3-4 수준)',
  GRADE_3 = 'Grade 3 (초5-6 수준)',
}

export type Topic = 
  | "Daily Life"
  | "School"
  | "Travel"
  | "Science"
  | "Emotions"
  | "Food"
  | "Hobbies";

// --- AUDIO UTILS ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- GEMINI SERVICE ---

// Initialize AI with the key from window.process (polyfilled in index.html)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
}

const generateWordList = async (topic: Topic, level: string): Promise<Word[]> => {
  try {
    if (!process.env.API_KEY) {
        alert("API Key is missing. Please add it to index.html");
        return [];
    }
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

const playPronunciation = async (text: string) => {
  try {
    if (!process.env.API_KEY) {
        alert("API Key is missing.");
        return;
    }
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

// --- COMPONENTS ---

// 1. WordCard Component
interface WordCardProps {
  word: Word;
  index: number;
}

const WordCard: React.FC<WordCardProps> = ({ word, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    await playPronunciation(word.term);
    setIsPlaying(false);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-2 ring-brand-500 ring-opacity-50' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5 flex items-center justify-between">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {word.partOfSpeech}
                </span>
                {word.pronunciation && (
                    <span className="text-slate-400 text-sm font-mono">{word.pronunciation}</span>
                )}
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{word.term}</h3>
        </div>
        
        <button 
          onClick={handlePlay}
          className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${isPlaying ? 'text-brand-500 animate-pulse' : 'text-slate-500'}`}
          title="Listen"
        >
          <Volume2 size={24} />
        </button>
      </div>

      <div className={`px-5 pb-5 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pb-0'}`}>
        <div className="pt-2 border-t border-slate-100">
            <p className="text-lg font-medium text-slate-900 mb-2">
                {word.definition}
            </p>
            <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-600 text-sm italic">
                    "{word.example}"
                </p>
            </div>
        </div>
      </div>

      <div className="bg-slate-50 px-5 py-1 flex justify-center border-t border-slate-100">
          {isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
      </div>
    </div>
  );
};

// 2. QuizMode Component
interface QuizModeProps {
  words: Word[];
  onExit: () => void;
}

const QuizMode: React.FC<QuizModeProps> = ({ words, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Create quiz questions - shuffle options
  const questions = useMemo(() => {
    return words.map((targetWord) => {
      const otherWords = words.filter(w => w.term !== targetWord.term);
      // Pick 3 random distractors
      const distractors = otherWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.definition);
      
      const options = [...distractors, targetWord.definition].sort(() => 0.5 - Math.random());
      
      return {
        word: targetWord,
        options,
        correctAnswer: targetWord.definition
      };
    });
  }, [words]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent double guessing

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const percentage = Math.round((score / words.length) * 100);
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center animate-fade-in">
        <div className="mb-6 flex justify-center">
            {percentage >= 80 ? (
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 size={48} />
                </div>
            ) : (
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                    <RefreshCcw size={48} />
                </div>
            )}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-slate-500 mb-6">You scored {score} out of {words.length}</p>
        
        <div className="text-5xl font-black text-brand-600 mb-8">{percentage}%</div>
        
        <button 
          onClick={onExit}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Question {currentIndex + 1} / {words.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <div 
            className="bg-brand-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6 text-center">
        <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            {currentQuestion.word.partOfSpeech}
        </span>
        <h2 className="text-4xl font-extrabold text-slate-800 mb-8">
            {currentQuestion.word.term}
        </h2>

        <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, idx) => {
                let btnClass = "p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium ";
                
                if (selectedAnswer) {
                    if (option === currentQuestion.correctAnswer) {
                        btnClass += "border-green-500 bg-green-50 text-green-700";
                    } else if (option === selectedAnswer) {
                        btnClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                        btnClass += "border-slate-100 text-slate-400 opacity-50";
                    }
                } else {
                    btnClass += "border-slate-100 hover:border-brand-300 hover:bg-brand-50 text-slate-700";
                }

                return (
                    <button 
                        key={idx}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selectedAnswer}
                        className={btnClass}
                    >
                        {option}
                        {selectedAnswer && option === currentQuestion.correctAnswer && (
                            <CheckCircle2 className="inline ml-2 float-right text-green-600" size={20}/>
                        )}
                        {selectedAnswer && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                            <XCircle className="inline ml-2 float-right text-red-600" size={20}/>
                        )}
                    </button>
                )
            })}
        </div>
      </div>

      {/* Next Button */}
      {selectedAnswer && (
        <div className="flex justify-end animate-bounce-small">
            <button 
                onClick={nextQuestion}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
                {currentIndex === words.length - 1 ? 'Finish' : 'Next Question'}
                <ArrowRight size={20} />
            </button>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

const TOPICS: Topic[] = ["Daily Life", "School", "Travel", "Science", "Emotions", "Food", "Hobbies"];
const DIFFICULTIES = Object.values(Difficulty);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LEARN);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic>("School");
  const [selectedLevel, setSelectedLevel] = useState<string>(Difficulty.GRADE_1);

  // Initial load
  useEffect(() => {
    // Only generate if we have an API key, otherwise wait for user action
    if (process.env.API_KEY) {
        handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    if (!process.env.API_KEY) {
        alert("Please set your API_KEY in index.html to use this app.");
        return;
    }
    setLoading(true);
    setMode(AppMode.LEARN); 
    const newWords = await generateWordList(selectedTopic, selectedLevel);
    setWords(newWords);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600">
            <GraduationCap size={28} />
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 hidden sm:block">
              Vocab<span className="text-brand-600">Master</span>
            </h1>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMode(AppMode.LEARN)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                mode === AppMode.LEARN 
                ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">Learn</span>
            </button>
            <button
              onClick={() => {
                if(words.length > 0) setMode(AppMode.QUIZ);
              }}
              disabled={words.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                mode === AppMode.QUIZ 
                ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200' 
                : 'text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <BrainCircuit size={18} />
              <span className="hidden sm:inline">Quiz</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Controls Section */}
        {mode === AppMode.LEARN && (
          <section className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Topic</label>
                <select 
                  value={selectedTopic} 
                  onChange={(e) => setSelectedTopic(e.target.value as Topic)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Level</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? 'Generating...' : 'Generate New Words'}
              </button>
            </div>
          </section>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <Loader2 size={48} className="animate-spin text-brand-500 mb-4" />
             <p className="font-medium animate-pulse">Asking Gemini for the best words...</p>
          </div>
        ) : (
          <>
            {mode === AppMode.LEARN && (
                <>
                    {words.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No words generated yet. Select a topic and click Generate!</p>
                            {!process.env.API_KEY && (
                                <p className="text-red-400 text-sm mt-4 bg-red-50 inline-block px-4 py-2 rounded-lg">
                                    ⚠️ Please add your Gemini API Key in index.html to start.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {words.map((word, idx) => (
                                <WordCard key={`${word.term}-${idx}`} word={word} index={idx} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {mode === AppMode.QUIZ && words.length > 0 && (
                <QuizMode words={words} onExit={() => setMode(AppMode.LEARN)} />
            )}
          </>
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>© 2024 VocabMaster. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);