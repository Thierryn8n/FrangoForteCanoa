import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Testar tabela customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5)

    if (customersError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar customers',
        details: customersError
      }, { status: 500 })
    }

    // Testar tabela customer_addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('customer_addresses')
      .select('*')
      .limit(5)

    if (addressesError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar customer_addresses',
        details: addressesError
      }, { status: 500 })
    }

    // Testar busca por telefone específico
    const { data: customerByPhone, error: phoneError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', '88996125274')
      .single()

    // Buscar endereços desse cliente
    let customerAddresses = []
    if (customerByPhone && !phoneError) {
      const { data: addr, error: addrError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerByPhone.id)
        .order('is_default', { ascending: false })

      if (!addrError) {
        customerAddresses = addr || []
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customers: customers || [],
        customer_addresses: addresses || [],
        customer_by_phone: customerByPhone || null,
        customer_addresses_by_phone: customerAddresses,
        phone_error: phoneError || null,
        tables_info: {
          customers_count: customers?.length || 0,
          addresses_count: addresses?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Erro na API de teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error
    }, { status: 500 })
  }
}
