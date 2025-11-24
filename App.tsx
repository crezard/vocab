import React, { useState, useEffect } from 'react';
import { BookOpen, BrainCircuit, Sparkles, Loader2, Search, GraduationCap } from 'lucide-react';
import { Word, AppMode, Topic, Difficulty } from './types.ts';
import { generateWordList } from './services/gemini.ts';
import WordCard from './components/WordCard.tsx';
import QuizMode from './components/QuizMode.tsx';

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
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setMode(AppMode.LEARN); // Switch back to list when generating new
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
        
        {/* Controls Section (only show in Learn mode or if empty) */}
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

export default App;