'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Book, Verse, ComparisonResult } from '@/types';
import { useRecitationEngine } from '../engine/useRecitationEngine';
import type { WordState } from '../engine/state-machine';
import { audioFeedback } from '../utils/audio';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  X, Mic, Square, Eye, EyeOff, RotateCcw,
  Sparkles, Check, HelpCircle, ChevronRight,
  Volume2, VolumeX, AlertTriangle,
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RecitationInterfaceProps {
  book: Book;
  verses: Verse[];
  results: Record<number, ComparisonResult>;
  onResultSave: (index: number, result: ComparisonResult | null) => void;
  onFinishSession: (finalResults: Record<number, ComparisonResult>) => void;
  onExit: () => void;
}

// ─── Word Component ──────────────────────────────────────────────────────────

const WORD_STYLES: Record<string, string> = {
  waiting: 'text-muted-foreground/40 transition-colors duration-200',
  listening: 'text-blue-500 dark:text-blue-400 font-semibold animate-pulse transition-colors duration-200',
  correct: 'text-emerald-600 dark:text-emerald-400 font-semibold transition-colors duration-300',
  incorrect: 'text-red-500 dark:text-red-400 font-semibold line-through decoration-red-500/60 decoration-2 transition-colors duration-300',
  missed: 'text-amber-500 dark:text-amber-400 font-semibold line-through decoration-amber-400/50 decoration-1 transition-colors duration-300',
};

function WordToken({
  state,
  isHidden,
}: {
  state: WordState;
  isHidden: boolean;
}) {
  // Punctuation: always show as correct
  if (state.isPunctuation) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        {state.text}
      </span>
    );
  }

  // Hidden word (not yet reached + words hidden)
  if (isHidden && (state.status === 'waiting' || state.status === 'listening')) {
    return (
      <span
        className="relative inline-flex flex-col items-center justify-center mx-1 transition-all duration-300"
        title="كلمة مخفية"
      >
        <span className="opacity-0">{state.text}</span>
        <span className={`absolute bottom-1 w-[90%] h-3 rounded-md ${
          state.status === 'listening'
            ? 'bg-blue-400/30 animate-pulse'
            : 'bg-muted-foreground/20'
        }`} />
      </span>
    );
  }

  // Incorrect word with tooltip showing what was spoken
  if (state.status === 'incorrect' && state.spokenWord) {
    return (
      <span className="relative group flex flex-col items-center">
        <span className={WORD_STYLES.incorrect}>
          {state.text}
        </span>
        <span className="absolute -top-7 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-sans">
          نطقت: {state.spokenWord}
        </span>
      </span>
    );
  }

  // All other states: apply style directly
  return (
    <span className={WORD_STYLES[state.status] || WORD_STYLES.waiting}>
      {state.text}
    </span>
  );
}

// ─── Verse Card Component ────────────────────────────────────────────────────

