import React from 'react';
import type { ComparisonResult } from '@/types';
import { ArrowUpRight, TrendingDown, Sparkles } from 'lucide-react';

interface ResultDisplayProps {
  expectedText: string;
  result: ComparisonResult;
  masteryDelta: number;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  expectedText,
  result,
  masteryDelta,
}) => {
  const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const { accuracy, matchedWords, replacedWords, extraWords } = result;

  // Set colors based on accuracy score
  const getScoreColor = (score: number) => {
    if (score >= 90) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
    if (score >= 70) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' };
    return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' };
  };

  const scoreTheme = getScoreColor(accuracy);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="w-full flex flex-col items-center gap-6 p-6 border rounded-2xl bg-card shadow-sm select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpBounce {
          0% { transform: translateY(15px); opacity: 0; }
          60% { transform: translateY(-3px); opacity: 1; }
          100% { transform: translateY(0); }
        }
        .mastery-badge {
          animation: slideUpBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      {/* Accuracy SVG Donut & Mastery Delta */}
      <div className="flex items-center justify-center gap-8 w-full">
        {/* SVG Donut */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-muted/20 dark:text-muted/10"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={scoreTheme.stroke}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black tracking-tight">{accuracy}%</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">الدقة</span>
          </div>
        </div>

        {/* Mastery Delta Animation */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground font-semibold">مستوى الحفظ والإتقان</span>
          <div className="flex items-center gap-2">
            <div className={`mastery-badge flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm ${
              masteryDelta >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
            }`}>
              {masteryDelta >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+{masteryDelta} نقطة إتقان</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>{masteryDelta} نقطة إتقان</span>
                </>
              )}
            </div>
            {accuracy >= 90 && (
              <span className="mastery-badge delay-150 text-amber-500 animate-bounce">
                <Sparkles className="w-5 h-5 fill-current" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Word-by-word visualizer */}
      <div className="w-full border-t pt-5 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-muted-foreground text-right w-full">تحليل النطق والكلمات:</h3>

        <div className="flex flex-wrap flex-row-reverse gap-x-3 gap-y-4 justify-start w-full text-right font-arabic leading-relaxed text-2xl select-text">
          {expectedWords.map((word, idx) => {
            // Check if matched
            const isMatched = matchedWords.some(m => m.expectedIndex === idx);
            if (isMatched) {
              return (
                <span key={`w-${idx}`} className="text-emerald-600 dark:text-emerald-400 font-semibold transition-colors duration-300">
                  {word}
                </span>
              );
            }

            // Check if replaced
            const replacement = replacedWords.find(r => r.expectedIndex === idx);
            if (replacement) {
              return (
                <span key={`w-${idx}`} className="relative group flex flex-col items-center">
                  <span className="text-red-500 dark:text-red-400 font-semibold line-through decoration-red-600/50 cursor-pointer decoration-2">
                    {word}
                  </span>
                  <span className="absolute -top-7 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow-sm opacity-90 transition-opacity whitespace-nowrap">
                    نطقت: {replacement.actual}
                  </span>
                </span>
              );
            }

            // Otherwise, it is missing (gray)
            return (
              <span key={`w-${idx}`} className="text-muted-foreground/50 dark:text-muted-foreground/30 font-normal line-through decoration-muted-foreground/30">
                {word}
              </span>
            );
          })}
        </div>

        {/* Extra Words Section */}
        {extraWords.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 bg-yellow-50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-950/30 p-3.5 rounded-xl text-right">
            <span className="text-xs text-yellow-800 dark:text-yellow-500 font-bold">كلمات زائدة مسموعة:</span>
            <div className="flex flex-wrap flex-row-reverse gap-2 text-yellow-700 dark:text-yellow-400 font-arabic text-lg">
              {extraWords.map((word, idx) => (
                <span key={`extra-${idx}`} className="bg-yellow-100/60 dark:bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-200/50">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
