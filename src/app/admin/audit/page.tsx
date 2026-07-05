'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Search, Filter, Database, Eye, 
  ChevronLeft, ChevronRight, X, Copy, Check, FileCode, CheckCircle, Info, Loader2
} from 'lucide-react';
import { auditLogService } from '@/services/firebase/auditLog.service';
import { usersService } from '@/services/firebase/users.service';
import { AuditLog } from '@/types/admin.types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAGE_SIZE = 15;

export default function AdminAuditLogsPage() {
  
  // States
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Caching user profiles to map userId -> Name/Email dynamically
  const [userCache, setUserCache] = useState<Record<string, { name: string; email: string }>>({});
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<(string | undefined)[]>([undefined]); // stack of lastVisibleDocIds
  const [hasMore, setHasMore] = useState(true);
  
  // Filtering States
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Audit Logs for current page
  const fetchLogs = async (lastVisibleDocId?: string, isNext: boolean = true) => {
    setLoading(true);
    try {
      const { logs: fetchedLogs, lastDocId } = await auditLogService.getAdminLogs(PAGE_SIZE, lastVisibleDocId);
      
      setLogs(fetchedLogs);
      
      // If we got fewer logs than PAGE_SIZE, there are no more pages
      setHasMore(fetchedLogs.length === PAGE_SIZE && !!lastDocId);
      
      if (isNext && lastDocId && fetchedLogs.length === PAGE_SIZE) {
        // Only push to history if we actually successfully navigated to next
        setPageHistory(prev => {
          if (prev.includes(lastDocId)) return prev;
          return [...prev, lastDocId];
        });
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("حدث خطأ أثناء تحميل سجل العمليات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(undefined, false);
  }, []);

  // 2. Fetch and resolve user profiles in parallel for the current logs list
  useEffect(() => {
    const resolveUserNames = async () => {
      const missingIds = logs
        .map(log => log.userId)
        .filter(id => id && !userCache[id]);
      
      if (missingIds.length === 0) return;
      
      const updatedCache = { ...userCache };
      await Promise.all(missingIds.map(async (id) => {
        try {
          const profile = await usersService.getProfile(id);
          if (profile) {
            updatedCache[id] = { name: profile.name, email: profile.email };
          } else {
            updatedCache[id] = { name: 'عضو غير معروف', email: id };
          }
        } catch {
          updatedCache[id] = { name: 'خطأ في التحميل', email: id };
        }
      }));
      setUserCache(updatedCache);
    };

    if (logs.length > 0) {
      resolveUserNames();
    }
  }, [logs]);

  // Pagination Handlers
  const handleNextPage = () => {
    if (!hasMore) return;
    const nextStartDocId = pageHistory[page];
    if (nextStartDocId) {
      setPage(prev => prev + 1);
      fetchLogs(nextStartDocId, true);
    }
  };

  const handlePrevPage = () => {
    if (page === 1) return;
    const prevStartDocId = pageHistory[page - 2]; // go back 2 steps in index history
    setPage(prev => prev - 1);
    fetchLogs(prevStartDocId, false);
  };

  // Format timestamp helper
  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return 'غير محدد';
    const tsObj = timestamp as { toDate?: () => Date };
    const date = tsObj.toDate ? tsObj.toDate() : new Date(timestamp as string | number | Date);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Resource display names mapping
  const resourceNames: Record<string, string> = {
    settings: 'إعدادات الموقع',
    pages: 'الصفحات التعريفية',
    books: 'المتون والكتب',
    verses: 'الأبيات والقصائد',
    users: 'صلاحيات الأعضاء',
    progress: 'سجلات المتابعة'
  };

  // Action labels mapping
  const actionLabels: Record<string, { label: string; color: string }> = {
    create_page: { label: 'إنشاء صفحة جديدة', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    update_page: { label: 'تحديث محتوى صفحة', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    delete_page: { label: 'حذف صفحة تعريفية', color: 'bg-destructive/10 text-destructive' },
    update_site_settings: { label: 'تعديل إعدادات المنصة', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    update_user_role: { label: 'تعديل صلاحيات مستخدم', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    delete_user: { label: 'تعطيل حساب عضو', color: 'bg-destructive/10 text-destructive' },
    create_book: { label: 'إضافة متن جديد', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    update_book: { label: 'تعديل بيانات متن', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    delete_book: { label: 'حذف متن شرعي', color: 'bg-destructive/10 text-destructive' },
    create_verse: { label: 'إضافة بيت شعر', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    update_verse: { label: 'تعديل بيت شعر', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    delete_verse: { label: 'حذف بيت شعر', color: 'bg-destructive/10 text-destructive' }
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, color: 'bg-muted text-muted-foreground' };
  };

  // Filtering Logic client-side to refine current page logs
  const filteredLogs = logs.filter(log => {
    const matchesResource = selectedResource === 'all' || log.resource === selectedResource;
    const matchesAction = selectedAction === 'all' || log.action.includes(selectedAction);
    
    // Search query matches admin name, email, action, resourceId or details
    const adminInfo = userCache[log.userId] || { name: '', email: '' };
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      log.resourceId.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      adminInfo.name.toLowerCase().includes(searchLower) ||
      adminInfo.email.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower);

    return matchesResource && matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-2.5">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <span>سجل عمليات المشرفين (Audit Trail)</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">سجل آمن وغير قابل للتعديل يوثق جميع عمليات وإجراءات المشرفين والمدراء مع تفاصيل الحالة قبل وبعد التغيير.</p>
      </div>

      {/* Filters and Search Bar */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث باسم المسؤول، البريد، معرف العنصر، أو الإجراء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border rounded-xl text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Resource Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 bg-background/50 w-full md:w-auto">
            <Database className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="text-xs font-semibold bg-transparent focus:outline-none cursor-pointer w-full"
            >
              <option value="all">كل الموارد</option>
              <option value="settings">إعدادات الموقع</option>
              <option value="pages">الصفحات التعريفية</option>
              <option value="books">المتون والكتب</option>
              <option value="verses">الأبيات والقصائد</option>
              <option value="users">صلاحيات الأعضاء</option>
            </select>
          </div>

          {/* Action type filter */}
          <div className="flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 bg-background/50 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs font-semibold bg-transparent focus:outline-none cursor-pointer w-full"
            >
              <option value="all">كل الإجراءات</option>
              <option value="create">إنشاء [Create]</option>
              <option value="update">تعديل [Update]</option>
              <option value="delete">حذف [Delete]</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">جاري تحميل سجل العمليات...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mb-3 opacity-20 text-primary" />
            <h3 className="font-bold text-sm text-foreground">لا توجد عمليات مطابقة للبحث</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">تأكد من كتابة مصطلح بحث صحيح أو تعديل فلاتر التصفية أعلاه.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-xs">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="p-4 font-bold text-muted-foreground">الإجراء</th>
                  <th className="p-4 font-bold text-muted-foreground">المسؤول</th>
                  <th className="p-4 font-bold text-muted-foreground">نوع المورد</th>
                  <th className="p-4 font-bold text-muted-foreground">معرف العنصر</th>
                  <th className="p-4 font-bold text-muted-foreground">تاريخ العملية</th>
                  <th className="p-4 font-bold text-muted-foreground text-center">التغييرات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const adminInfo = userCache[log.userId] || { name: 'جاري التحميل...', email: log.userId };
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className={cn("px-2.5 py-1 rounded-full font-bold text-[10px]", actionInfo.color)}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        <div>
                          <div className="text-foreground">{adminInfo.name}</div>
                          <div className="text-[10px] text-muted-foreground">{adminInfo.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {resourceNames[log.resource] || log.resource}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]" title={log.resourceId}>
                        {log.resourceId}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-bold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>عرض الفروقات</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Controls */}
        <div className="flex items-center justify-between border-t p-4 bg-muted/20">
          <span className="text-[11px] text-muted-foreground font-semibold">الصفحة {page}</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-bold bg-background hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              <span>السابق</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-bold bg-background hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <span>التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Diff Viewer Dialog */}
      {selectedLog && (
        <DiffViewerModal 
          log={selectedLog} 
          adminUser={userCache[selectedLog.userId] || { name: selectedLog.userId, email: '' }}
          onClose={() => setSelectedLog(null)} 
          resourceName={resourceNames[selectedLog.resource] || selectedLog.resource}
          formatTimestamp={formatTimestamp}
        />
      )}
    </div>
  );
}

// Subcomponent: Diff Viewer Modal
interface DiffViewerModalProps {
  log: AuditLog;
  adminUser: { name: string; email: string };
  onClose: () => void;
  resourceName: string;
  formatTimestamp: (ts: unknown) => string;
}

function DiffViewerModal({ log, adminUser, onClose, resourceName, formatTimestamp }: DiffViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');

  const beforeObj = (log.before || {}) as Record<string, unknown>;
  const afterObj = (log.after || {}) as Record<string, unknown>;

  // Extract keys and filter differences
  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]))
    .filter(k => k !== 'updatedAt' && k !== 'createdAt'); // skip timestamps for cleaner noise-free diffs

  const diffs = allKeys.map(key => {
    const beforeVal = beforeObj[key];
    const afterVal = afterObj[key];
    const isUnmodified = JSON.stringify(beforeVal) === JSON.stringify(afterVal);
    
    return {
      key,
      before: beforeVal,
      after: afterVal,
      isUnmodified
    };
  }).filter(d => !d.isUnmodified);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    toast.success('تم نسخ السجل الكامل بصيغة JSON');
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (val: unknown) => {
    if (val === undefined || val === null) return <span className="text-muted-foreground/50 italic text-[10px]">فارغ / غير موجود</span>;
    if (typeof val === 'boolean') return val ? 'نعم (True)' : 'لا (False)';
    if (typeof val === 'object') return <pre className="text-[10px] font-mono leading-tight max-w-[200px] overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl border rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">تفاصيل مقارنة العمليات</h3>
              <p className="text-[10px] text-muted-foreground">عرض تغيرات الحالة قبل وبعد تعديل المشرف</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Info Metadata */}
        <div className="p-4 border-b bg-muted/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed">
          <div>
            <span className="text-muted-foreground font-semibold">المسؤول عن الإجراء: </span>
            <span className="font-bold text-foreground">{adminUser.name}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">{adminUser.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-semibold">تاريخ التنفيذ: </span>
            <span className="font-bold text-foreground block mt-0.5">{formatTimestamp(log.createdAt)}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-semibold">نوع المورد والمستند: </span>
            <span className="font-bold text-foreground block mt-0.5">{resourceName} ({log.resourceId})</span>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b text-xs font-bold">
          <button
            onClick={() => setActiveTab('diff')}
            className={cn(
              "px-4 py-3 border-b-2 transition-colors focus:outline-none flex items-center gap-1.5",
              activeTab === 'diff' ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Info className="h-3.5 w-3.5" />
            <span>عرض الفروقات الذكي</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={cn(
              "px-4 py-3 border-b-2 transition-colors focus:outline-none flex items-center gap-1.5",
              activeTab === 'raw' ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>السجل الخام الكامل (Raw JSON)</span>
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
          {activeTab === 'diff' ? (
            <div className="space-y-4">
              {diffs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl text-muted-foreground">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mb-2 opacity-80" />
                  <h4 className="font-bold text-sm text-foreground">لا توجد حقول معدلة</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">ربما كانت العملية إعادة حفظ لنفس البيانات أو عملية حذف لا تحتوي تفاصيل الحقول.</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b font-bold text-muted-foreground">
                        <th className="p-3 w-1/4">الحقل (Field)</th>
                        <th className="p-3 bg-red-500/5 text-red-600 dark:text-red-400">الحالة السابقة (Before)</th>
                        <th className="p-3 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">الحالة الجديدة (After)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      {diffs.map((d) => (
                        <tr key={d.key} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-mono text-[11px] font-bold text-foreground border-l">
                            {d.key}
                          </td>
                          <td className="p-3 bg-red-500/5 text-red-700 dark:text-red-300 font-mono text-[11px] line-through border-l">
                            {renderValue(d.before)}
                          </td>
                          <td className="p-3 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                            {renderValue(d.after)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">السجل الكامل المخزن في Firestore</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold bg-background hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ السجل'}</span>
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto shadow-inner max-h-[400px]">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-sm"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
