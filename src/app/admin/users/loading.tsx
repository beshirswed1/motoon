'use client';

import React from 'react';
import { PageLoading } from '@/components/common/PageLoading';

export default function AdminUsersLoading() {
  return <PageLoading message="جاري تحميل قائمة المستخدمين..." />;
}
