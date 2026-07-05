'use client';

import { useState, useMemo } from 'react';
import { Book } from '@/types/book.types';
import { Verse } from '@/types/verse.types';
import { Progress } from '@/types/progress.types';
import { calculateNextReview, createNewCard, toDate, isDueForReview, calculateStreakBonus } from '@/lib/algorithms/spacedRepetition';
import { progressService } from '@/services/firebase/progress.service';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  RefreshCw, 
  Award, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

type StudyMode = 'full' | 'half' | 'hidden';

interface MemorizeViewProps {
  book: Book;
  verses: Verse[];
  initialProgress: Progress[];
  userId: string;
  onExit: () => void;
}

export function MemorizeView({ book, verses, initialProgress: serverProgress, userId, onExit }: MemorizeViewProps) {
  // Local state to track progress items in case server mutation is pending or mock mode
  const [localProgress, setLocalProgress] = useState<Progress[]>(serverProgress);
  const [sessionQueue, setSessionQueue] = useState<Verse[]>([]);
  const [queueType, setQueueType] = useState<'due' | 'new' | 'all' | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('half');

  
  // Daily Streak (mocked or can be fetched from user stats if available)
  const streakCount = 5; // Example streak
  const [streakBonusXP, setStreakBonusXP] = useState<number>(0);

  // Group verses by status
  const queues = useMemo(() => {
    const due: Verse[] = [];
    const newVerses: Verse[] = [];
    
    // Sort verses by order
    const sortedVerses = [...verses].sort((a, b) => a.order - b.order);

    sortedVerses.forEach((verse) => {
      const prog = localProgress.find((p) => p.verseId === verse.id);
      if (!prog) {
        newVerses.push(verse);
      } else {
        const dateObj = toDate(prog.nextReviewDate);
        if (isDueForReview(dateObj)) {
          due.push(verse);
        }
      }
    });

    return { due, newVerses };
  }, [verses, localProgress]);

  // Start a session
  const startSession = (type: 'due' | 'new' | 'all') => {
    let queue: Verse[] = [];
    if (type === 'due') {
      queue = [...queues.due];
    } else if (type === 'new') {
      queue = [...queues.newVerses].slice(0, 10); // Study 10 new verses at a time
    } else {
      queue = [...queues.due, ...queues.newVerses].slice(0, 15); // Mix
    }

    if (queue.length === 0) {
      toast.error('لا توجد أبيات في هذا المسار حالياً.');
      return;
    }

    setSessionQueue(queue);
    setQueueType(type);
    setCurrentIdx(0);
    setIsRevealed(false);
    setStreakBonusXP(0);
  };

  const currentVerse = sessionQueue[currentIdx];

  // Split verse text into Sadr and Ajez by three dots "..."
  const verseParts = useMemo(() => {
    if (!currentVerse) return { sadr: '', ajez: '' };
    
    const parts = currentVerse.text.split(/\s*\.\.\.\s*/);
    if (parts.length >= 2) {
      return { sadr: parts[0], ajez: parts[1] };
    }
    
    // Fallback: split by words
    const words = currentVerse.text.split(/\s+/);
    if (words.length <= 1) {
      return { sadr: currentVerse.text, ajez: '' };
    }
    const mid = Math.ceil(words.length / 2);
    return {
      sadr: words.slice(0, mid).join(' '),
      ajez: words.slice(mid).join(' '),
    };
  }, [currentVerse]);

  // Handle rating submission
  const handleRate = async (accuracy: number) => {
    if (!currentVerse) return;

    const verseId = currentVerse.id;
    const existingProg = localProgress.find((p) => p.verseId === verseId);

    // Initial card state
    const cardState = existingProg ? {
      interval: existingProg.interval,
      easeFactor: existingProg.easeFactor,
      mastery: existingProg.mastery ?? 0,
      nextReviewDate: toDate(existingProg.nextReviewDate),
      lastReviewDate: existingProg.lastReviewDate ? toDate(existingProg.lastReviewDate) : null,
    } : createNewCard();

    // Calculate next review state using adapted SM-2
    const nextCard = calculateNextReview(cardState, accuracy);

    // Prepare updated Progress object for Firestore
    const updatedProg: Progress = {
      id: existingProg?.id || `${userId}_${verseId}`,
      userId,
      bookId: book.id,
      verseId,
      repetition: existingProg ? existingProg.repetition + (accuracy >= 70 ? 1 : 0) : (accuracy >= 70 ? 1 : 0),
      interval: nextCard.interval,
      easeFactor: nextCard.easeFactor,
      mastery: nextCard.mastery,
      nextReviewDate: Timestamp.fromDate(nextCard.nextReviewDate),
      lastReviewDate: Timestamp.fromDate(nextCard.lastReviewDate || new Date()),
      createdAt: existingProg?.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };

    // Update local state immediately for snappy UI
    setLocalProgress((prev) => {
      const idx = prev.findIndex((p) => p.verseId === verseId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedProg;
        return copy;
      }
      return [...prev, updatedProg];
    });

    // Persist to Firestore asynchronously
    if (userId) {
      try {
        await progressService.createOrUpdate(updatedProg);
      } catch (err) {
        console.error('Error saving progress to Firestore:', err);
      }
    }

    // Award streak bonus XP if correct
    if (accuracy >= 70) {
      const baseXP = accuracy >= 90 ? 15 : 10;
      const bonus = calculateStreakBonus(baseXP, streakCount);
      if (bonus > 0) {
        setStreakBonusXP((prev) => prev + bonus);
      }
    }



    // Proceed to next card or finish session
    if (currentIdx < sessionQueue.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setIsRevealed(false);
    } else {
      toast.success('تم الانتهاء من جلسة المراجعة بنجاح! أحسنت.');
      setQueueType(null);
    }
  };

  // Reset progress logic (useful for testing or starting over)
  const handleResetProgress = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط تقدمك في هذا المتن بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const bookProgress = localProgress.filter((p) => p.bookId === book.id);
      for (const prog of bookProgress) {
        if (userId) {
          await progressService.softDelete(prog.id, userId);
        }
      }
      setLocalProgress((prev) => prev.filter((p) => p.bookId !== book.id));
      setQueueType(null);
      toast.success('تمت إعادة ضبط التقدم بنجاح.');
    } catch (err) {
      console.error('Error resetting progress:', err);
      toast.error('حدث خطأ أثناء إعادة ضبط التقدم.');
    }
  };

  // If session not started, show the setup panel
  if (queueType === null) {
    const totalDue = queues.due.length;
    const totalNew = queues.newVerses.length;
    const totalMastered = localProgress.filter((p) => p.bookId === book.id && (p.mastery ?? 0) >= 90).length;

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 dir-rtl text-right">
        {/* Book Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 md:p-8 shadow-md mb-8">
          <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-br-full -z-10" />
          <h1 className="text-3xl font-bold text-foreground mb-2">{book.title}</h1>
          <p className="text-muted-foreground text-sm mb-6">تأليف: {book.author}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/40 p-4 rounded-xl border flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">أبيات المتن</span>
              <span className="text-2xl font-bold text-foreground mt-1">{verses.length} بيتاً</span>
            </div>
            <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 flex flex-col justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400">مستحقة للمراجعة اليوم</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalDue}</span>
            </div>
            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 flex flex-col justify-between">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">أبيات تم إتقانها</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalMastered}</span>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-between">
              <span className="text-xs text-primary font-medium">نسبة إنجاز الحفظ</span>
              <span className="text-2xl font-bold text-primary mt-1">
                {verses.length > 0 ? Math.round(((verses.length - totalNew) / verses.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Modes */}
        <h2 className="text-xl font-bold text-foreground mb-4">اختر مسار الحفظ والاستذكار:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Due Review Card */}
          <div className="bg-card rounded-2xl border hover:border-primary/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <RefreshCw className="h-6 w-6" />
                </span>
                {totalDue > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    نشط
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold mb-2">مراجعة المحفوظ مستحق التكرار</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                مراجعة الأبيات التي حان وقت تكرارها وفق خوارزمية التكرار المتباعد لتثبيت الحفظ في الذاكرة طويلة المدى.
              </p>
            </div>
            <Button 
              onClick={() => startSession('due')} 
              disabled={totalDue === 0}
              className="w-full font-bold"
            >
              ابدأ المراجعة ({totalDue})
            </Button>
          </div>

          {/* New Memorization Card */}
          <div className="bg-card rounded-2xl border hover:border-primary/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Award className="h-6 w-6" />
                </span>
                {totalNew > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2.5 py-0.5 rounded-full font-medium">
                    متاح
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold mb-2">حفظ أبيات جديدة</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                البدء في حفظ أبيات جديدة من المتن بالتسلسل. سنعرض لك 10 أبيات جديدة لدراستها وحفظها في هذه الجلسة.
              </p>
            </div>
            <Button 
              onClick={() => startSession('new')} 
              disabled={totalNew === 0}
              variant="outline"
              className="w-full font-bold border-primary text-primary hover:bg-primary/5"
            >
              ابدأ حفظاً جديداً ({totalNew})
            </Button>
          </div>

          {/* Mixed Card */}
          <div className="bg-card rounded-2xl border hover:border-primary/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">جلسة حفظ ومراجعة مختلطة</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                مزيج تفاعلي يجمع بين مراجعة الأبيات المستحقة وتلقين أبيات جديدة في نفس الجلسة (الحد الأقصى 15 بيتاً).
              </p>
            </div>
            <Button 
              onClick={() => startSession('all')} 
              variant="ghost"
              className="w-full font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground border"
            >
              جلسة مختلطة
            </Button>
          </div>
        </div>

        {/* Back and Reset Actions */}
        <div className="flex justify-between items-center border-t pt-6">
          <Button variant="ghost" onClick={onExit} className="font-semibold text-muted-foreground">
            &larr; عودة لتفاصيل المتن
          </Button>

          {localProgress.some((p) => p.bookId === book.id) && (
            <Button variant="ghost" onClick={handleResetProgress} className="text-destructive hover:bg-destructive/10 text-xs">
              <RotateCcw className="h-4 w-4 ml-1" />
              إعادة ضبط تقدم الحفظ في هذا المتن
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Active review session UI
  const totalInSession = sessionQueue.length;
  const progressPercent = Math.round((currentIdx / totalInSession) * 100);
  const currentProgress = localProgress.find((p) => p.verseId === currentVerse?.id);
  const currentMastery = currentProgress?.mastery ?? 0;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 dir-rtl text-right select-none">
      {/* Top Session Progress Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setQueueType(null)} className="text-muted-foreground hover:text-foreground">
          إنهاء الجلسة
        </Button>

        <div className="flex items-center gap-3">
          {streakCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
              <Flame className="h-4 w-4 fill-amber-500" />
              <span>سلسلة الحفظ: {streakCount} أيام</span>
            </div>
          )}

          {streakBonusXP > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              <Award className="h-4 w-4" />
              <span>مكافأة السلسلة: +{streakBonusXP} XP</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>البيت {currentIdx + 1} من {totalInSession}</span>
          <span>تقدم الجلسة: {progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Display Card Mode selector */}
      <div className="flex justify-center gap-2 mb-8 bg-muted p-1 rounded-xl w-fit mx-auto">
        <button 
          onClick={() => { setStudyMode('full'); setIsRevealed(false); }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${studyMode === 'full' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          أبيت كاملة
        </button>
        <button 
          onClick={() => { setStudyMode('half'); setIsRevealed(false); }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${studyMode === 'half' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          شطر البيت الأول
        </button>
        <button 
          onClick={() => { setStudyMode('hidden'); setIsRevealed(false); }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${studyMode === 'hidden' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          مخفي بالكامل
        </button>
      </div>

      {/* Main Study Card */}
      <div 
        onClick={() => { if (!isRevealed) setIsRevealed(true); }}
        className={`relative overflow-hidden rounded-2xl border min-h-[220px] p-8 flex flex-col justify-center items-center text-center cursor-pointer shadow-md transition-all duration-500 bg-card group select-none hover:shadow-lg ${!isRevealed ? 'hover:border-primary/40' : 'border-primary/20 bg-gradient-to-br from-card to-primary/5'}`}
      >
        {/* Card corner info (Mastery level) */}
        {currentProgress && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>الإتقان: {currentMastery}%</span>
          </div>
        )}
        <div className="absolute top-4 left-4 text-xs font-mono text-muted-foreground">
          ترتيب البيت: #{currentVerse.order}
        </div>

        {/* Verse Content Display Area */}
        <div className="w-full space-y-6 md:space-y-8 select-none">
          {studyMode === 'full' || isRevealed ? (
            /* Mode: Full or Card is Revealed */
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 font-arabic text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground tracking-wide">
              <span className="font-semibold text-primary/95">{verseParts.sadr}</span>
              <span className="text-muted-foreground text-sm font-light select-none font-mono">...</span>
              <span className="font-semibold text-primary/95">{verseParts.ajez}</span>
            </div>
          ) : studyMode === 'half' ? (
            /* Mode: Half (Sadr only) */
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 font-arabic text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground tracking-wide">
              <span className="font-semibold text-primary/95">{verseParts.sadr}</span>
              <span className="text-muted-foreground text-sm font-light select-none font-mono">...</span>
              <span className="text-muted-foreground/30 blur-[2px] transition-all select-none font-arabic">
                [انقر لكشف الشطر الثاني]
              </span>
            </div>
          ) : (
            /* Mode: Hidden */
            <div className="flex flex-col items-center justify-center gap-3">
              <HelpCircle className="h-10 w-10 text-primary/40 animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">استحضر البيت في ذهنك ثم انقر للكشف</span>
            </div>
          )}
        </div>

        {/* Tap to Reveal Prompt in Footer */}
        {!isRevealed && (
          <div className="absolute bottom-4 text-xs text-muted-foreground/60 flex items-center gap-1 group-hover:text-primary/70 transition-colors">
            <Eye className="h-3.5 w-3.5" />
            <span>انقر فوق البطاقة لإظهار البيت بالكامل</span>
          </div>
        )}
      </div>

      {/* Controller Buttons */}
      <div className="mt-8 flex flex-col items-center">
        {isRevealed ? (
          /* Rating controls once card is revealed */
          <div className="w-full space-y-4">
            <p className="text-sm font-semibold text-center text-muted-foreground mb-2">
              ما مدى دقة تذكرك للبيت؟
            </p>
            
            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
              {/* Rating 1: Forgot */}
              <button
                onClick={() => handleRate(50)}
                className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive transition-all duration-200 shadow-sm"
              >
                <XCircle className="h-6 w-6 mb-2" />
                <span className="text-sm font-bold">نسيت</span>
                <span className="text-[10px] opacity-75 mt-0.5">خطأ أو نسيان</span>
              </button>

              {/* Rating 2: Good (with effort) */}
              <button
                onClick={() => handleRate(80)}
                className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all duration-200 shadow-sm"
              >
                <AlertCircle className="h-6 w-6 mb-2" />
                <span className="text-sm font-bold">بصعوبة</span>
                <span className="text-[10px] opacity-75 mt-0.5">تذكرت ببطء/جهد</span>
              </button>

              {/* Rating 3: Perfect / Easy */}
              <button
                onClick={() => handleRate(100)}
                className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all duration-200 shadow-sm"
              >
                <CheckCircle2 className="h-6 w-6 mb-2" />
                <span className="text-sm font-bold">سهل / متقن</span>
                <span className="text-[10px] opacity-75 mt-0.5">حفظ وتذكر فوري</span>
              </button>
            </div>
          </div>
        ) : (
          /* Reveal button if not revealed */
          <Button 
            onClick={() => setIsRevealed(true)}
            size="lg"
            className="px-10 py-6 text-base font-bold shadow-md rounded-xl w-full md:w-auto"
          >
            <Eye className="ml-2 h-5 w-5" />
            أظهر النص بالكامل
          </Button>
        )}
      </div>

      {/* Navigation & Controls */}
      <div className="mt-12 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
        <button
          onClick={() => {
            if (currentIdx > 0) {
              setCurrentIdx((prev) => prev - 1);
              setIsRevealed(false);
            }
          }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
          <span>البيت السابق</span>
        </button>

        <span className="font-mono">{currentIdx + 1} / {totalInSession}</span>

        <button
          onClick={() => {
            if (currentIdx < sessionQueue.length - 1) {
              setCurrentIdx((prev) => prev + 1);
              setIsRevealed(false);
            }
          }}
          disabled={currentIdx === sessionQueue.length - 1}
          className="flex items-center gap-1 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <span>البيت التالي</span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
