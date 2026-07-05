'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/firebase/analytics.service';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Activity,
  Award,
  Loader2,
  TrendingUp,
  FileBarChart2
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Recharts components to prevent Next.js SSR Hydration errors
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']; // Red, Amber, Blue, Emerald

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalSessions: 0,
    activeUsersToday: 0
  });

  const [dailyActive, setDailyActive] = useState<{ date: string; activeUsers: number }[]>([]);
  const [accuracyDist, setAccuracyDist] = useState<{ name: string; count: number }[]>([]);
  const [mostUsedBooks, setMostUsedBooks] = useState<{ name: string; count: number }[]>([]);
  const [masteryDist, setMasteryDist] = useState<{ name: string; value: number }[]>([]);
  const [newUsers, setNewUsers] = useState<{ name: string; usersCount: number }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          totalsData,
          dailyData,
          accuracyData,
          mostUsedData,
          masteryData,
          newUsersData
        ] = await Promise.all([
          analyticsService.getTotalStats(),
          analyticsService.getDailyActive(),
          analyticsService.getAccuracyDist(),
          analyticsService.getMostUsed(),
          analyticsService.getMasteryDist(),
          analyticsService.getNewUsers()
        ]);

        setTotals(totalsData);
        setDailyActive(dailyData);
        setAccuracyDist(accuracyData);
        setMostUsedBooks(mostUsedData);
        setMasteryDist(masteryData);
        setNewUsers(newUsersData);
      } catch (err) {
        console.error("Error loading analytics page:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل تقارير الأداء والتحليلات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 dir-rtl text-right select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span>التحليلات وإحصائيات المنصة</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">تتبع نشاط الحفاظ اليومي ومستويات التمكن وتفاعل الطلاب بالرسوم البيانية.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي الطلاب</span>
            <span className="p-2.5 bg-primary/10 rounded-xl text-primary"><Users className="h-5 w-5" /></span>
          </div>
          <div className="flex items-baseline mt-4 gap-2">
            <span className="text-3xl font-black text-foreground">{totals.totalUsers}</span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> 12%</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المتون النشطة</span>
            <span className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600"><BookOpen className="h-5 w-5" /></span>
          </div>
          <div className="flex items-baseline mt-4 gap-2">
            <span className="text-3xl font-black text-foreground">{totals.totalBooks}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">متن علمي</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">جلسات التلاوة المنجزة</span>
            <span className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600"><Activity className="h-5 w-5" /></span>
          </div>
          <div className="flex items-baseline mt-4 gap-2">
            <span className="text-3xl font-black text-foreground">{totals.totalSessions}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">جلسة تصحيح تلقائية</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">النشطين اليوم</span>
            <span className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600"><Award className="h-5 w-5" /></span>
          </div>
          <div className="flex items-baseline mt-4 gap-2">
            <span className="text-3xl font-black text-foreground">{totals.activeUsersToday}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">أعضاء نشطين</span>
          </div>
        </div>
      </div>

      {/* Chart Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: Daily Active Users last 30 days (LineChart) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-foreground">نشاط الطلاب اليومي (الـ 30 يوماً الأخيرة)</h2>
            <p className="text-[10px] text-muted-foreground">إجمالي جلسات الحفظ المنفذة بشكل يومي.</p>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyActive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} جلسة`, 'النشاط']} />
                <Line type="monotone" dataKey="activeUsers" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Accuracy Distribution (BarChart) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-foreground">توزيع دقة الحفظ (جلسات التلاوة)</h2>
            <p className="text-[10px] text-muted-foreground">عدد التلاوات المصححة مقسمة حسب نطاقات نسبة الصحة.</p>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} جلسة`, 'التلاوات']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Most Popular Books (Horizontal BarChart) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-foreground">المتون الأكثر قراءة وحفظاً (أعلى 10)</h2>
            <p className="text-[10px] text-muted-foreground">عدد جلسات الحفظ المنفذة لكل متن.</p>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostUsedBooks} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                <Tooltip formatter={(value) => [`${value} تلاوة`, 'العدد']} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Mastery Distribution (PieChart) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-foreground">توزيع مستويات تمكن الحفاظ</h2>
            <p className="text-[10px] text-muted-foreground">نسب تمكن الطلاب الإجمالية من الأبيات (وفق خوارزمية التكرار المتباعد).</p>
          </div>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[220px]">
            <div className="w-[180px] h-[180px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masteryDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {masteryDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} بيت`, 'التمكن']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-2.5 text-xs font-bold w-full">
              {masteryDist.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between border-b pb-1.5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-md flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-foreground">{item.value} بيت</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 5: New Users last 6 months (BarChart) */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-sm space-y-4 flex flex-col min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <FileBarChart2 className="h-5 w-5 text-primary" />
              معدل تسجيل الطلاب الجدد شهرياً (الـ 6 أشهر الأخيرة)
            </h2>
            <p className="text-[10px] text-muted-foreground">عدد الحسابات الجديدة التي أنشئت في المنصة.</p>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newUsers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} طالب`, 'الحسابات الجديدة']} />
                <Bar dataKey="usersCount" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
