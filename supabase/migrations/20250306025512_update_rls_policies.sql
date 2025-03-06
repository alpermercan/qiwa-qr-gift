-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Campaign participants are viewable by admin" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants can be created by anyone" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participations are viewable by admin" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations can be created by anyone" ON campaign_participations;
DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;

-- campaign_participants tablosu için politikalar
CREATE POLICY "Campaign participants are viewable by admin"
ON campaign_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaign participants can be created by anyone"
ON campaign_participants FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- campaign_participations tablosu için politikalar
CREATE POLICY "Campaign participations are viewable by admin"
ON campaign_participations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaign participations can be created by anyone"
ON campaign_participations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- qr_codes tablosu için güncelleme politikası
CREATE POLICY "QR codes can be updated by anyone"
ON qr_codes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true); 