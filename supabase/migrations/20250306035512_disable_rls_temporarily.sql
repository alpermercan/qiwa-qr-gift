-- Temporarily disable RLS on all tables
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be viewed by anyone with valid slug" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be created by authenticated users" ON qr_codes;

DROP POLICY IF EXISTS "Campaign participants are viewable by everyone" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants can be created by anyone" ON campaign_participants;

DROP POLICY IF EXISTS "Campaign participations are viewable by everyone" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations can be created by anyone" ON campaign_participations;

DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
DROP POLICY IF EXISTS "Campaigns can be updated by authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Campaigns can be created by authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Campaigns can be deleted by authenticated users" ON campaigns;