'use client';
import React from 'react';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Bell, Eye, Lock, Trash2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    publicProfile: true,
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('تم تحديث الإعدادات');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPassword({ current: '', new: '', confirm: '' });
      toast.success('تم تغيير كلمة المرور بنجاح');
    }, 1000);
  };

  const handleDeactivate = () => {
    setShowDeactivateConfirm(true);
  };

  const handleDeactivateConfirm = () => {
    setShowDeactivateConfirm(false);
    setIsDeactivating(true);
    setTimeout(() => {
      setIsDeactivating(false);
      toast.success('تم تعطيل الحساب بنجاح. سيتم تسجيل خروجك.');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">إعدادات الحساب</h1>
        <p className="text-muted-foreground">تخصيص تفضيلات التنبيهات والخصوصية والأمان.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar/Shortcuts */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
            <a href="#notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary/10">
              <Bell className="h-4 w-4" />
              <span>التنبيهات</span>
            </a>
            <a href="#privacy" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Eye className="h-4 w-4" />
              <span>الخصوصية</span>
            </a>
            <a href="#security" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Lock className="h-4 w-4" />
              <span>الأمان وكلمة المرور</span>
            </a>
            <a href="#danger-zone" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
              <span>منطقة الخطر</span>
            </a>
          </div>
        </div>

        {/* Settings Form Areas */}
        <div className="md:col-span-2 space-y-8">
          {/* Notifications Settings */}
          <section id="notifications" className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">تفضيلات التنبيهات</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm">تنبيهات البريد الإلكتروني</h4>
                  <p className="text-xs text-muted-foreground">تلقي رسائل البريد لتذكيرات الورد اليومي ومواعيد التسميع.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm">التنبيهات الفورية (Push)</h4>
                  <p className="text-xs text-muted-foreground">عرض الإشعارات المباشرة على سطح المكتب أو الهاتف.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.pushNotifications}
                    onChange={() => handleToggle('pushNotifications')}
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Privacy Settings */}
          <section id="privacy" className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">الخصوصية</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-sm">ملف إنجاز عام</h4>
                <p className="text-xs text-muted-foreground">السماح للمستخدمين الآخرين برؤية إحصائيات تقدمك وحفظك للمتون.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.publicProfile}
                  onChange={() => handleToggle('publicProfile')}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </section>

          {/* Security & Password */}
          <section id="security" className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">تغيير كلمة المرور</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور الحالية</label>
                <Input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                  <Input
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تأكيد كلمة المرور الجديدة</label>
                  <Input
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </div>
            </form>
          </section>

          {/* Danger Zone */}
          <section id="danger-zone" className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-destructive/10 pb-4">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-bold text-destructive">منطقة الخطر</h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-sm text-foreground">تعطيل الحساب مؤقتاً</h4>
                <p className="text-xs text-muted-foreground">سيؤدي ذلك إلى إخفاء ملفك الشخصي وتعطيل الوصول حتى تعيد تسجيل الدخول.</p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="w-fit"
              >
                {isDeactivating ? 'جاري التعطيل...' : 'تعطيل الحساب'}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Custom Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-muted p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 font-arabic">تعطيل الحساب</h3>
            <p className="text-sm text-muted-foreground mb-6 font-arabic leading-relaxed">
              هل أنت متأكد من رغبتك في تعطيل الحساب؟ لن يتم حذف بياناتك نهائياً ويمكنك استعادتها لاحقاً.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="destructive"
                onClick={handleDeactivateConfirm}
                className="flex-1 font-bold rounded-xl py-4 text-xs"
              >
                تعطيل الحساب
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 font-bold rounded-xl py-4 text-xs"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
