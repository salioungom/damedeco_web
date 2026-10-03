import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SuperAdmin - DameDéco',
  description: 'Panneau SuperAdmin',
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
