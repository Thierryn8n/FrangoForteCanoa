import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CustomerLayout } from '@/components/customer/customer-layout'

export default async function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/minha-conta')
  }

  // Fetch customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <CustomerLayout 
      customerName={customer?.full_name || user.email?.split('@')[0]} 
      customerEmail={user.email}
    >
      {children}
    </CustomerLayout>
  )
}
