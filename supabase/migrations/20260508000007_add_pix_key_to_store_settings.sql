-- Adicionar campo de configuração de chave PIX ao store_settings
-- Migration para permitir configuração via painel admin

-- Adicionar coluna pix_key ao store_settings
ALTER TABLE IF EXISTS store_settings
ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT 'frangoforte@pix.com';

-- Adicionar coluna pix_enabled para ativar/desativar PIX
ALTER TABLE IF EXISTS store_settings
ADD COLUMN IF NOT EXISTS pix_enabled BOOLEAN DEFAULT true;

-- Atualizar configuração padrão se não existir
UPDATE store_settings 
SET 
  pix_key = COALESCE(pix_key, 'frangoforte@pix.com'),
  pix_enabled = COALESCE(pix_enabled, true)
WHERE pix_key IS NULL OR pix_enabled IS NULL;

-- Verificar configuração atual
SELECT 
  id,
  store_name,
  pix_key,
  pix_enabled,
  updated_at
FROM store_settings 
LIMIT 1;

COMMIT;
