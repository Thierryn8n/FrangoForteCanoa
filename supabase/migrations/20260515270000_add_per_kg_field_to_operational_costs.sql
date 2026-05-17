-- ============================================================
-- ADD PER KG FIELD TO OPERATIONAL COSTS
-- Adicionar campo para ratear custos por KG vendido
-- ============================================================

-- Adicionar campo para indicar se o custo deve ser rateado por KG vendido
ALTER TABLE public.operational_costs 
ADD COLUMN IF NOT EXISTS rate_per_kg BOOLEAN DEFAULT false;

-- Adicionar comentário
COMMENT ON COLUMN public.operational_costs.rate_per_kg IS 'Se true, o custo será rateado por KG de frango vendido no período';
