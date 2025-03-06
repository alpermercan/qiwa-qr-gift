-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2) DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  remaining_uses INTEGER DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- Add check constraints
ALTER TABLE campaigns
ADD CONSTRAINT min_purchase_amount_check CHECK (min_purchase_amount >= 0);

ALTER TABLE campaigns
ADD CONSTRAINT max_discount_amount_check CHECK (max_discount_amount >= 0);

ALTER TABLE campaigns
ADD CONSTRAINT discount_rate_check CHECK (discount_rate BETWEEN 0 AND 100);

ALTER TABLE campaigns
ADD CONSTRAINT status_check CHECK (status IN ('active', 'expired', 'depleted'));
