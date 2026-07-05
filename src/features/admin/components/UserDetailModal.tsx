'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user.types';
import { recitationService } from '@/services/firebase/recitation.service';
import { db } from '@/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auditLogService } from '@/services/firebase/auditLog.service';
import { useAuth } from '@/hooks/useAuth';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  BarChart2, 
  Clock, 
  Award,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onRoleChanged: (userId: string, newRole: 'user' | 'admin') => void;
}

export function UserDetailModal({ user, onClose, onRoleChanged }: UserDetailModalProps) {
  const { user: currentUser } = useAuth();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ totalSessions: 0, totalDuration: 0, averageScore: 0 });
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>(user.role);
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    async function loadUserStats() {
      try {
        const data = await recitationService.getAnalytics(user.id);
        setStats(data);
      } catch (err) {
        console.error("Error loading user details stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadUserStats();
  }, [user.id]);

  const handleRoleChange = async () => {
    if (selectedRole === user.role) return;
    if (user.id === currentUser?.id) {
      toast.error("لا يمكنك تغيير صلاحيات حسابك الخاص.");
      return;
    }

    setUpdatingRole(true);
    const toastId = toast.loading('جاري تحديث الصلاحيات...');
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        role: selectedRole,
        updatedAt: Timestamp.now()
      });

      // Log to audit logs
      if (currentUser?.id) {
        await auditLogService.log(
          currentUser.id,
          'update_user_role',
          'users',
          user.id,
          { previousRole: user.role, newRole: selectedRole, email: user.email }
        );
      }

      onRoleChanged(user.id, selectedRole);
      toast.success('تم تحديث صلاحية المستخدم بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحديث الصلاحيات.', { id: toastId });
    } finally {
      setUpdatingRole(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    const mins = Math.floor(seconds / 60);
    return `${mins} دقيقة`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border rounded-3xl p-6 shadow-2xl flex flex-col gap-6 dir-rtl text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <span>تفاصيل حساب العضو</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg border hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User profile section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/20 border rounded-xl">
            <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-bold block">الاسم الكامل</span>
              <span className="text-xs font-bold text-foreground truncate block">{user.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/20 border rounded-xl">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-bold block">البريد الإلكتروني</span>
              <span className="text-xs font-bold text-foreground truncate block">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/20 border rounded-xl">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-bold block">تاريخ الانضمام</span>
              <span className="text-xs font-bold text-foreground truncate block">
                {user.createdAt 
                  ? new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : (user.createdAt as any)).toLocaleDateString('ar-SA')
                  : 'غير مسجل'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/20 border rounded-xl">
            <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-bold block">الصلاحية الحالية</span>
              <span className="text-xs font-bold text-foreground truncate block">
                {user.role === 'admin' ? 'مدير نظام' : 'مستخدم'}
              </span>
            </div>
          </div>
        </div>

        {/* Analytics stats section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
            <BarChart2 className="h-4 w-4 text-primary" />
            <span>نشاط الحفظ والتلاوة</span>
          </h3>

          {loadingStats ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-center">
                <Award className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground font-bold block">جلسات التلاوة</span>
                <span className="text-base font-black text-foreground">{stats.totalSessions}</span>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground font-bold block">وقت التلاوة</span>
                <span className="text-sm font-black text-foreground truncate block">{formatDuration(stats.totalDuration)}</span>
              </div>

              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                <Award className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground font-bold block">معدل الدقة</span>
                <span className="text-base font-black text-foreground">{stats.averageScore.toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Role Change Form */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
            <Shield className="h-4 w-4 text-primary" />
            <span>تحديث صلاحية العضوية</span>
          </h3>

          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              disabled={user.id === currentUser?.id || updatingRole}
              className="flex-1 rounded-xl border bg-background/50 p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="user">مستخدم (User)</option>
              <option value="admin">مدير نظام (Admin)</option>
            </select>
            
            <button
              onClick={handleRoleChange}
              disabled={selectedRole === user.role || updatingRole || user.id === currentUser?.id}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              حفظ
            </button>
          </div>
          {user.id === currentUser?.id && (
            <p className="text-[9px] text-amber-600 font-semibold leading-normal">
              * لا يمكنك تعديل صلاحيات حسابك الخاص لحماية نفسك من فقدان الصلاحية الإدارية.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
