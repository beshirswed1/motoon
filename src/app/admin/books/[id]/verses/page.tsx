'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/firebase/config';
import { doc, getDoc, getDocs, collection, query, where, orderBy, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Book } from '@/types/book.types';
import { Verse } from '@/types/verse.types';
import { VersePasteParser } from '@/features/books/components/VersePasteParser';
import { activityLogService } from '@/services/firebase/activityLog.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowRight, 
  Loader2, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X,
  FileText,
  TableProperties,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVersesPage() {
  const router = useRouter();
  const { id: bookId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'parser' | 'crud'>('crud');

  // CRUD Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);
  
  // Single new verse form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newOrder, setNewOrder] = useState<number>(1);
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    if (!bookId) return;
    setLoading(true);
    try {
      // Fetch Book details
      const bookSnap = await getDoc(doc(db, 'books', bookId));
      if (bookSnap.exists()) {
        setBook(bookSnap.data() as Book);
      } else {
        toast.error('المتن غير موجود.');
        router.push('/admin/books');
        return;
      }

      // Fetch Verses
      const q = query(
        collection(db, 'books', bookId as string, 'verses'),
        where('isDeleted', '==', false),
        orderBy('order', 'asc')
      );
      const versesSnap = await getDocs(q);
      const list = versesSnap.docs.map(docVal => docVal.data() as Verse);
      setVerses(list);
      setNewOrder(list.length > 0 ? list[list.length - 1].order + 1 : 1);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  // Edit action
  const startEdit = (verse: Verse) => {
    setEditingId(verse.id);
    setEditText(verse.text);
    setEditOrder(verse.order);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (verseId: string) => {
    if (!editText.trim()) {
      toast.error('نص البيت لا يمكن أن يكون فارغاً.');
      return;
    }

    const toastId = toast.loading('جاري حفظ التعديل...');
    try {
      await updateDoc(doc(db, 'books', bookId as string, 'verses', verseId), {
        text: editText,
        normalizedText: editText,
        order: editOrder,
        updatedAt: Timestamp.now()
      });

      // Log action
      if (user?.id) {
        await activityLogService.log(user.id, 'update_verse', {
          bookId,
          bookTitle: book?.title,
          verseId,
          order: editOrder
        });
      }

      setVerses(prev => 
        prev.map(v => v.id === verseId ? { ...v, text: editText, normalizedText: editText, order: editOrder } : v)
            .sort((a, b) => a.order - b.order)
      );

      setEditingId(null);
      toast.success('تم تعديل البيت بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('فشل في حفظ التعديل.', { id: toastId });
    }
  };

  // Delete action
  const handleDelete = async (verseId: string, order: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البيت؟')) return;

    const toastId = toast.loading('جاري حذف البيت...');
    try {
      // Soft delete
      await updateDoc(doc(db, 'books', bookId as string, 'verses', verseId), {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy: user?.id || null,
        updatedAt: Timestamp.now()
      });

      // Log action
      if (user?.id) {
        await activityLogService.log(user.id, 'delete_verse', {
          bookId,
          bookTitle: book?.title,
          verseId,
          order
        });
      }

      setVerses(prev => prev.filter(v => v.id !== verseId));
      toast.success('تم حذف البيت بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('فشل في حذف البيت.', { id: toastId });
    }
  };

  // Add single verse
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      toast.error('يرجى كتابة نص البيت.');
      return;
    }

    setAdding(true);
    const toastId = toast.loading('جاري إضافة البيت...');
    const newVerseId = `${bookId}_v_${newOrder}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const newVerse: Verse = {
        id: newVerseId,
        bookId,
        text: newText,
        normalizedText: newText,
        order: newOrder,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      };

      await setDoc(doc(db, 'books', bookId as string, 'verses', newVerseId), newVerse);

      // Log action
      if (user?.id) {
        await activityLogService.log(user.id, 'create_verse', {
          bookId,
          bookTitle: book?.title,
          verseId: newVerseId,
          order: newOrder
        });
      }

      setVerses(prev => [...prev, newVerse].sort((a, b) => a.order - b.order));
      setNewText('');
      setNewOrder(prev => prev + 1);
      setShowAddForm(false);
      toast.success('تمت إضافة البيت الجديد بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('فشل في إضافة البيت.', { id: toastId });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل الأبيات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/books" className="hover:text-primary transition-colors">إدارة المتون</Link>
        <span>&larr;</span>
        <span className="text-foreground font-bold">إدارة أبيات {book?.title}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">إدارة أبيات المتن</h1>
          <p className="text-muted-foreground text-sm mt-1">متن: {book?.title} | تأليف: {book?.author}</p>
        </div>

        <Link
          href="/admin/books"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة للمتون</span>
        </Link>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('crud')}
          className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'crud' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <TableProperties className="h-4 w-4" />
          <span>جدول الأبيات المضافة ({verses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('parser')}
          className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'parser' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="h-4 w-4" />
          <span>معالج لصق نصوص المتن دفعة واحدة</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'parser' ? (
        /* Paste Parser Mode */
        <VersePasteParser
          bookId={bookId}
          bookTitle={book?.title || ''}
          userId={user?.id || ''}
          onSuccess={() => {
            loadData();
            setActiveTab('crud');
          }}
        />
      ) : (
        /* CRUD list mode */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">جدول الأبيات الحالي</h2>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              className="flex items-center gap-1 font-semibold"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>إضافة بيت منفرد</span>
            </Button>
          </div>

          {/* Add Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleAddSingle} className="bg-card border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-end gap-4 animate-in fade-in duration-200">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-foreground">نص البيت (افصل الشطرين بـ `...` ) *</label>
                <input
                  type="text"
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="مثال: الحمد لله رب العالمين ... الرحمن الرحيم مالك يوم الدين"
                  className="w-full px-4 py-2 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-arabic text-center leading-loose"
                />
              </div>
              <div className="w-24 space-y-1.5">
                <label className="text-xs font-bold text-foreground">الترتيب *</label>
                <input
                  type="number"
                  required
                  value={newOrder}
                  onChange={(e) => setNewOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-center"
                />
              </div>
              <Button type="submit" disabled={adding} className="font-bold py-5 px-6 rounded-xl">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>إضافة البيت</span>}
              </Button>
            </form>
          )}

          {/* CRUD Table */}
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="p-3 w-20 text-center">الترتيب</th>
                    <th scope="col" className="p-3">نص البيت العلمي (الصدر ... العجز)</th>
                    <th scope="col" className="p-3 w-32 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {verses.length > 0 ? (
                    verses.map((verse) => {
                      const isEditing = editingId === verse.id;

                      return (
                        <tr key={verse.id} className="hover:bg-accent/10 transition-colors">
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editOrder}
                                onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                                className="w-16 px-1.5 py-1 border rounded text-center font-mono text-sm focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <span className="font-mono font-bold text-muted-foreground">
                                #{verse.order}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-background text-sm font-arabic text-center leading-loose focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <p className="font-arabic text-center text-foreground font-semibold leading-loose text-base">
                                {verse.text}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => saveEdit(verse.id)}
                                  className="p-1.5 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg"
                                  title="حفظ التعديل"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 text-muted-foreground bg-muted hover:bg-muted-foreground/10 rounded-lg"
                                  title="إلغاء"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => startEdit(verse)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg border"
                                  title="تعديل البيت"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(verse.id, verse.order)}
                                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/15"
                                  title="حذف البيت"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground select-none">
                        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="font-bold">لا يوجد أي أبيات مسجلة لهذا المتن حالياً.</p>
                        <p className="text-xs mt-1">انتقل إلى علامة التبويب **معالج لصق نصوص المتن** لإضافتها دفعة واحدة.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
