'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/features/progress.hooks';
import { isDueForReview, toDate } from '@/lib/algorithms/spacedRepetition';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  BookOpen, 
  Trophy, 
  Calendar as CalendarIcon, 
  BarChart3,
  Sparkles,
  ChevronLeft,
  Flame,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper mapping for book titles
const bookTitleMap: Record<string, string> = {
  'book_1': 'متن الأربعين النووية',
  'nawawi-forty': 'متن الأربعين النووية',
  'book_2': 'متن الآجرومية',
  'ajurrumiyyah': 'متن الآجرومية',
  'bayquniyyah': 'منظومة البيقوني',
  'book_4': 'تحفة الأطفال',
  'tuhfat-al-atfal': 'تحفة الأطفال',
  'book_3': 'ألفية ابن مالك',
  'alfiyyah-ibn-malik': 'ألفية ابن مالك',
};



export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || '';
  
  const { data: serverProgress, isLoading: progressLoading } = useUserProgress(userId);

  const isLoading = authLoading || (!!userId && progressLoading);

  // Compute stats and calendar from progress list
  const progressList = useMemo(() => {
    if (serverProgress && serverProgress.length > 0) {
      // Map to standard layout with fallback defaults
      return serverProgress.map(p => ({
        ...p,
        mastery: p.mastery ?? 0,
        nextReviewDate: toDate(p.nextReviewDate),
        lastReviewDate: p.lastReviewDate ? toDate(p.lastReviewDate) : null,
      }));
    }
    return [];
  }, [serverProgress]);

  // Compute Overall Stats
  const stats = useMemo(() => {
    if (progressList.length === 0) {
      return {
        overallMastery: 0,
        activeBooks: 0,
        completedBooks: 0,
        retentionRate: 0,
        totalReviewed: 0
      };
    }

    const uniqueBooks = new Set(progressList.map(p => p.bookId));
    const totalMastery = progressList.reduce((sum, p) => sum + p.mastery, 0);
    const avgMastery = Math.round(totalMastery / progressList.length);
    
    // Retention rate = percentage of items with mastery >= 70
    const highMasteryCount = progressList.filter(p => p.mastery >= 70).length;
    const retention = Math.round((highMasteryCount / progressList.length) * 100);

    const completed = progressList.length > 5 ? 1 : 0; // This should be calculated based on real mastery data. For now, keep as is if > 5.

    return {
      overallMastery: avgMastery,
      activeBooks: uniqueBooks.size,
      completedBooks: completed,
      retentionRate: retention,
      totalReviewed: progressList.length
    };
  }, [progressList]);

  // Compute 7-day Review Calendar
  // Creates calendar entries for: Today (Day 0), Day +1, Day +2, ..., Day +6
  const calendarData = useMemo(() => {
    const data = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      
      // Count items due on this day (timezone-aware)
      const count = progressList.filter((item) => {
        const itemDate = toDate(item.nextReviewDate);
        return itemDate.getFullYear() === targetDate.getFullYear() &&
               itemDate.getMonth() === targetDate.getMonth() &&
               itemDate.getDate() === targetDate.getDate();
      }).length;

      // Format Day Name
      let dayName = targetDate.toLocaleDateString('ar-SA', { weekday: 'short' });
      if (i === 0) dayName = 'اليوم';
      if (i === 1) dayName = 'غداً';

      const dayNum = targetDate.getDate();
      const monthName = targetDate.toLocaleDateString('ar-SA', { month: 'short' });

      data.push({
        dayName,
        dateStr: `${dayNum} ${monthName}`,
        count,
        isToday: i === 0,
        dateKey: targetDate.toDateString()
      });
    }

    return data;
  }, [progressList]);

  // Compute Due Items List for Today
  const dueItems = useMemo(() => {
    const list = progressList.filter(p => isDueForReview(p.nextReviewDate));
    
    // Group by Book to display in UI
    const bookGroups: Record<string, { bookId: string, bookTitle: string, count: number }> = {};
    
    list.forEach(item => {
      const bookTitle = bookTitleMap[item.bookId] || item.bookId || 'متن علمي';
      if (!bookGroups[item.bookId]) {
        bookGroups[item.bookId] = {
          bookId: item.bookId,
          bookTitle,
          count: 0
        };
      }
      bookGroups[item.bookId].count += 1;
    });

    return Object.values(bookGroups);
  }, [progressList]);

  // Compute Mastery Distribution
  const distribution = useMemo(() => {
    const total = progressList.length;
    if (total === 0) return { high: 0, moderate: 0, low: 0, highPct: 0, moderatePct: 0, lowPct: 0 };

    const high = progressList.filter(p => p.mastery >= 71).length;
    const moderate = progressList.filter(p => p.mastery >= 40 && p.mastery <= 70).length;
    const low = progressList.filter(p => p.mastery < 40).length;

    return {
      high,
      moderate,
      low,
      highPct: Math.round((high / total) * 100),
      moderatePct: Math.round((moderate / total) * 100),
      lowPct: Math.round((low / total) * 100),
    };
  }, [progressList]);

  const getMasteryColor = (score: number) => {
    if (score < 40) return 'text-destructive';
    if (score <= 70) return 'text-amber-500';
    return 'text-emerald-500';
  };



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 select-none">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل لوحة التقدم...</span>
      </div>
    );
  }

  const dueCountToday = calendarData[0].count;

  return (
    <div className="space-y-8 dir-rtl text-right select-none">
      {/* Top Banner and Due Today Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            متابعة التقدم والإنجاز
            {dueCountToday > 0 && (
              <span className="inline-flex items-center justify-center bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                {dueCountToday} مستحق اليوم
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">لوحة تفاعلية لمتابعة مستوى حفظك وإتقانك للمتون العلمية.</p>
        </div>

        {/* Guest fallback indicator */}
        {!user && (
          <div className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 p-3 rounded-xl text-xs max-w-sm">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <span>عرض بيانات تجريبية. قم بتسجيل الدخول لحفظ تقدمك بشكل دائم ومزامنة المحفوظ.</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Overall Mastery */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">معدل الإتقان العام</span>
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-3xl font-bold ${getMasteryColor(stats.overallMastery)}`}>
              {stats.overallMastery}%
            </span>
            <span className="text-xs text-muted-foreground">من المتون النشطة</span>
          </div>
        </div>

        {/* Stat 2: Active Books */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">المتون النشطة</span>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-bold">{stats.activeBooks}</span>
            <span className="text-xs text-muted-foreground">متون قيد الحفظ والمراجعة</span>
          </div>
        </div>

        {/* Stat 3: Completed Books */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">أبيات مكررة</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-bold">{stats.totalReviewed}</span>
            <span className="text-xs text-muted-foreground">بيتاً مسجلاً في خوارزمية التكرار</span>
          </div>
        </div>

        {/* Stat 4: Retention Rate */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">نسبة الاستذكار القوي</span>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-3xl font-bold ${getMasteryColor(stats.retentionRate)}`}>
              {stats.retentionRate}%
            </span>
            <span className="text-xs text-muted-foreground">قوة المحفظة طويلة المدى</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Right Section: Due today lists + 7-Day calendar */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 7-Day Calendar Tracker */}
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              جدول المراجعة (7 أيام قادمة)
            </h2>
            <p className="text-xs text-muted-foreground mb-6">عدد الأبيات المستحقة للتكرار والمراجعة المجدولة خلال الأيام السبعة المقبلة.</p>
            
            <div className="grid grid-cols-7 gap-2">
              {calendarData.map((day, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                    day.isToday 
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
                      : day.count > 0 
                        ? "bg-accent/40 hover:bg-accent border-primary/10" 
                        : "bg-muted/10 border-dashed"
                  )}
                >
                  <span className="text-[10px] opacity-75">{day.dayName}</span>
                  <span className="text-sm font-semibold mt-1">{day.dateStr.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-60 mt-0.5">{day.dateStr.split(' ')[1]}</span>
                  
                  <div className={cn(
                    "mt-3 text-xs px-2 py-0.5 rounded-full font-bold",
                    day.count > 0 
                      ? day.isToday 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground/60"
                  )}>
                    {day.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Due Today Reviews Detail */}
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>المراجعات المستحقة اليوم</span>
              {dueCountToday > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {dueCountToday} أبيات متبقية
                </span>
              )}
            </h2>
            
            {dueItems.length > 0 ? (
              <div className="divide-y">
                {dueItems.map((item) => (
                  <div key={item.bookId} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-base">{item.bookTitle}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">مسار التكرار المتباعد التلقائي</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                        {item.count} أبيات مستحقة
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/books/${item.bookId}/memorize`} className="flex items-center gap-1 font-bold">
                          ابدأ المراجعة
                          <ChevronLeft className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-foreground">لا توجد مراجعات مستحقة اليوم!</p>
                <p className="text-xs text-muted-foreground mt-1">حفظك ممتاز وجدولك خالٍ من المتأخرات اليوم.</p>
              </div>
            )}
          </div>
        </div>

        {/* Left Column: Mastery Distribution */}
        <div className="space-y-6 h-fit">
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              توزيع درجات الإتقان
            </h2>
            <p className="text-xs text-muted-foreground mb-6">مخطط تفصيلي يوضح توزيع أبيات المتون المحفوظة بناءً على درجة إتقانها الحالية.</p>

            <div className="space-y-6">
              {/* High Mastery Tier (71-100%) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    إتقان عالٍ (71-100%)
                  </span>
                  <span>{distribution.high} أبيات ({distribution.highPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${distribution.highPct}%` }}
                  />
                </div>
              </div>

              {/* Moderate Mastery Tier (40-70%) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    إتقان متوسط (40-70%)
                  </span>
                  <span>{distribution.moderate} أبيات ({distribution.moderatePct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${distribution.moderatePct}%` }}
                  />
                </div>
              </div>

              {/* Low Mastery Tier (<40%) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    مراجعة عاجلة (&lt;40%)
                  </span>
                  <span>{distribution.low} أبيات ({distribution.lowPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive rounded-full transition-all duration-500"
                    style={{ width: `${distribution.lowPct}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-8 text-xs text-muted-foreground flex gap-3">
              <Flame className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="leading-relaxed">سنقوم بجدولة الأبيات ذات الإتقان المنخفض للتكرار اليومي حتى ترتقي لدرجة الإتقان العالي تلقائياً.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
