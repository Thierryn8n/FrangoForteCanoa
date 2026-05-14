-- Migration: 20260511170000_fix_orders_replica_identity.sql
-- Configurar REPLICA IDENTITY FULL para que o Supabase Realtime capture old values

-- Configurar REPLICA IDENTITY FULL para capturar valores antigos no realtime
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE print_jobs REPLICA IDENTITY FULL;
