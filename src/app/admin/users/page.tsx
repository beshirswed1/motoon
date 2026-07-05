'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { usersService } from '@/services/firebase/users.service';
import { auditLogService } from '@/services/firebase/auditLog.service';
import { User } from '@/types/user.types';
import { useAuth } from '@/hooks/useAuth';
import { UserDetailModal } from '@/features/admin';
import { 
  Users, 
  Search, 
  Loader2, 
  UserX, 
  ShieldAlert, 
  Eye,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersDirectoryPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('isDeleted', '==', false));
      const snap = await getDocs(q);
      const allUsers = snap.docs.map(docVal => docVal.data() as User);
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل قائمة الأعضاء.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Soft delete user handler
  const handleSoftDelete = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      toast.error("لا يمكنك تعطيل حسابك الخاص!");
      return;
    }

    if (!window.confirm(`هل أنت متأكد من تعطيل حساب المستخدم: ${targetUser.name}؟ لن يتمكن من تسجيل الدخول بعد الآن.`)) {
      return;
    }

    const toastId = toast.loading('جاري تعطيل حساب العضو...');
    try {
      if (currentUser?.id) {
        await usersService.softDelete(targetUser.id, currentUser.id);
        
        // Log to audit logs
        await auditLogService.log(
          currentUser.id,
          'delete_user',
          'users',
          targetUser.id,
          { name: targetUser.name, email: targetUser.email }
        );
      }

      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      toast.success('تم تعطيل حساب المستخدم بنجاح.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تعطيل الحساب.', { id: toastId });
    }
  };

  // Callback when role is changed inside the modal
  const handleRoleChanged = (userId: string, newRole: 'user' | 'admin') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, role: newRole });
    }
  };

  // Filtered users computed value
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || email.includes(query);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري تحميل دليل الأعضاء...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <span>إدارة الأعضاء والصلاحيات</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">تصفح حسابات الطلاب والمشرفين وإدارة صلاحياتهم والاطلاع على إحصائياتهم.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 rounded-2xl border shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث بالاسم الكامل أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 border rounded-xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>تصفية حسب الصلاحية:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-xl border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">الكل</option>
            <option value="user">مستخدم</option>
            <option value="admin">مدير نظام</option>
          </select>
        </div>
      </div>

      {/* Users List Table */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="p-4">العضو</th>
                <th scope="col" className="p-4">البريد الإلكتروني</th>
                <th scope="col" className="p-4">الصلاحية</th>
                <th scope="col" className="p-4">تاريخ الانضمام</th>
                <th scope="col" className="p-4 text-center">الإجراءات الإدارية</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-foreground">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                          {item.name ? item.name.charAt(0) : 'م'}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">{item.email}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        item.role === 'admin' 
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {item.role === 'admin' ? 'مدير نظام' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {item.createdAt 
                        ? new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : (item.createdAt as any)).toLocaleDateString('ar-SA')
                        : 'غير مسجل'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Open details modal */}
                        <button
                          onClick={() => setSelectedUser(item)}
                          className="flex items-center gap-1 text-[10px] bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary px-2.5 py-1.5 rounded-lg"
                          title="عرض إحصائيات وتعديل صلاحيات العضو"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>التفاصيل والصلاحية</span>
                        </button>

                        {/* Soft Delete */}
                        <button
                          onClick={() => handleSoftDelete(item)}
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
                  <td colSpan={5} className="p-12 text-center text-muted-foreground select-none">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-bold text-sm">لم يتم العثور على أي أعضاء مسجلين.</p>
                    <p className="text-xs mt-1">تأكد من صحة الكلمات في مربع البحث أو الفلاتر.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Stats/Role Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRoleChanged={handleRoleChanged}
        />
      )}

    </div>
  );
}
