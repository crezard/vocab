import React, { useState } from 'react';
import { Word } from '../types.ts';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { playPronunciation } from '../services/gemini.ts';

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

export default WordCard;