'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auditLogService } from '@/services/firebase/auditLog.service';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  Loader2, 
  Save, 
  ShieldAlert, 
  UserPlus, 
  Globe 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    siteName: 'متون',
    siteDescription: 'منصة متون للتعليم الإسلامي وحفظ المتون الشرعية.',
    allowRegistrations: true,
    maintenanceMode: false,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settingsDoc = await getDoc(doc(db, 'site_settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSiteSettings({
            siteName: data.siteName || 'متون',
            siteDescription: data.siteDescription || 'منصة متون للتعليم الإسلامي وحفظ المتون الشرعية.',
            allowRegistrations: data.allowRegistrations !== false,
            maintenanceMode: !!data.maintenanceMode,
            maxFailedAttempts: data.maxFailedAttempts || 5,
            lockoutDurationMinutes: data.lockoutDurationMinutes || 15,
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setSaving(true);
    const toastId = toast.loading('جاري حفظ الإعدادات...');
    try {
      // Get previous settings to compare differences in audit logs
      const oldDoc = await getDoc(doc(db, 'site_settings', 'general'));
      const previousSettings = oldDoc.exists() ? oldDoc.data() : {};

      await setDoc(doc(db, 'site_settings', 'general'), {
        ...siteSettings,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.id
      }, { merge: true });

      // Log action to audit logs
      await auditLogService.log(
        currentUser.id,
        'update_site_settings',
        'settings',
        'general',
        { 
          changes: siteSettings,
          previous: previousSettings
        }
      );

      toast.success('تم حفظ إعدادات المنصة بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الإعدادات.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل إعدادات المنصة...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 dir-rtl text-right select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <span>إعدادات المنصة العامة</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة متغيرات الموقع، التحكم بالتسجيل، وتفعيل وضع الصيانة العام.</p>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Site Identity Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>هوية المنصة</span>
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">اسم المنصة العلمية</label>
              <input
                type="text"
                required
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">وصف المنصة التعريفي (SEO)</label>
              <textarea
                rows={3}
                required
                value={siteSettings.siteDescription}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                className="w-full rounded-xl border bg-background/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>
          </div>

          {/* Access Control & Registration Toggle */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>التحكم بالوصول والتسجيل</span>
            </h2>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-foreground block">السماح بتسجيل حسابات جديدة</label>
                <span className="text-[10px] text-muted-foreground leading-normal block">
                  إذا تم إيقافه، فلن يتمكن الزوار الجدد من إنشاء حسابات بالبريد أو جوجل.
                </span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.allowRegistrations}
                onChange={(e) => setSiteSettings({ ...siteSettings, allowRegistrations: e.target.checked })}
                className="h-5 w-5 text-primary rounded border-muted focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Maintenance Mode Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span>وضع الصيانة والأمان</span>
            </h2>

            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-destructive block">تفعيل وضع الصيانة العام</label>
                <span className="text-[10px] text-muted-foreground leading-normal block">
                  تحذير: سيتم حظر جميع المستخدمين (غير الإداريين) فوراً وعرض شاشة صيانة مؤقتة.
                </span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.maintenanceMode}
                onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                className="h-5 w-5 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
              />
            </div>

            {/* Lockout Constants */}
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
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-md text-sm hover:opacity-90 transition-opacity"
            >
              {saving ? (
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

    </div>
  );
}
