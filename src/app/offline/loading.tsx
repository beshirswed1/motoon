'use client';

import React from 'react';
import { PageLoading } from '@/components/common/PageLoading';

export default function OfflineLoading() {
  return <PageLoading message="جاري تحميل وضع التشغيل دون اتصال..." />;
}
