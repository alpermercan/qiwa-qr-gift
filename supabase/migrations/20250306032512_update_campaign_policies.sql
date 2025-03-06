-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON campaigns;

-- Create new policies for campaigns
CREATE POLICY "Campaigns are viewable by everyone"
ON campaigns FOR SELECT
TO anon, authenticated
USING (true);

-- Create policy for updating campaigns
CREATE POLICY "Campaigns can be updated by authenticated users"
ON campaigns FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for inserting campaigns
CREATE POLICY "Campaigns can be created by authenticated users"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for deleting campaigns
CREATE POLICY "Campaigns can be deleted by authenticated users"
ON campaigns FOR DELETE
TO authenticated
USING (true); 