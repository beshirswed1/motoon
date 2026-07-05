'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { booksService } from '@/services/firebase/books.service';
import { activityLogService } from '@/services/firebase/activityLog.service';
import { useAuth } from '@/hooks/useAuth';
import { Book, BookDifficulty } from '@/types/book.types';
import { db } from '@/firebase/config';
import { writeBatch, doc, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { 
  Search, 
  ArrowUpDown, 
  Trash2, 
  Edit3, 
  ListMusic, 
  Plus, 
  Loader2, 
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AdminBook extends Book {
  versesCount?: number;
}

const difficultyLabels: Record<BookDifficulty, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

const statusLabels = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
};

export default function AdminBooksPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Sorting State
  const [sortField, setSortField] = useState<keyof AdminBook>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadBooks() {
      try {
        const { books: serverBooks } = await booksService.getAll({ pageSize: 100 });
        if (serverBooks && serverBooks.length > 0) {
          setBooks(serverBooks as AdminBook[]);
        } else {
          setBooks([]);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  // Handle Selection Checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredBooks.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: 'draft' | 'published') => {
    if (selectedIds.length === 0) return;
    
    const loadingToast = toast.loading('جاري تحديث حالة المتون المختارة...');
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        const bookRef = doc(db, 'books', id);
        batch.update(bookRef, { 
          status: newStatus,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();

      // Log action
      if (user?.id) {
        await activityLogService.log(user.id, 'update_book', {
          bulk: true,
          count: selectedIds.length,
          status: newStatus
        });
      }

      setBooks(prev => 
        prev.map(b => selectedIds.includes(b.id) ? { ...b, status: newStatus } : b)
      );

      setSelectedIds([]);
      toast.success(`تم تحديث حالة ${selectedIds.length} متون بنجاح.`, { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء التحديث الجماعي.', { id: loadingToast });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} متون نهائياً؟`)) return;

    const loadingToast = toast.loading('جاري حذف المتون المختارة...');
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        const bookRef = doc(db, 'books', id);
        batch.update(bookRef, { 
          isDeleted: true,
          deletedAt: Timestamp.now(),
          deletedBy: user?.id || null,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();

      // Log action
      if (user?.id) {
        await activityLogService.log(user.id, 'delete_book', {
          bulk: true,
          count: selectedIds.length
        });
      }

      setBooks(prev => prev.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      toast.success('تم حذف المتون المحددة بنجاح.', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف الجماعي.', { id: loadingToast });
    }
  };

  // Sort toggle function
  const handleSort = (field: keyof Book | 'versesCount') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort logic
  const filteredBooks = useMemo(() => {
    let result = books.filter(b => {
      const searchLower = search.toLowerCase();
      return b.title.toLowerCase().includes(searchLower) || 
             b.author.toLowerCase().includes(searchLower);
    });

    result.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle undefined/null values
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Timestamp conversion for sorting
      if (valA instanceof Timestamp || (typeof valA === 'object' && 'seconds' in valA)) {
        valA = valA.seconds * 1000;
      }
      if (valB instanceof Timestamp || (typeof valB === 'object' && 'seconds' in valB)) {
        valB = valB.seconds * 1000;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [books, search, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل المتون...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">إدارة المتون العلمية</h1>
          <p className="text-muted-foreground text-sm mt-1">تصفح وتعديل وتصفية المتون وإدارة الأبيات التابعة لها.</p>
        </div>

        <Link
          href="/admin/books/create"
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة متن جديد</span>
        </Link>
      </div>

      {/* Search and Bulk Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 rounded-2xl border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن متن باسمه أو مؤلفه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-primary/5 border border-primary/20 p-2 rounded-xl">
            <span className="text-xs font-bold text-primary px-2">
              تم تحديد ({selectedIds.length})
            </span>
            <button
              onClick={() => handleBulkStatusChange('published')}
              className="flex items-center gap-1 text-xs bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>نشر</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('draft')}
              className="flex items-center gap-1 text-xs bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>جعل كمسودة</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-xs bg-destructive text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>حذف</span>
            </button>
          </div>
        )}
      </div>

      {/* Books Table */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={filteredBooks.length > 0 && selectedIds.length === filteredBooks.length}
                    onChange={handleSelectAll}
                    className="rounded text-primary focus:ring-primary h-4 w-4 border-muted-foreground"
                  />
                </th>
                <th scope="col" className="p-4 cursor-pointer hover:bg-muted" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">
                    <span>عنوان المتن</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-4 cursor-pointer hover:bg-muted" onClick={() => handleSort('author')}>
                  <div className="flex items-center gap-1">
                    <span>المؤلف</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-4 cursor-pointer hover:bg-muted" onClick={() => handleSort('difficulty')}>
                  <div className="flex items-center gap-1">
                    <span>المستوى</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-4 cursor-pointer hover:bg-muted" onClick={() => handleSort('versesCount')}>
                  <div className="flex items-center gap-1">
                    <span>عدد الأبيات</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-4 cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>الحالة</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-foreground">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-accent/40 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(book.id)}
                        onChange={() => handleSelectOne(book.id)}
                        className="rounded text-primary focus:ring-primary h-4 w-4 border-muted-foreground"
                      />
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {book.title}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {book.author}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold",
                        book.difficulty === 'beginner' 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : book.difficulty === 'intermediate'
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      )}>
                        {difficultyLabels[book.difficulty]}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {book.versesCount ?? book.versesCount ?? 0} بيتاً
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold border",
                        book.status === 'published'
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : book.status === 'draft'
                            ? "bg-muted text-muted-foreground border-muted-foreground/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      )}>
                        {statusLabels[book.status]}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit metadata */}
                        <Link
                          href={`/admin/books/create?id=${book.id}`}
                          className="p-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                          title="تعديل المتن"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        {/* Edit verses */}
                        <Link
                          href={`/admin/books/${book.id}/verses`}
                          className="p-1.5 rounded-lg border border-amber-500/20 text-amber-600 hover:bg-amber-500/5 transition-colors"
                          title="إدارة الأبيات"
                        >
                          <ListMusic className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground select-none">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-bold">لم يتم العثور على أي متون تطابق بحثك.</p>
                    <p className="text-xs mt-1">تأكد من كتابة أحرف صحيحة أو إضافة متن جديد.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
