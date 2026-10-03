'use client';

import { RequireRole } from '@/components/RequireRole';
import { CategoriesManagement } from '@/components/CategoriesManagement';

export default function AdminCategoriesPage() {
  return (
    <RequireRole allowedRoles={['admin', 'superadmin']}>
      <CategoriesManagement showStats={true} />
    </RequireRole>
  );
}
