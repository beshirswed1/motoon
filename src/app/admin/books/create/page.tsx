'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { booksService } from '@/services/firebase/books.service';
import { activityLogService } from '@/services/firebase/activityLog.service';
import { useAuth } from '@/hooks/useAuth';
import { Book, BookDifficulty } from '@/types/book.types';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { 
  ArrowRight, 
  Loader2, 
  UploadCloud, 
  X, 
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function generateArabicSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0621-\u064A\s-]/g, '') // Keep Arabic letters, English, numbers, spaces, hyphens
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // merge hyphens
}

function CreateBookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<BookDifficulty>('beginner');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [tagsInput, setTagsInput] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Load existing book data if editing
  useEffect(() => {
    if (!editId) return;

    async function loadBookData() {
      setInitLoading(true);
      try {
        const bookRef = doc(db, 'books', editId as string);
        const snap = await getDoc(bookRef);
        if (snap.exists()) {
          const data = snap.data() as Book;
          setTitle(data.title);
          setSlug(data.slug);
          setAuthor(data.author);
          setDescription(data.description);
          setDifficulty(data.difficulty);
          setStatus(data.status as any);
          setTagsInput(data.tags?.join('، ') || '');
          setCoverUrl(data.coverImageUrl || '');
          setSlugManuallyEdited(true);
        } else {
          toast.error('المتن غير موجود.');
          router.push('/admin/books');
        }
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء تحميل بيانات المتن.');
      } finally {
        setInitLoading(false);
      }
    }

    loadBookData();
  }, [editId, router]);

  // Handle title change & auto slug generation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(generateArabicSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  };

  // Image Upload handler (ImgBB with Mock Fallback)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    const toastId = toast.loading('جاري رفع غلاف المتن...');

    try {
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
      if (!apiKey || apiKey === 'your_imgbb_api_key_here') {
        throw new Error('مفتاح ImgBB API غير متوفر');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل رفع الصورة إلى ImgBB');
      }

      const result = await response.json();
      setCoverUrl(result.data.url);
      toast.success('تم رفع الصورة بنجاح وتعيين الغلاف.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('فشل في رفع الصورة، يرجى المحاولة لاحقاً.', { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverUrl('');
    toast.success('تمت إزالة غلاف المتن.');
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !author || !description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(editId ? 'جاري تحديث المتن...' : 'جاري إنشاء المتن الجديد...');

    // Format tags from comma-separated string
    const tags = tagsInput
      .split(/[،,]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const bookPayload = {
      title,
      slug,
      author,
      description,
      difficulty,
      status,
      tags,
      isPublished: status === 'published',
      ...(coverUrl ? { coverImageUrl: coverUrl } : {})
    };

    try {
      if (editId) {
        // Update Book record in Firestore
        await booksService.update(editId, bookPayload);

        // Log operation
        if (user?.id) {
          await activityLogService.log(user.id, 'update_book', {
            id: editId,
            title
          });
        }

        toast.success('تم تحديث بيانات المتن بنجاح.', { id: toastId });
        router.push('/admin/books');
      } else {
        // Create new Book record
        const newBookId = `book_${nanoid(8)}`;
        await booksService.create({
          id: newBookId,
          ...bookPayload
        });

        // Log operation
        if (user?.id) {
          await activityLogService.log(user.id, 'create_book', {
            id: newBookId,
            title
          });
        }

        toast.success('تم إنشاء المتن بنجاح! حوّل الآن لإضافة الأبيات.', { id: toastId });
        router.push(`/admin/books/${newBookId}/verses`);
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ المتن، يرجى التحقق من المدخلات.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل بيانات المتن...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/books" className="hover:text-primary transition-colors">إدارة المتون</Link>
        <span>&larr;</span>
        <span className="text-foreground font-bold">{editId ? 'تعديل المتن' : 'إضافة متن جديد'}</span>
      </div>

      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-extrabold text-foreground">
          {editId ? 'تعديل المتن العلمي' : 'تسجيل متن علمي جديد'}
        </h1>
        <Link
          href="/admin/books"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowRight className="h-4 w-4" />
          <span>إلغاء والعودة للقائمة</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Right side: Primary inputs */}
        <div className="md:col-span-2 space-y-5 bg-card border p-6 rounded-2xl shadow-sm">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">عنوان المتن *</label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="مثال: متن الآجرومية في علم النحو"
              className="w-full px-4 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>رابط المتن (Slug) *</span>
              <span className="text-[10px] text-muted-foreground font-normal">(رابط URL فريد للمتن)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="مثال: al-ajurrumiyyah"
                className="w-full pl-4 pr-4 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-left"
              />
              {!slugManuallyEdited && title && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-primary/70 font-semibold bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  <Sparkles className="h-3 w-3" />
                  توليد تلقائي
                </span>
              )}
            </div>
          </div>
          {/* Author */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">المؤلف / الناظم *</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="مثال: ابن آجروم الصنهاجي"
              className="w-full px-4 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">وصف المتن والمقدمة التعريفية *</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة مختصرة عن هذا المتن العلمي، وأهميته للمبتدئين، والمباحث التي يغطيها..."
              className="w-full px-4 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">الوسوم والتصنيفات (تفصل بفواصل) </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: نحو، لغة عربية، مبتدئ"
              className="w-full px-4 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Left side: Upload & Settings */}
        <div className="space-y-6">
          
          {/* Cover image uploader */}
          <div className="bg-card border p-6 rounded-2xl shadow-sm text-center space-y-4">
            <h3 className="text-sm font-bold text-foreground text-right mb-2">غلاف المتن العلمي</h3>
            
            {coverUrl ? (
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border bg-muted shadow-sm group">
                <img 
                  src={coverUrl} 
                  alt="غلاف المتن" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg transition-colors"
                  title="حذف الغلاف"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 aspect-[3/4] w-full rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all group">
                {uploadingImage ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="text-xs font-bold text-foreground mt-3">ارفع صورة الغلاف</span>
                <span className="text-[10px] text-muted-foreground mt-1">تنسيق PNG أو JPG (النسبة 3:4)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage} 
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {/* Difficulty & Status */}
          <div className="bg-card border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b pb-2">خيارات المتن</h3>
            
            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">صعوبة المتن</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as BookDifficulty)}
                className="w-full px-3 py-2 border rounded-xl bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="beginner">مبتدئ (Beginner)</option>
                <option value="intermediate">متوسط (Intermediate)</option>
                <option value="advanced">متقدم (Advanced)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">حالة النشر</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="draft">مسودة (Draft)</option>
                <option value="published">منشور (Published)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full font-bold py-6 text-base rounded-2xl shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              <span>{editId ? 'حفظ تعديلات المتن' : 'تأكيد وإنشاء المتن'}</span>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}

// Wrapped in Suspense because it uses useSearchParams
export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل الاستمارة...</span>
      </div>
    }>
      <CreateBookForm />
    </Suspense>
  );
}
