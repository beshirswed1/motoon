'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { pagesService } from '@/services/firebase/pages.service';
import { auditLogService } from '@/services/firebase/auditLog.service';
import { Page } from '@/types/admin.types';
import { useAuth } from '@/hooks/useAuth';
import { nanoid } from 'nanoid';
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0621-\u064A\s-]/g, '') // Keep Arabic/English alphanumeric, spaces, hyphens
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // merge hyphens
}

export default function AdminPagesCRUDPage() {
  const { user: currentUser } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Drawer states
  const [showDrawer, setShowDrawer] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const list = await pagesService.getAll();
      setPages(list);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل الصفحات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setTitle('');
    setSlug('');
    setContent('');
    setIsPublished(true);
    setSlugEdited(false);
    setShowDrawer(true);
  };

  const openEdit = (page: Page) => {
    setEditId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setIsPublished(page.isPublished);
    setSlugEdited(true);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugEdited(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!title || !slug || !content) {
      toast.error('يرجى تعبئة كافة الحقول المطلوبة.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('جاري حفظ الصفحة...');
    try {
      const payload = {
        title,
        slug,
        content,
        isPublished
      };

      if (editId) {
        await pagesService.update(editId, payload);
        
        // Log action
        await auditLogService.log(
          currentUser.id,
          'update_page',
          'pages',
          editId,
          { title, slug }
        );

        setPages(prev => prev.map(p => p.id === editId ? { ...p, ...payload, updatedAt: Timestamp.now() } : p));
        toast.success('تم تحديث الصفحة بنجاح.', { id: toastId });
      } else {
        const newId = `page_${nanoid(8)}`;
        await pagesService.create({
          id: newId,
          ...payload
        });

        // Log action
        await auditLogService.log(
          currentUser.id,
          'create_page',
          'pages',
          newId,
          { title, slug }
        );

        toast.success('تم إنشاء الصفحة بنجاح.', { id: toastId });
      }

      setShowDrawer(false);
      fetchPages(); // Reload list to sort correctly
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الصفحة.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (targetPage: Page) => {
    if (!currentUser?.id) return;
    if (!window.confirm(`هل أنت متأكد من حذف صفحة "${targetPage.title}" نهائياً؟`)) return;

    const toastId = toast.loading('جاري حذف الصفحة...');
    try {
      await pagesService.softDelete(targetPage.id, currentUser.id);

      // Log action
      await auditLogService.log(
        currentUser.id,
        'delete_page',
        'pages',
        targetPage.id,
        { title: targetPage.title, slug: targetPage.slug }
      );

      setPages(prev => prev.filter(p => p.id !== targetPage.id));
      toast.success('تم حذف الصفحة بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حذف الصفحة.', { id: toastId });
    }
  };

  // Filtered pages computed value
  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [pages, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل الصفحات التعريفية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <span>إدارة الصفحات التعريفية (Pages CRUD)</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">تعديل ونشر الصفحات الثابتة (مثل سياسة الخصوصية، الشروط والأحكام، من نحن).</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة صفحة جديدة</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md bg-card rounded-2xl border shadow-sm p-2 flex items-center">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث بالعنوان أو الرابط (slug)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-3 pr-10 py-2 border border-transparent rounded-xl bg-transparent text-sm focus:outline-none"
        />
      </div>

      {/* Pages List Table */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="p-4">عنوان الصفحة</th>
                <th scope="col" className="p-4">رابط الصفحة (Slug)</th>
                <th scope="col" className="p-4">الحالة</th>
                <th scope="col" className="p-4">تاريخ التحديث</th>
                <th scope="col" className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-foreground">
              {filteredPages.length > 0 ? (
                filteredPages.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                    <td className="p-4 font-bold text-foreground">{item.title}</td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">/{item.slug}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        item.isPublished 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-muted text-muted-foreground border-muted-foreground/20'
                      }`}>
                        {item.isPublished ? 'منشورة' : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {item.updatedAt 
                        ? new Date(item.updatedAt.seconds ? item.updatedAt.seconds * 1000 : (item.updatedAt as any)).toLocaleDateString('ar-SA')
                        : 'غير مسجل'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit button */}
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                          title="تعديل محتوى الصفحة"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors"
                          title="حذف الصفحة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground select-none">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-bold text-sm">لم يتم العثور على أي صفحات.</p>
                    <p className="text-xs mt-1">تأكد من إدخال كلمات صحيحة أو اضغط على "إضافة صفحة جديدة".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card border rounded-3xl p-6 shadow-2xl flex flex-col gap-6 dir-rtl text-right">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>{editId ? 'تعديل الصفحة التعريفية' : 'إضافة صفحة تعريفية جديدة'}</span>
              </h2>
              <button 
                onClick={closeDrawer}
                className="p-1 rounded-lg border hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 flex-1">
              
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">عنوان الصفحة *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="مثال: من نحن، سياسة الخصوصية"
                  className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Slug input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">رابط الصفحة الفرعي (Slug) *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="مثال: about-us, privacy-policy"
                  className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-left"
                />
              </div>

              {/* Content text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">محتوى الصفحة (HTML أو نص عادي) *</label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب تفاصيل ومحتوى الصفحة هنا..."
                  className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              {/* Status toggler */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border">
                <div>
                  <label className="text-sm font-bold block">نشر الصفحة فوراً</label>
                  <span className="text-[9px] text-muted-foreground leading-normal">إذا لم تفعلها، ستبقى الصفحة كمسودة غير ظاهرة للعامة.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-5 w-5 text-primary rounded border-muted focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Submit actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold hover:bg-muted transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-md text-xs hover:opacity-90 transition-opacity"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>حفظ الصفحة</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
