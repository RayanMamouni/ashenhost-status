'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StatusPageDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin#status-page');
  }, []);
  return null;
}
