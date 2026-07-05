'use client';
import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ComparisonResult } from '@/types';
import { 
  RotateCcw, Home, CheckCircle2, 
  XCircle, AlertTriangle, ChevronDown, ChevronUp, 
  BookOpen, Trophy, Activity, Sparkles, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionSummaryProps {
  bookTitle: string;
  bookSlug?: string;
  results: Record<number, ComparisonResult>;
  versesCount: number;
  versesList?: Array<{ text: string; order: number }>;
  onRetry: () => void;
  onExit: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  bookTitle,
  bookSlug,
  results,
  versesCount,
  versesList = [],
  onRetry,
  onExit,
}) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [visibleReviewCount, setVisibleReviewCount] = useState<number>(30);

  const resultValues = Object.values(results);
  const attemptedVerses = resultValues.filter(r => !r.isNotRead);
  const totalAttempted = attemptedVerses.length;

  // Calculate overall accuracy (average of attempted verses)
  const avgAccuracy = totalAttempted > 0
    ? Math.round(attemptedVerses.reduce((sum, r) => sum + r.accuracy, 0) / totalAttempted)
    : 0;

  // Aggregate word metrics
  const totalCorrect = resultValues.reduce((sum, r) => sum + (r.isNotRead ? 0 : r.correctWords), 0);
  const totalReplaced = resultValues.reduce((sum, r) => sum + (r.isNotRead ? 0 : r.replacedWords.length), 0);
  const totalMissing = resultValues.reduce((sum, r) => sum + (r.isNotRead ? 0 : r.missingWords.length), 0);

  // Count skipped verses (attempted but got 0 correct and 0 replaced words)
  const skippedCount = resultValues.filter(r => !r.isNotRead && r.correctWords === 0 && r.replacedWords.length === 0).length;

  // Count unread verses
  const unreadCount = resultValues.filter(r => r.isNotRead).length;

  // Grade configuration
  const getGradeInfo = (score: number) => {
    if (score >= 95) {
      return {
        badge: 'تاج الحفظ والتمكين 👑',
        title: 'تبارك الرحمن! حفظٌ متقنٌ كالجبال',
        desc: 'قراءة ممتازة خالية من الأخطاء تقريباً. تم الحفظ والتمكين بنجاح تام، نوصيك بالانتقال للمتن التالي.',
        color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-950 bg-emerald-500/5',
        stroke: '#10b981',
      };
    }
    if (score >= 90) {
      return {
        badge: 'حافظ متقن ✨',
        title: 'أداء متميز وإتقان عالٍ',
        desc: 'أحسنت! إتقانك ممتاز جداً وعملك مبارك، راجع بشكل دوري لتثبيت الحفظ الدائم.',
        color: 'text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-950 bg-teal-500/5',
        stroke: '#0d9488',
      };
    }
    if (score >= 75) {
      return {
        badge: 'حافظ مجيد 🌟',
        title: 'أداء رائع ومبشر بالخير',
        desc: 'تلاوتك جيدة جداً مع وجود بعض الهفوات والكلمات المنسية البسيطة. مراجعة سريعة للأخطاء ستجعلك متقناً تماماً.',
        color: 'text-amber-650 dark:text-amber-400 border-amber-200 dark:border-amber-950 bg-amber-500/5',
        stroke: '#d97706',
      };
    }
    if (score >= 60) {
      return {
        badge: 'مستمع مجتهد 📚',
        title: 'مجهود طيب يحتاج للتركيز والمراجعة',
        desc: 'حفظك متوسط ولكنك بحاجة لتكرار الاستماع وتثبيت مواضع التعثر والنسيان لتفادي الخلط بين الكلمات.',
        color: 'text-orange-650 dark:text-orange-400 border-orange-200 dark:border-orange-950 bg-orange-500/5',
        stroke: '#ea580c',
      };
    }
    return {
      badge: 'يحتاج مراجعة وتكرار 🔄',
      title: 'حفظ يحتاج للتعهد والمراجعة المستمرة',
      desc: 'نسبة الخطأ والنسيان مرتفعة. نوصيك بالاستماع للمتن عدة مرات وإعادة قراءته ببطء قبل محاولة التسميع مجدداً.',
      color: 'text-red-650 dark:text-red-400 border-red-200 dark:border-red-950 bg-red-500/5',
      stroke: '#dc2626',
    };
  };

  const grade = getGradeInfo(avgAccuracy);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgAccuracy / 100) * circumference;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 border rounded-3xl bg-card/95 backdrop-blur-md shadow-xl text-center dir-rtl select-none flex flex-col gap-6 items-center border-muted">
      {/* Trophy & Badge */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-xs">
          <Trophy className="w-12 h-12" />
          {avgAccuracy >= 90 && (
            <span className="absolute -top-1 -right-1 text-amber-500 animate-bounce">
              <Sparkles className="w-6 h-6 fill-current" />
            </span>
          )}
        </div>
        <span className={`text-sm font-black px-4 py-1.5 rounded-full border shadow-xs ${grade.color}`}>
          {grade.badge}
        </span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-2xl font-black tracking-tight">تقرير جلسة التسميع</h2>
        <span className="text-muted-foreground text-sm font-bold flex items-center justify-center gap-1.5 mt-1">
          <BookOpen className="w-4 h-4" />
          {bookTitle}
        </span>
      </div>

      {/* Congrats & Evaluation Text Card */}
      <div className="flex flex-col gap-2 p-5 rounded-2xl border bg-muted/30 w-full text-right">
        <span className="text-md font-extrabold text-foreground flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" />
          {grade.title}
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium mt-1">
          {grade.desc}
        </p>
      </div>

      {/* Accuracy Gauge & Stats breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-center border-y py-6 my-2">
        {/* SVG Circular Gauge */}
        <div className="flex flex-col items-center gap-2 justify-center col-span-1 border-l border-muted/50 pb-4 md:pb-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted/20 dark:text-muted/10"
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                stroke={grade.stroke}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black tracking-tight font-arabic">{avgAccuracy}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-black">الدقة الإجمالية</span>
            </div>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 gap-3 col-span-2 w-full">
          <div className="flex flex-col gap-1 p-3 border rounded-xl bg-card/50 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">صحيح</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-lg font-black text-emerald-600 font-arabic">{totalCorrect} كلمة</span>
          </div>

          <div className="flex flex-col gap-1 p-3 border rounded-xl bg-card/50 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">مبدل/خطأ</span>
              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-lg font-black text-red-500 font-arabic">{totalReplaced} كلمة</span>
          </div>

          <div className="flex flex-col gap-1 p-3 border rounded-xl bg-card/50 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">منسي/متروك</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="text-lg font-black text-amber-500 font-arabic">{totalMissing} كلمة</span>
          </div>

          <div className="flex flex-col gap-1 p-3 border rounded-xl bg-card/50 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">أبيات متخطاة</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-lg font-black text-orange-550 font-arabic">{skippedCount} بيت</span>
          </div>

          {unreadCount > 0 && (
            <div className="flex flex-col gap-1 p-3 border rounded-xl bg-card/50 text-right col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">أبيات لم تُقرأ (لم تُحتسب في التقييم)</span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-arabic">{unreadCount} بيت</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Detailed Review Section */}
      {versesList && versesList.length > 0 && (
        <div className="w-full text-right border rounded-2xl overflow-hidden bg-card/50">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 bg-muted/40 font-bold text-sm text-foreground hover:bg-muted/65 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              مراجعة وتدقيق الأبيات بالتفصيل
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div 
              onScroll={(e) => {
                const target = e.currentTarget;
                if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
                  setVisibleReviewCount(prev => Math.min(prev + 30, versesCount));
                }
              }}
              className="p-4 flex flex-col gap-4 max-h-[350px] overflow-y-auto divide-y divide-muted/30"
            >
              {versesList.slice(0, visibleReviewCount).map((verse, idx) => {
                const result = results[idx];
                const isNotRead = result?.isNotRead;
                const isSkipped = !result || (result.correctWords === 0 && result.replacedWords.length === 0 && !isNotRead);
                const isCorrect = result && result.accuracy >= 95 && !isNotRead;
                const words = verse.text.trim().split(/\s+/).filter(Boolean);

                return (
                  <div key={idx} className={`pt-3.5 first:pt-0 flex flex-col gap-2 ${isSkipped ? 'opacity-85' : ''} ${isNotRead ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground">البيت {verse.order}</span>
                      {isNotRead ? (
                        <span className="text-blue-500 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 px-2 py-0.5 rounded-full">
                          لم يُقرأ
                        </span>
                      ) : isSkipped ? (
                        <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 px-2 py-0.5 rounded-full">
                          تم تخطيه (منسي)
                        </span>
                      ) : isCorrect ? (
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                          حفظ متقن (١٠٠٪)
                        </span>
                      ) : (
                        <span className="text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full">
                          دقة {result.accuracy}%
                        </span>
                      )}
                    </div>

                    <p className="text-lg font-bold font-arabic leading-loose flex flex-wrap flex-row-reverse justify-start gap-x-2 gap-y-2 mt-1">
                      {isNotRead && words.map((w, wIdx) => (
                        <span key={wIdx} className="text-muted-foreground font-semibold">
                          {w}
                        </span>
                      ))}

                      {isSkipped && !isNotRead && words.map((w, wIdx) => (
                        <span key={wIdx} className="text-amber-500 dark:text-amber-400 font-semibold decoration-amber-450 line-through">
                          {w}
                        </span>
                      ))}

                      {!isSkipped && !isNotRead && result && words.map((word, wIdx) => {
                        const isMatched = result.matchedWords.some(m => m.expectedIndex === wIdx);
                        if (isMatched) {
                          return (
                            <span key={wIdx} className="text-emerald-600 dark:text-emerald-400">
                              {word}
                            </span>
                          );
                        }

                        const replacement = result.replacedWords.find(r => r.expectedIndex === wIdx);
                        if (replacement) {
                          return (
                            <span key={wIdx} className="relative group flex flex-col items-center">
                              <span className="text-red-500 dark:text-red-400 font-semibold line-through decoration-red-650 cursor-pointer decoration-2">
                                {word}
                              </span>
                              <span className="absolute -top-7 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 opacity-90">
                                نطقت: {replacement.actual}
                              </span>
                            </span>
                          );
                        }

                        return (
                          <span key={wIdx} className="text-amber-550 dark:text-amber-455 line-through decoration-amber-400">
                            {word}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Certificate eligibility banner */}
      {avgAccuracy >= 95 && bookSlug && (
        <div className="w-full p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200 dark:border-amber-800/30 flex flex-col items-center gap-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="font-black text-amber-700 dark:text-amber-400 text-base">
              مبارك! استحققت شهادة الإتمام 🎉
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
            حصلت على {avgAccuracy}% — احصل على شهادتك الآن
          </p>
          <Button
            onClick={() => router.push(`/books/${bookSlug}/certificate?score=${avgAccuracy}`)}
            className="gap-2 font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md w-full"
          >
            <Award className="w-4 h-4" />
            احصل على شهادة إتمام المتن
          </Button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full border-t pt-6 mt-2">
        <Button size="lg" className="flex-1 gap-2 text-sm py-6 font-bold shadow-md hover:shadow-lg" onClick={onRetry}>
          <RotateCcw className="w-5 h-5" />
          إعادة التسميع بالكامل
        </Button>
        <Button variant="outline" size="lg" className="flex-1 gap-2 text-sm py-6 text-muted-foreground hover:text-foreground shadow-xs" onClick={onExit}>
          <Home className="w-5 h-5" />
          العودة لصفحة المتن
        </Button>
      </div>
    </div>
  );
};
