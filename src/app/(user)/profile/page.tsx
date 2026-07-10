'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Mail, Calendar, BookOpen, Award, Sparkles, Loader2, Globe, GraduationCap, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/features/progress.hooks';
import { usersService } from '@/services/firebase/users.service';
import { toast } from 'react-hot-toast';

const EDUCATION_LEVELS = [
  'طالب مبتدئ',
  'طالب متوسط',
  'طالب متقدم',
  'معلم / شيخ',
  'باحث',
  'أخرى',
];

const COUNTRIES = [
  'السعودية', 'مصر', 'الأردن', 'العراق', 'سوريا', 'فلسطين', 'الإمارات', 'الكويت',
  'قطر', 'البحرين', 'عمان', 'اليمن', 'ليبيا', 'تونس', 'الجزائر', 'المغرب', 'السودان',
  'لبنان', 'تركيا', 'ماليزيا', 'إندونيسيا', 'الصومال', 'موريتانيا', 'جيبوتي', 'أخرى',
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: userProgress } = useUserProgress(user?.id || '');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile details when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
      setBio((user as any).bio || '');
      setCountry((user as any).country || '');
      setEducationLevel((user as any).educationLevel || '');
    }
  }, [user]);

  const handleAvatarChange = async (url: string) => {
    setAvatarUrl(url);
    if (user?.id) {
      try {
        await usersService.updateProfile(user.id, { avatarUrl: url });
        toast.success('تم تحديث الصورة الرمزية بنجاح');
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء حفظ الصورة الرمزية');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (name.trim().length < 2) {
      toast.error('الاسم يجب أن يكون حرفين على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      await usersService.updateProfile(user.id, {
        name,
        bio,
        country,
        educationLevel,
      } as any);
      toast.success('تم تحديث البيانات الشخصية بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  // Calculate real progress statistics
  const totalVerses = userProgress ? userProgress.length : 0;
  const uniqueBooks = userProgress ? new Set(userProgress.map(p => p.bookId)).size : 0;
  const averageMastery = userProgress && userProgress.length > 0 
    ? Math.round(userProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / userProgress.length) 
    : 0;

  const joinDateStr = user.createdAt
    ? new Date(
        user.createdAt.seconds 
          ? user.createdAt.seconds * 1000 
          : (user.createdAt as any)
      ).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'غير محدد';

  return (
    <div className="space-y-8 max-w-4xl mx-auto dir-rtl text-right select-none">
      <div>
        <h1 className="text-3xl font-black text-foreground">الملف الشخصي</h1>
        <p className="text-muted-foreground text-sm mt-1">تعديل بياناتك الشخصية وإدارة الصورة الرمزية ومتابعة تحصيلك.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar + Stats Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <AvatarUpload value={avatarUrl} onChange={handleAvatarChange} />
          
          <h2 className="mt-4 text-xl font-bold">{name || user.name}</h2>
          <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
          
          {/* Education & Country badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
            {educationLevel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                <GraduationCap className="h-3 w-3" />
                {educationLevel}
              </span>
            )}
            {country && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                <Globe className="h-3 w-3" />
                {country}
              </span>
            )}
          </div>

          <div className="w-full border-t pt-5 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <BookOpen className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-bold">{uniqueBooks}</span>
              <span className="text-[10px] text-muted-foreground">متون</span>
            </div>
            <div className="flex flex-col items-center border-x">
              <Award className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-bold">{totalVerses}</span>
              <span className="text-[10px] text-muted-foreground">أبيات</span>
            </div>
            <div className="flex flex-col items-center">
              <Sparkles className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-bold">{averageMastery}%</span>
              <span className="text-[10px] text-muted-foreground">إتقان</span>
            </div>
          </div>

          {/* Join date */}
          <div className="w-full border-t mt-4 pt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>عضو منذ {joinDateStr}</span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2 rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            البيانات الشخصية
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>الاسم الكامل</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="أدخل اسمك الكامل"
                className="rounded-xl border bg-background/50 p-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>البريد الإلكتروني (غير قابل للتعديل)</span>
              </label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-muted/50 cursor-not-allowed rounded-xl text-muted-foreground border"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                <span>نبذة عنك <span className="text-muted-foreground text-xs">(اختياري)</span></span>
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة مختصرة عن نفسك وأهدافك العلمية..."
                rows={3}
                className="rounded-xl border bg-background/50 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>البلد</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">اختر البلد...</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>المستوى العلمي</span>
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">اختر المستوى...</option>
                  {EDUCATION_LEVELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSaving} className="rounded-xl font-bold px-6 py-2.5">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>حفظ التغييرات</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
