-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create default policies for all tables
CREATE POLICY "Enable read access for authenticated users"
ON campaigns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON campaign_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON campaign_participations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON qr_codes FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to create participants and participations
CREATE POLICY "Enable insert for anonymous users"
ON campaign_participants FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users"
ON campaign_participations FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to update QR codes
CREATE POLICY "Enable update for anonymous users"
ON qr_codes FOR UPDATE
TO anon
USING (true)
WITH CHECK (true); 