function VerseCard({
  verse,
  verseIndex,
  wordStates,
  isActive,
  showWords,
  revealedCount,
  activeRef,
}: {
  verse: Verse;
  verseIndex: number;
  wordStates: WordState[];
  isActive: boolean;
  showWords: boolean;
  revealedCount: number;
  activeRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Compute verse-level status
  const verseStatus = useMemo(() => {
    const meaningful = wordStates.filter((w) => !w.isPunctuation);
    if (meaningful.length === 0) return 'pending';

    const allWaiting = meaningful.every((w) => w.status === 'waiting');
    if (allWaiting) return 'pending';

    const allDone = meaningful.every(
      (w) => w.status === 'correct' || w.status === 'incorrect' || w.status === 'missed'
    );
    if (allDone) return 'completed';

    return 'active';
  }, [wordStates]);

  // Compute verse accuracy
  const accuracy = useMemo(() => {
    const meaningful = wordStates.filter((w) => !w.isPunctuation);
    const evaluated = meaningful.filter(
      (w) => w.status === 'correct' || w.status === 'incorrect' || w.status === 'missed'
    );
    if (evaluated.length === 0) return null;
    const correct = evaluated.filter((w) => w.status === 'correct').length;
    return Math.round((correct / evaluated.length) * 100);
  }, [wordStates]);

  const isCompleted = verseStatus === 'completed';

  // Determine which words should be hidden
  const shouldHideWord = (wordState: WordState, wordIndex: number): boolean => {
    if (showWords) return false;
    if (wordState.isPunctuation) return false;
    if (wordState.status === 'correct' || wordState.status === 'incorrect' || wordState.status === 'missed') {
      return false; // Already evaluated — always show
    }
    // Count meaningful words before this index to compare with revealedCount
    const meaningfulBefore = wordStates
      .slice(0, wordIndex)
      .filter((w) => !w.isPunctuation).length;
    return meaningfulBefore >= revealedCount;
  };

  return (
    <div
      ref={isActive ? activeRef : null}
      className={`p-5 md:p-6 border rounded-2xl bg-card shadow-xs transition-all duration-300 relative overflow-hidden flex flex-col gap-4 ${
        isActive
          ? 'border-primary ring-2 ring-primary/20 shadow-md scale-[1.01] bg-primary/2 dark:bg-primary/5'
          : isCompleted
            ? 'border-emerald-200/50 bg-emerald-50/5 dark:border-emerald-950/20 dark:bg-emerald-950/2'
            : 'border-muted opacity-60'
      }`}
    >
      {/* Card Meta Header */}
      <div className="flex justify-between items-center">
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            isActive
              ? 'bg-primary/10 border-primary text-primary animate-pulse'
              : isCompleted
                ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          البيت {verse.order}
        </span>

        {/* Score badge for completed verses */}
        {isCompleted && accuracy !== null && (
          <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
            دقة الحفظ: {accuracy}%
          </span>
        )}

        {/* Active indicator */}
        {isActive && !isCompleted && (
          <span className="text-[11px] font-bold text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            جاري الاستماع...
          </span>
        )}
      </div>

      {/* Verse Words */}
      <div className="text-center py-2 min-h-[60px] flex items-center justify-center">
        <p className="text-2xl md:text-3xl font-bold font-arabic leading-loose text-center flex flex-wrap flex-row justify-center gap-x-2.5 gap-y-3 select-text" dir="rtl">
          {wordStates.map((ws, idx) => (
            <WordToken
              key={`${verseIndex}-${idx}`}
              state={ws}
              isHidden={shouldHideWord(ws, idx)}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const RecitationInterface: React.FC<RecitationInterfaceProps> = ({
  book,
  verses,
  onFinishSession,
  onExit,
}) => {
  const engine = useRecitationEngine(verses);
  const activeVerseRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ─── Auto-scroll to active verse ───────────────────────────────────
  useEffect(() => {
    const el = activeVerseRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isNearBottom = rect.bottom > viewportHeight * 0.7;
    const isNotFullyVisible = rect.top < 85 || rect.bottom > viewportHeight - 130;

    if (isNearBottom || isNotFullyVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [engine.currentVerseIndex]);

  // ─── Ensure visible count covers active verse ──────────────────────
  useEffect(() => {
    if (engine.currentVerseIndex + 15 > visibleCount) {
      setVisibleCount((prev) => Math.max(prev, engine.currentVerseIndex + 15));
    }
  }, [engine.currentVerseIndex, visibleCount]);

  // ─── Infinite scroll ──────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        setVisibleCount((prev) => Math.max(prev + 30, verses.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [verses.length]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleFinish = () => {
    if (engine.soundEnabled) audioFeedback.playCompletion();
    engine.stopListening();
    const finalResults = engine.getAllResults();
    onFinishSession(finalResults);
  };

  // ─── Computed values ──────────────────────────────────────────────
  const { stats, currentVerseIndex } = engine;
  const finishedVerses = verses.filter((_, idx) => {
    const verseStates = engine.getVerseStates(idx);
    const meaningful = verseStates.filter((w) => !w.isPunctuation);
    return (
      meaningful.length > 0 &&
      meaningful.every(
        (w) => w.status === 'correct' || w.status === 'incorrect' || w.status === 'missed'
      )
    );
  }).length;

  const progressPercentage = (finishedVerses / verses.length) * 100;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 md:p-6 dir-rtl text-right select-none min-h-[85vh] pb-36 md:pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full border-b pb-4 bg-background/95 backdrop-blur-xs sticky top-0 z-10 pt-2">
        <button
          onClick={onExit}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-all active:scale-95 border"
          aria-label="خروج"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-base font-black text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            {book.title}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            تسميع تفاعلي — كلمة بكلمة
          </span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="flex flex-col gap-3 w-full bg-card border p-4 rounded-2xl shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            الأبيات المكتملة: {finishedVerses} / {verses.length}
          </span>
          <span>
            الكلمات: {stats.correct} ✅ {stats.incorrect} ❌ {stats.missed} ⚠
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-secondary" />
      </div>

      {/* Error Alert */}
      {engine.error && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 text-destructive rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{engine.error}</span>
        </div>
      )}

      {/* Verse Cards */}
      <div className="flex flex-col gap-4 my-2">
        {verses.slice(0, visibleCount).map((verse, idx) => {
          const verseStates = engine.getVerseStates(idx);
          const isActive = idx === currentVerseIndex;

          return (
            <VerseCard
              key={verse.id || idx}
              verse={verse}
              verseIndex={idx}
              wordStates={verseStates}
              isActive={isActive}
              showWords={engine.showWords}
              revealedCount={engine.revealedWords[idx] || 0}
              activeRef={activeVerseRef}
            />
          );
        })}
      </div>

      {/* Floating Bottom Control Panel */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t py-4 px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] z-20 flex flex-col gap-2.5 items-center">
        {/* Helper control bar (Skip / Reveal) */}
        {engine.isListening && (
          <div className="flex items-center justify-center gap-4 w-full max-w-lg mb-1.5 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={engine.revealWord}
              className="flex-1 gap-1.5 text-xs font-bold py-4 border-amber-200/60 bg-amber-50/20 text-amber-700 hover:bg-amber-50 dark:border-amber-950 dark:text-amber-400"
            >
              <HelpCircle className="w-4 h-4" />
              كشف الكلمة التالية
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={engine.skipVerse}
              className="flex-1 gap-1.5 text-xs font-bold py-4 border-red-200/60 bg-red-50/20 text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-400"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              تخطي هذا البيت
            </Button>
          </div>
        )}

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between w-full max-w-lg gap-2 sm:gap-4 px-2">
          {/* Left Buttons */}
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              title={engine.soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
              onClick={engine.toggleSound}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border"
            >
              {engine.soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              title="إعادة ضبط الجلسة"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Center: Main Record/Stop Mic Button */}
          <div className="relative">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @keyframes micPulse {
                    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70%  { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                  }
                  .mic-listening-active {
                    animation: micPulse 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1);
                  }
                `,
              }}
            />
            <button
              onClick={engine.toggleListening}
              className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 transition-all duration-300 outline-none ${
                engine.isListening
                  ? 'bg-red-500 border-red-200 text-white mic-listening-active hover:bg-red-600'
                  : 'bg-primary border-primary/20 text-primary-foreground hover:bg-primary/95 shadow-lg active:scale-95'
              }`}
              title={engine.isListening ? 'إيقاف مؤقت' : 'بدء التسميع'}
            >
              {engine.isListening ? (
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>

          {/* Right Buttons */}
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={engine.toggleShowWords}
              title={engine.showWords ? 'إخفاء كلمات المتن' : 'إظهار كلمات المتن'}
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border ${
                engine.showWords
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20'
                  : ''
              }`}
            >
              {engine.showWords ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>

            <Button
              onClick={handleFinish}
              className="h-10 px-3 sm:h-12 sm:px-5 font-bold rounded-full gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 text-[10px] sm:text-xs"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              إنهاء التسميع
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-muted p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 font-arabic">إعادة ضبط التسميع</h3>
            <p className="text-sm text-muted-foreground mb-6 font-arabic leading-relaxed">
              هل تريد بالتأكيد إعادة بدء جلسة التسميع؟ سيؤدي هذا إلى تصفير التقدم الحالي.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="destructive"
                onClick={() => {
                  engine.reset();
                  setShowResetConfirm(false);
                }}
                className="flex-1 font-bold rounded-xl py-4 text-xs"
              >
                نعم، أعد البدء
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 font-bold rounded-xl py-4 text-xs"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
