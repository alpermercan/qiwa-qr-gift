-- Önce tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Campaign participants are viewable by admin" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants can be created by anyone" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants are viewable by everyone" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants can be updated by anyone" ON campaign_participants;

DROP POLICY IF EXISTS "Campaign participations are viewable by admin" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations can be created by anyone" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations are viewable by everyone" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations can be updated by anyone" ON campaign_participations;

DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be created by anyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;

-- RLS'yi tüm tablolar için devre dışı bırak ve tekrar etkinleştir
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations DISABLE ROW LEVEL SECURITY;

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;

-- campaign_participants tablosu için politikalar
CREATE POLICY "Campaign participants are viewable by everyone"
ON campaign_participants FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Campaign participants can be created by anyone"
ON campaign_participants FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Campaign participants can be updated by anyone"
ON campaign_participants FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- campaign_participations tablosu için politikalar
CREATE POLICY "Campaign participations are viewable by everyone"
ON campaign_participations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Campaign participations can be created by anyone"
ON campaign_participations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Campaign participations can be updated by anyone"
ON campaign_participations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- qr_codes tablosu için politikalar
CREATE POLICY "QR codes are viewable by everyone"
ON qr_codes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "QR codes can be created by anyone"
ON qr_codes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "QR codes can be updated by anyone"
ON qr_codes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Bypass RLS for service_role
ALTER TABLE qr_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations FORCE ROW LEVEL SECURITY; 