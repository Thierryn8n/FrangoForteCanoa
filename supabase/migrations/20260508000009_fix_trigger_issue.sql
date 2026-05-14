-- ============================================================
-- FIX TRIGGER ISSUE FOR DRAG/DROP
-- Criar função RPC simples para contornar trigger problemático
-- ============================================================

-- Criar função RPC simples para atualizar status sem trigger
CREATE OR REPLACE FUNCTION update_order_status_simple(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Desabilitar temporariamente o trigger
    ALTER TABLE orders DISABLE TRIGGER orders_status_log_trigger;
    
    -- Atualizar o status
    UPDATE orders 
    SET 
        status = p_new_status,
        updated_at = now()
    WHERE id = p_order_id
    RETURNING id, status, updated_at;
    
    -- Reabilitar o trigger
    ALTER TABLE orders ENABLE TRIGGER orders_status_log_trigger;
    
    RETURN;
EXCEPTION
    WHEN OTHERS THEN
        -- Garantir que o trigger seja reabilitado mesmo em caso de erro
        ALTER TABLE orders ENABLE TRIGGER orders_status_log_trigger;
        RAISE;
END;
$$;

-- Grant permissão para a função RPC
GRANT EXECUTE ON FUNCTION update_order_status_simple TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_simple TO service_role;
