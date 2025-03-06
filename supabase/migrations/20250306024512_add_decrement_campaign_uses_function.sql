-- Kampanyanın kalan kullanım sayısını azaltan fonksiyon
CREATE OR REPLACE FUNCTION decrement_campaign_uses(campaign_id UUID)
RETURNS void AS $$
BEGIN
  -- Kalan kullanım sayısını azalt
  UPDATE campaigns
  SET remaining_uses = remaining_uses - 1,
      -- Eğer kalan kullanım 0'a düştüyse durumu 'depleted' yap
      status = CASE 
        WHEN remaining_uses - 1 <= 0 THEN 'depleted'::campaign_status
        ELSE status
      END
  WHERE id = campaign_id
  AND remaining_uses > 0;
END;
$$ LANGUAGE plpgsql; 