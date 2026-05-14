import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminAuthProvider } from '@/contexts/admin-auth-context'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  )
}
