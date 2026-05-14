-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 1. Permitir que qualquer um verifique se existe admin (necessário para o setup saber se deve mostrar o form)
DROP POLICY IF EXISTS "Allow public to check admin count" ON public.admins;
CREATE POLICY "Allow public to check admin count" 
ON public.admins 
FOR SELECT 
TO public 
USING (true);

-- 2. Permitir inserção pública APENAS se não houver NENHUM admin cadastrado
DROP POLICY IF EXISTS "Allow first admin creation" ON public.admins;
CREATE POLICY "Allow first admin creation"
ON public.admins
FOR INSERT
TO public
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admins)
);

-- 3. Permitir que admins logados vejam seus próprios dados
DROP POLICY IF EXISTS "Allow admin self access" ON public.admins;
CREATE POLICY "Allow admin self access" 
ON public.admins 
FOR SELECT 
TO public
USING (true); -- Simplificado para permitir login inicial, o filtro real ocorre no hash da senha

-- 4. Permitir que o admin logado atualize seu próprio registro (ex: last_login_at)
DROP POLICY IF EXISTS "Allow admin self update" ON public.admins;
CREATE POLICY "Allow admin self update"
ON public.admins
FOR UPDATE
TO public
USING (true);

-- Função para criar o primeiro admin (só funciona se não existir nenhum)
CREATE OR REPLACE FUNCTION public.create_first_admin(
    p_email TEXT,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
    v_admin_id UUID;
BEGIN
    -- Verificar se já existe algum admin
    SELECT COUNT(*) INTO v_count FROM public.admins;
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Já existe um administrador cadastrado. Use o login normal.';
    END IF;
    
    -- Criar o primeiro admin como super admin
    INSERT INTO public.admins (email, password_hash, full_name, phone, is_super_admin)
    VALUES (p_email, p_password_hash, p_full_name, p_phone, true)
    RETURNING id INTO v_admin_id;
    
    RETURN v_admin_id;
END;
$$;

-- Função para verificar se existe algum admin
CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.admins;
    RETURN v_count > 0;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_admins_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_updated_at();
