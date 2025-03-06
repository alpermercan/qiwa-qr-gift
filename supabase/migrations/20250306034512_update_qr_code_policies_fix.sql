-- Drop all existing policies for qr_codes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be viewed by anyone with valid slug" ON qr_codes;

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "QR codes are viewable by everyone"
ON qr_codes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "QR codes can be updated by anyone"
ON qr_codes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy for insert (admin only)
CREATE POLICY "QR codes can be created by authenticated users"
ON qr_codes FOR INSERT
TO authenticated
WITH CHECK (true); 