-- Adicionar políticas de service role para bypass RLS
-- Execute este arquivo após a migration principal para permitir que service role key bypass restrições RLS

-- Política para stock_categories
CREATE POLICY "Service role can bypass RLS for stock_categories" 
  ON stock_categories FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para daily_stock_opening
CREATE POLICY "Service role can bypass RLS for daily_stock_opening" 
  ON daily_stock_opening FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para daily_stock_items
CREATE POLICY "Service role can bypass RLS for daily_stock_items" 
  ON daily_stock_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para stock_transactions
CREATE POLICY "Service role can bypass RLS for stock_transactions" 
  ON stock_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para farm_price_history
CREATE POLICY "Service role can bypass RLS for farm_price_history" 
  ON farm_price_history FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para operational_costs
CREATE POLICY "Service role can bypass RLS for operational_costs" 
  ON operational_costs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Política para daily_reports
CREATE POLICY "Service role can bypass RLS for daily_reports" 
  ON daily_reports FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
