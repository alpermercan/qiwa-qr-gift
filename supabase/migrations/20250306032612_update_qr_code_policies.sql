-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON qr_codes;
DROP POLICY IF EXISTS "QR codes can be updated by anyone" ON qr_codes;

-- Create new policies for QR codes
CREATE POLICY "QR codes are viewable by everyone"
ON qr_codes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "QR codes can be updated by anyone"
ON qr_codes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "QR codes can be created by authenticated users"
ON qr_codes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "QR codes can be deleted by authenticated users"
ON qr_codes FOR DELETE
TO authenticated
USING (true); 