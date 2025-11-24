import React, { useState, useEffect, useMemo } from 'react';
import { Word } from '../types.ts';
import { CheckCircle2, XCircle, RefreshCcw, ArrowRight } from 'lucide-react';

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

export default QuizMode;