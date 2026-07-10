'use client';
import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase/config';
import { collection, collectionGroup, getDocs, query, where, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { activityLogService } from '@/services/firebase/activityLog.service';
import { usersService } from '@/services/firebase/users.service';
import { ActivityLog } from '@/types/admin.types';
import { User } from '@/types/user.types';
import { useAuth } from '@/hooks/useAuth';
import { 
  BookOpen, 
  Layers, 
  Users, 
  Activity, 
  Loader2, 
  Clock, 
  Settings,
  PlusCircle,
  Search,
  ShieldCheck,
  UserX,
  Save,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';



export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings' | 'site_stats'>('stats');
  const [loading, setLoading] = useState(true);

  // Stats tab states
  const [metrics, setMetrics] = useState({
    booksCount: 0,
    versesCount: 0,
    usersCount: 0,
    logsCount: 0,
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Users tab states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Settings tab states
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'متون',
    siteDescription: 'منصة متون للتعليم الإسلامي وحفظ المتون الشرعية.',
    allowRegistrations: true,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Homepage statistics control
  const [siteStats, setSiteStats] = useState({
    totalUsers: 1,
    totalBooks: 1,
    totalSessions: 1,
    activeUsersToday: 1,
    useRealData: true,
  });
  const [siteStatsSaving, setSiteStatsSaving] = useState(false);

  // Fetch Stats Data
  const fetchDashboardData = async () => {
    try {
      // Fetch books count
      const booksQuery = query(collection(db, 'books'), where('isDeleted', '==', false));
      const booksSnap = await getDocs(booksQuery);
      const booksCount = booksSnap.size;

      // Fetch verses count
      const versesQuery = query(collectionGroup(db, 'verses'), where('isDeleted', '==', false));
      const versesSnap = await getDocs(versesQuery);
      const versesCount = versesSnap.size;

      // Fetch users count
      const usersQuery = query(collection(db, 'users'), where('isDeleted', '==', false));
      const usersSnap = await getDocs(usersQuery);
      const usersCount = usersSnap.size;

      // Fetch logs
      const serverLogs = await activityLogService.getAll(15);
      
      // Count all logs
      const logsSnap = await getDocs(collection(db, 'activity_logs'));
      const logsCount = logsSnap.size;

      setMetrics({
        booksCount: booksCount || 0, 
        versesCount: versesCount || 0,
        usersCount: usersCount || 0,
        logsCount: logsCount || 0
      });

      if (serverLogs && serverLogs.length > 0) {
        setLogs(serverLogs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Error loading admin metrics:", err);
      setMetrics({
        booksCount: 0,
        versesCount: 0,
        usersCount: 0,
        logsCount: 0
      });
      setLogs([]);
    }
  };

  // Fetch Users Directory
  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('isDeleted', '==', false));
      const usersSnap = await getDocs(usersQuery);
      const allUsers = usersSnap.docs.map(docVal => docVal.data() as User);
      setUsersList(allUsers);
    } catch (err) {
      console.error("Error fetching users list:", err);
      toast.error("فشل تحميل قائمة الأعضاء");
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch Site Settings
  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'site_settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSiteSettings({
          siteName: data.siteName || 'متون',
          siteDescription: data.siteDescription || 'منصة متون للتعليم الإسلامي وحفظ المتون الشرعية.',
          allowRegistrations: data.allowRegistrations !== false,
          maxFailedAttempts: data.maxFailedAttempts || 5,
          lockoutDurationMinutes: data.lockoutDurationMinutes || 15,
        });
      }
      // Also fetch site_stats
      const statsDoc = await getDoc(doc(db, 'site_settings', 'homepage_stats'));
      if (statsDoc.exists()) {
        const d = statsDoc.data();
        setSiteStats({
          totalUsers: d.totalUsers || 10000,
          totalBooks: d.totalBooks || 50,
          totalSessions: d.totalSessions || 500000,
          activeUsersToday: d.activeUsersToday || 500,
          useRealData: d.useRealData !== false,
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchUsers(),
        fetchSettings()
      ]);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Update user role handler
  const handleToggleRole = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      toast.error("لا يمكنك تغيير صلاحية حسابك الخاص");
      return;
    }
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const roleLabel = newRole === 'admin' ? 'مدير' : 'مستخدم';
    
    const loadingToast = toast.loading(`جاري تغيير صلاحيات ${targetUser.name}...`);
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      
      // Log action
      if (currentUser?.id) {
        await activityLogService.log(currentUser.id, 'update_user_role' as any, {
          targetUserId: targetUser.id,
          targetEmail: targetUser.email,
          newRole
        });
      }

      toast.success(`تم تغيير صلاحية ${targetUser.name} إلى ${roleLabel}`, { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("فشل تغيير الصلاحيات في قاعدة البيانات", { id: loadingToast });
    }
  };

  // Soft Delete user handler
  const handleSoftDeleteUser = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      toast.error("لا يمكنك حذف حسابك الخاص!");
      return;
    }

    if (!window.confirm(`هل أنت متأكد من تعطيل/حذف حساب المستخدم: ${targetUser.name}؟ لن يتمكن من تسجيل الدخول بعد الآن.`)) {
      return;
    }

    const loadingToast = toast.loading(`جاري تعطيل حساب ${targetUser.name}...`);
    try {
      if (currentUser?.id) {
        await usersService.softDelete(targetUser.id, currentUser.id);
        
        // Log action
        await activityLogService.log(currentUser.id, 'delete_user' as any, {
          targetUserId: targetUser.id,
          targetEmail: targetUser.email
        });
      }

      // Update local state
      setUsersList(prev => prev.filter(u => u.id !== targetUser.id));
      toast.success(`تم تعطيل حساب ${targetUser.name} بنجاح.`, { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("فشل تعطيل حساب المستخدم.", { id: loadingToast });
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setSettingsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'general'), {
        ...siteSettings,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.id
      }, { merge: true });

      await activityLogService.log(currentUser.id, 'update_site_settings' as any, siteSettings);
      toast.success("تم حفظ إعدادات المنصة بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Save Homepage Statistics handler
  const handleSaveSiteStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSiteStatsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'homepage_stats'), {
        ...siteStats,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.id,
      }, { merge: true });
      toast.success('تم حفظ إحصائيات الصفحة الرئيسية');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSiteStatsSaving(false);
    }
  };

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = userSearch.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [usersList, userSearch]);

  const formatLogTime = (logDate: any) => {
    let dateObj: Date;
    if (logDate && typeof logDate === 'object' && 'seconds' in logDate) {
      dateObj = new Date(logDate.seconds * 1000);
    } else {
      dateObj = new Date(logDate);
    }

    const diffMs = Date.now() - dateObj.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    return dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const getLogMessage = (log: ActivityLog) => {
    const details = log.details || {};
    switch (log.type) {
      case 'create_book' as any:
        return `قام بإضافة متن جديد: "${details.title || 'غير محدد'}"`;
      case 'update_book' as any:
        return `قام بتعديل بيانات المتن: "${details.title || 'غير محدد'}"`;
      case 'delete_book' as any:
        return `قام بحذف المتن: "${details.title || 'غير محدد'}"`;
      case 'batch_create_verses' as any:
        return `قام برفع دفعة من الأبيات (${details.count || 0} بيت) لمتن: "${details.bookTitle || 'غير محدد'}"`;
      case 'update_user_role' as any:
        return `قام بتعديل صلاحيات الحساب: "${details.targetEmail || 'غير محدد'}" إلى ${details.newRole === 'admin' ? 'مدير' : 'طالب'}`;
      case 'delete_user' as any:
        return `قام بتعطيل/حذف حساب العضو: "${details.targetEmail || 'غير محدد'}"`;
      case 'update_site_settings' as any:
        return `قام بتحديث الإعدادات العامة للمنصة`;
      default:
        return `قام بإجراء عملية: ${log.type}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل لوحة التحكم الأمنية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 dir-rtl text-right select-none">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">أهلاً بك، {currentUser?.name || 'المدير'} 👋</h1>
          <p className="text-muted-foreground text-sm">مرحباً بك في لوحة الإدارة الشاملة لإدارة المتون والأعضاء والأمان.</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/books/create"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="h-4 w-4" />
            <span>إضافة متن جديد</span>
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap border-b gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>الإحصائيات والعمليات</span>
        </button>

        <button
          onClick={() => setActiveTab('site_stats')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'site_stats' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>إحصائيات الصفحة الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>إدارة الأعضاء والصلاحيات</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>إعدادات المنصة</span>
        </button>
      </div>

      {/* TAB: Homepage Statistics Control */}
      {activeTab === 'site_stats' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="font-black text-lg mb-1">التحكم في إحصائيات الصفحة الرئيسية</h3>
            <p className="text-sm text-muted-foreground">
              يمكنك تعيين الأرقام التي تظهر للزوار في قسم "إنجازات المنصة". فعّل الخيار "استخدام البيانات الحقيقية" لعرض الأرقام الفعلية من قاعدة البيانات.
            </p>
          </div>
          <form onSubmit={handleSaveSiteStats} className="p-6 rounded-2xl border bg-card space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
              <div>
                <p className="font-bold">استخدام الأرقام الحقيقية</p>
                <p className="text-xs text-muted-foreground">جلب الإحصائيات تلقائياً من قاعدة البيانات</p>
              </div>
              <button
                type="button"
                onClick={() => setSiteStats(prev => ({ ...prev, useRealData: !prev.useRealData }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${siteStats.useRealData ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${siteStats.useRealData ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {!siteStats.useRealData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'totalUsers', label: 'عدد الطلاب', placeholder: '10000' },
                  { key: 'totalBooks', label: 'عدد المتون', placeholder: '50' },
                  { key: 'totalSessions', label: 'جلسات التسميع', placeholder: '500000' },
                  { key: 'activeUsersToday', label: 'نشطون اليوم', placeholder: '500' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">{label}</label>
                    <input
                      type="number"
                      value={(siteStats as any)[key]}
                      onChange={e => setSiteStats(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                      placeholder={placeholder}
                      className="h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={siteStatsSaving}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 w-full"
            >
              {siteStatsSaving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري الحفظ...</>
              ) : (
                <><Save className="h-4 w-4" />حفظ إعدادات الإحصائيات</>
              )}
            </button>
          </form>
        </div>
      )}


      {/* TAB 1: Stats & Overview */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">إجمالي المتون</span>
                <span className="p-2.5 bg-primary/10 rounded-xl text-primary"><BookOpen className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline mt-4 gap-2">
                <span className="text-3xl font-black text-foreground">{metrics.booksCount}</span>
                <span className="text-xs text-muted-foreground font-semibold">متن علمي</span>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">إجمالي الأبيات</span>
                <span className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600"><Layers className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline mt-4 gap-2">
                <span className="text-3xl font-black text-foreground">{metrics.versesCount}</span>
                <span className="text-xs text-muted-foreground font-semibold">بيت مفصل</span>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">الأعضاء النشطين</span>
                <span className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600"><Users className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline mt-4 gap-2">
                <span className="text-3xl font-black text-foreground">{metrics.usersCount}</span>
                <span className="text-xs text-muted-foreground font-semibold">طالب ومسؤول</span>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">سجل الأحداث</span>
                <span className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600"><Activity className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline mt-4 gap-2">
                <span className="text-3xl font-black text-foreground">{metrics.logsCount}</span>
                <span className="text-xs text-muted-foreground font-semibold">حدث أمني وتشغيلي</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live activity log stream */}
            <div className="lg:col-span-2 rounded-2xl border bg-card shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  سجل العمليات الأخير
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">تحديث مباشر</span>
              </div>

              <div className="divide-y flex-1 max-h-[450px] overflow-y-auto pr-1">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="py-4 flex items-start gap-4 first:pt-0 last:pb-0">
                      <div className="mt-1 flex-shrink-0 p-2 bg-muted rounded-xl text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            {log.userId === 'admin' || log.userId === currentUser?.id ? 'مدير النظام' : 'مشرف'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatLogTime(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getLogMessage(log)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-xs">لا يوجد لوقات حتى الآن.</div>
                )}
              </div>
            </div>

            {/* Registration SVG Graph */}
            <div className="rounded-2xl border bg-card shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  معدل تسجيل الطلاب
                </h2>
                <p className="text-[10px] text-muted-foreground mb-4">احصائيات نمو المنصة خلال الشهور الأخيرة.</p>
              </div>

              {/* Styled SVG Chart */}
              <div className="w-full flex justify-center py-4 bg-muted/20 border rounded-xl">
                <svg className="w-full max-w-[280px] h-[160px]" viewBox="0 0 100 60">
                  {/* Grid Lines */}
                  <line x1="10" y1="10" x2="90" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="10" y1="30" x2="90" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd5e1" strokeWidth="0.5" />
                  
                  {/* Bars representing growth */}
                  <rect x="18" y="35" width="8" height="15" rx="1.5" fill="#0f766e" opacity="0.3" />
                  <rect x="34" y="25" width="8" height="25" rx="1.5" fill="#0f766e" opacity="0.5" />
                  <rect x="50" y="20" width="8" height="30" rx="1.5" fill="#0f766e" opacity="0.75" />
                  <rect x="66" y="12" width="8" height="38" rx="1.5" fill="#0f766e" />
                  <rect x="82" y="8" width="8" height="42" rx="1.5" fill="#10b981" />

                  {/* Month labels */}
                  <text x="22" y="56" fontSize="4" fill="#64748b" textAnchor="middle">شعبان</text>
                  <text x="38" y="56" fontSize="4" fill="#64748b" textAnchor="middle">رمضان</text>
                  <text x="54" y="56" fontSize="4" fill="#64748b" textAnchor="middle">شوال</text>
                  <text x="70" y="56" fontSize="4" fill="#64748b" textAnchor="middle">ذو القعدة</text>
                  <text x="86" y="56" fontSize="4" fill="#64748b" textAnchor="middle">اليوم</text>
                </svg>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-4 text-xs text-muted-foreground flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="leading-relaxed">المنصة تسجل نمواً ثابتاً في عدد الحفاظ وتدقيق التلاوة التلقائي.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Users Directory & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 rounded-2xl border shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن عضو باسمه أو بريده..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <button 
              onClick={fetchUsers}
              disabled={userLoading}
              className="text-xs bg-muted border hover:bg-muted/70 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
            >
              {userLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>تحديث القائمة</span>}
            </button>
          </div>

          {/* Users Table */}
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase">
                  <tr>
                    <th scope="col" className="p-4">اسم الطالب</th>
                    <th scope="col" className="p-4">البريد الإلكتروني</th>
                    <th scope="col" className="p-4">نوع الصلاحية</th>
                    <th scope="col" className="p-4">تاريخ التسجيل</th>
                    <th scope="col" className="p-4 text-center">الإجراءات الأمنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-foreground">
                  {userLoading ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                        <span>جاري تحميل قائمة الطلاب...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                        <td className="p-4 font-bold text-foreground">{item.name}</td>
                        <td className="p-4 text-xs text-muted-foreground">{item.email}</td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            item.role === 'admin' 
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {item.role === 'admin' ? 'مدير نظام' : 'طالب علم'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {item.createdAt 
                            ? new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : (item.createdAt as any)).toLocaleDateString('ar-SA')
                            : 'غير مسجل'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Role Button */}
                            <button
                              onClick={() => handleToggleRole(item)}
                              disabled={item.id === currentUser?.id}
                              className="flex items-center gap-1 text-[10px] bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                              title="تغيير صلاحية الحساب"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{item.role === 'admin' ? 'تخفيض إلى طالب' : 'ترقية لمدير'}</span>
                            </button>

                            {/* Soft Delete User */}
                            <button
                              onClick={() => handleSoftDeleteUser(item)}
                              disabled={item.id === currentUser?.id}
                              className="p-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-600 rounded-lg disabled:opacity-50"
                              title="تعطيل الحساب نهائياً"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs font-bold">
                        لم يتم العثور على أي حسابات تطابق البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Site Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-card border rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-foreground">إعدادات المنصة العامة</h2>
            <p className="text-xs text-muted-foreground mt-0.5">تعديل بارامترات النظام وقواعد الأمان والتحكم والتسجيل.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Site Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">اسم المنصة</label>
              <input
                type="text"
                required
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Site Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">وصف المنصة التعريفي (SEO)</label>
              <textarea
                rows={3}
                required
                value={siteSettings.siteDescription}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Allow Signups Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
              <div>
                <label className="text-sm font-bold text-foreground block">السماح بتسجيل حسابات جديدة</label>
                <span className="text-[10px] text-muted-foreground leading-normal">إذا تم تعطيله، لن يتمكن الزوار الجدد من التسجيل بالبريد.</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.allowRegistrations}
                onChange={(e) => setSiteSettings({ ...siteSettings, allowRegistrations: e.target.checked })}
                className="h-5 w-5 text-primary rounded border-muted focus:ring-primary"
              />
            </div>

            {/* Lockout Security Constants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">أقصى عدد من المحاولات الخاطئة</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  required
                  value={siteSettings.maxFailedAttempts}
                  onChange={(e) => setSiteSettings({ ...siteSettings, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">مدة قفل الحساب (بالدقائق)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  required
                  value={siteSettings.lockoutDurationMinutes}
                  onChange={(e) => setSiteSettings({ ...siteSettings, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={settingsSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-md text-sm hover:opacity-90 transition-opacity"
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>حفظ الإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
